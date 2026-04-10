import json
import logging
import re
from typing import Literal

from pydantic import BaseModel
from openai import OpenAI

from app.config import settings
from app.services import linter_service, github_service

logger = logging.getLogger(__name__)
_client = OpenAI(api_key=settings.OPENAI_API_KEY)

SYSTEM_PROMPT = """\
You are a senior software engineer performing a thorough code review.

You have the following tools available:
- `run_linter`: runs ruff on changed Python files to catch style/error issues
- `tavily-search`: searches the web for documentation, CVEs, known issues, or API usage examples
- `tavily-extract`: extracts content from a specific URL when you have a direct link to documentation

Strategy:
1. If the diff touches Python files, call `run_linter` exactly once. Do not call it again.
2. If the diff introduces imports or patterns you want to verify against official documentation \
or known vulnerabilities, use `tavily-search` with a targeted query \
(e.g. "fastapi BackgroundTasks thread safety", "httpx AsyncClient context manager").
3. After gathering tool results, return your final JSON — no more tool calls.
4. Only report findings for files explicitly present in the diff. Do not invent file paths.

Your final response MUST be a raw JSON object (no markdown fences) with a single key "findings" \
containing a list of issues found.

Each finding must have:
- "file": the file path (string)
- "line": the line number from the diff where the issue is (integer or null)
- "severity": one of "critical", "warning", or "info"
- "message": a concise description of the issue (string)
- "suggestion": a concrete actionable suggestion to fix or improve it (string)

Focus on: bugs, security issues, error handling gaps, logic errors, and significant code quality \
problems. Include linter findings that represent real issues; filter out pure style nits unless \
they affect readability. If the diff looks good with no issues, return {"findings": []}.
"""

TOOLS = [
    # Local function tool — dispatched in our process
    # Responses API uses flat schema: name/description/parameters at top level (not nested under "function")
    {
        "type": "function",
        "name": "run_linter",
        "description": (
            "Run ruff linter on Python files changed in this PR. "
            "Call this for any PR that touches .py files."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "filenames": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Python filenames present in the diff (e.g. ['app/main.py'])",
                }
            },
            "required": ["filenames"],
        },
    },
    # MCP tool — dispatched server-side by OpenAI; we never write dispatch code for it
    {
        "type": "mcp",
        "server_label": "tavily",
        "server_url": f"https://mcp.tavily.com/mcp/?tavilyApiKey={settings.TAVILY_API_KEY}",
        "require_approval": "never",
    },
]


class Finding(BaseModel):
    file: str
    line: int | None
    severity: Literal["critical", "warning", "info"]
    message: str
    suggestion: str


def _dispatch_tool(name: str, args: dict, file_contents: dict[str, str]) -> str:
    """Dispatch local function tool calls. MCP tools are handled server-side by OpenAI."""
    if name == "run_linter":
        filenames = args.get("filenames", [])
        subset = {k: v for k, v in file_contents.items() if k in filenames}
        results = linter_service.run_ruff(subset)
        logger.info(f"[linter] ruff returned {len(results)} finding(s)")
        return json.dumps(results)

    return json.dumps({"error": f"Unknown tool: {name}"})


def _parse_findings(content: str) -> list[Finding]:
    """Parse the model's final JSON response into a list of Finding objects."""
    content = re.sub(r"^```(?:json)?\s*", "", content.strip())
    content = re.sub(r"\s*```$", "", content.strip())

    try:
        raw = json.loads(content)
    except json.JSONDecodeError:
        m = re.search(r"\{.*\}", content, re.DOTALL)
        if not m:
            logger.warning("[review] Could not parse model response as JSON")
            return []
        try:
            raw = json.loads(m.group())
        except json.JSONDecodeError:
            logger.warning("[review] Regex fallback match was not valid JSON")
            return []

    findings = []
    for item in raw.get("findings", []):
        try:
            findings.append(Finding(**item))
        except Exception:
            continue
    return findings


def review_diff(diff: str, repo_full_name: str, pr_number: int) -> list[Finding]:
    """Run the agent loop: diff → tool calls (linter + Tavily MCP) → final findings."""
    if not diff.strip():
        return []

    max_diff_chars = 60_000
    if len(diff) > max_diff_chars:
        diff = diff[:max_diff_chars] + "\n\n[diff truncated — too large]"

    # Get changed Python filenames from the diff, then fetch full file content
    # from the PR head branch so ruff has complete context (no false positives).
    pr_head_ref = f"refs/pull/{pr_number}/head"
    py_filenames = linter_service.get_python_filenames_from_diff(diff)
    file_contents: dict[str, str] = {}
    for filename in py_filenames:
        try:
            file_contents[filename] = github_service.get_file_content(
                repo_full_name, filename, branch=pr_head_ref
            )
        except Exception:
            logger.warning(f"[review] Could not fetch {filename} from {pr_head_ref}, skipping")

    user_content = f"Review this PR diff:\n\n```diff\n{diff}\n```"
    if py_filenames:
        user_content += f"\n\nPython files changed: {py_filenames}"

    # Responses API uses `input`, not `messages`
    input_items: list = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_content},
    ]

    # Agent loop — capped at 5 iterations to control cost.
    # MCP tool calls (Tavily) are resolved server-side before the response returns.
    # Only local function_call items require local dispatch and a follow-up iteration.
    # run_linter is removed from the tools list after its first dispatch to prevent
    # the model from calling it repeatedly when it receives an empty result.
    active_tools = list(TOOLS)
    linter_called = False

    for iteration in range(5):
        response = _client.responses.create(
            model=settings.OPENAI_MODEL,
            input=input_items,
            tools=active_tools,
            temperature=0.2,
        )

        function_calls = [
            item for item in response.output
            if item.type == "function_call"
        ]

        logger.info(
            f"[review] iteration {iteration + 1} — "
            f"function_calls={len(function_calls)}, "
            f"output_items={len(response.output)}"
        )

        if not function_calls:
            # No local tools pending — model produced its final answer
            return _parse_findings(response.output_text or "{}")

        # Extend with the full assistant turn (includes any completed MCP call items).
        # Each item in response.output is already a first-class input item — do not wrap.
        input_items.extend(response.output)

        # Dispatch each local function call and append its result
        for fc in function_calls:
            args = json.loads(fc.arguments)
            result = _dispatch_tool(fc.name, args, file_contents)
            logger.info(f"[review] dispatched {fc.name}, result length={len(result)}")
            input_items.append({
                "type": "function_call_output",
                "call_id": fc.call_id,
                "output": result,
            })
            if fc.name == "run_linter" and not linter_called:
                linter_called = True
                # Drop run_linter from active tools so the model cannot call it again
                active_tools = [t for t in active_tools if t.get("name") != "run_linter"]

    logger.warning("[review] Agent loop hit max iterations without a final answer")
    return []
