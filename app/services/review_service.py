import json
from typing import Literal
from pydantic import BaseModel
from openai import OpenAI
from app.config import settings

_client = OpenAI(api_key=settings.OPENAI_API_KEY)

SYSTEM_PROMPT = """\
You are a senior software engineer performing a thorough code review.
Analyze the provided PR diff and return a JSON object with a single key "findings" \
containing a list of issues found.

Each finding must have:
- "file": the file path (string)
- "line": the line number from the diff where the issue is (integer or null)
- "severity": one of "critical", "warning", or "info"
- "message": a concise description of the issue (string)
- "suggestion": a concrete actionable suggestion to fix or improve it (string)

Focus on: bugs, security issues, error handling gaps, logic errors, and significant \
code quality problems. Skip trivial style nits unless they affect readability.
If the diff looks good with no issues, return {"findings": []}.
"""


class Finding(BaseModel):
    file: str
    line: int | None
    severity: Literal["critical", "warning", "info"]
    message: str
    suggestion: str


def review_diff(diff: str) -> list[Finding]:
    """Send the diff to OpenAI and parse structured findings."""
    if not diff.strip():
        return []

    # Truncate very large diffs to avoid token limits
    max_diff_chars = 60_000
    if len(diff) > max_diff_chars:
        diff = diff[:max_diff_chars] + "\n\n[diff truncated — too large]"

    response = _client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Review this PR diff:\n\n```diff\n{diff}\n```"},
        ],
        temperature=0.2,
    )

    raw = json.loads(response.choices[0].message.content)
    findings_data = raw.get("findings", [])

    findings = []
    for item in findings_data:
        try:
            findings.append(Finding(**item))
        except Exception:
            continue  # skip malformed entries

    return findings
