import json
import logging
import re
from typing import Literal

from pydantic import BaseModel
from openai import OpenAI

from app.config import settings
from app.services import linter_service, docs_service

logger = logging.getLogger(__name__)
_client = OpenAI(api_key=settings.OPENAI_API_KEY)

SYSTEM_PROMPT = """\
You are a senior software engineer performing a thorough code review.

You have two tools available:
- `run_linter`: runs ruff on changed Python files to catch style/error issues
- `fetch_docs`: fetches official documentation for a package when you want to verify correct API usage

Strategy:
1. If the diff touches Python files, call `run_linter` first.
2. If the diff introduces new imports for packages you want to verify, call `fetch_docs`.
3. After gathering tool results, return a final JSON object — no more tool calls.

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
    {
        "type": "function",
        "function": {
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
    },
    {
        "type": "function",
        "function": {
            "name": "fetch_docs",
            "description": (
                "Fetch official documentation for a Python package. "
                "Use when the PR introduces a new import you want to verify correct usage of."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "module": {
                        "type": "string",
                        "description": "Top-level module name (e.g. 'fastapi', 'httpx', 'asyncio')",
                    },
                    "topic": {
                        "type": "string",
                        "description": "Optional: specific class or function to look up",
                    },
                },
                "required": ["module"],
            },
        },
    },
]


class Finding(BaseModel):
    file: str
    line: int | None
    severity: Literal["critical", "warning", "info"]
    message: str
    suggestion: str


def _dispatch_tool(name: str, args: dict, file_contents: dict[str, str]) -> str:
    if name == "run_linter":
        filenames = args.get("filenames", [])
        subset = {k: v for k, v in file_contents.items() if k in filenames}
        results = linter_service.run_ruff(subset)
        logger.info(f"[linter] ruff returned {len(results)} finding(s)")
        return json.dumps(results)

    if name == "fetch_docs":
        module = args.get("module", "")
        topic = args.get("topic", "")
        logger.info(f"[docs] fetching docs for '{module}' topic='{topic}'")
        return docs_service.fetch_docs(module, topic)

    return json.dumps({"error": f"Unknown tool: {name}"})


def _parse_findings(content: str) -> list[Finding]:
    """Parse the model's final JSON response into a list of Finding objects."""
    # Strip markdown code fences if the model wrapped its response
    content = re.sub(r"^```(?:json)?\s*", "", content.strip())
    content = re.sub(r"\s*```$", "", content.strip())

    try:
        raw = json.loads(content)
    except json.JSONDecodeError:
        # Last resort: find the first {...} block
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


def review_diff(diff: str) -> list[Finding]:
    """Run the agent loop: diff → tool calls → final findings."""
    if not diff.strip():
        return []

    max_diff_chars = 60_000
    if len(diff) > max_diff_chars:
        diff = diff[:max_diff_chars] + "\n\n[diff truncated — too large]"

    # Pre-extract Python file contents from the diff for the linter tool
    file_contents = linter_service.extract_python_files_from_diff(diff)
    py_filenames = list(file_contents.keys())

    user_content = f"Review this PR diff:\n\n```diff\n{diff}\n```"
    if py_filenames:
        user_content += f"\n\nPython files changed: {py_filenames}"

    messages: list[dict] = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_content},
    ]

    # Agent loop — capped at 5 iterations to control cost
    for iteration in range(5):
        response = _client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
            temperature=0.2,
        )

        msg = response.choices[0].message
        logger.info(f"[review] iteration {iteration + 1}, tool_calls={bool(msg.tool_calls)}")

        if not msg.tool_calls:
            # Final answer
            return _parse_findings(msg.content or "{}")

        # Execute tool calls and append results to the conversation
        messages.append(msg)
        for tool_call in msg.tool_calls:
            args = json.loads(tool_call.function.arguments)
            result = _dispatch_tool(tool_call.function.name, args, file_contents)
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": result,
            })

    logger.warning("[review] Agent loop hit max iterations without a final answer")
    return []
