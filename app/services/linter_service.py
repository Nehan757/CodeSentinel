import json
import subprocess
import tempfile
from pathlib import Path


def extract_python_files_from_diff(diff: str) -> dict[str, str]:
    """
    Parse a unified diff and return {filename: reconstructed_content} for Python files.

    Reconstructed content = context lines + added lines (removed lines excluded).
    This is a partial view of the file (only changed hunks), sufficient for ruff
    to catch issues in the changed code.
    """
    files: dict[str, str] = {}
    current_file: str | None = None
    lines: list[str] = []

    for raw in diff.splitlines():
        if raw.startswith("+++ b/"):
            if current_file and current_file.endswith(".py"):
                files[current_file] = "\n".join(lines)
            current_file = raw[6:]
            lines = []
        elif raw.startswith(("--- ", "diff --git ", "index ", "new file ", "deleted file ")):
            continue
        elif raw.startswith("@@"):
            continue
        elif current_file and current_file.endswith(".py"):
            if raw.startswith("+") and not raw.startswith("+++"):
                lines.append(raw[1:])
            elif raw.startswith(" "):
                lines.append(raw[1:])
            # lines starting with "-" are removed — skip

    if current_file and current_file.endswith(".py"):
        files[current_file] = "\n".join(lines)

    return files


def run_ruff(file_contents: dict[str, str]) -> list[dict]:
    """
    Write file contents to a temp dir, run ruff, return structured findings.

    Each finding: {file, line, col, code, message, url}
    Returns [] if ruff is not installed or there are no findings.
    """
    if not file_contents:
        return []

    findings = []
    with tempfile.TemporaryDirectory() as tmpdir:
        paths: list[str] = []
        for filename, content in file_contents.items():
            dest = Path(tmpdir) / filename
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(content, encoding="utf-8")
            paths.append(str(dest))

        try:
            result = subprocess.run(
                [
                    "ruff", "check",
                    "--output-format=json",
                    "--no-cache",
                    # Exclude rules that produce false positives on partial diff content:
                    # E9xx = syntax errors (file is incomplete, not broken)
                    # F821 = undefined name (imports may be outside the diffed hunk)
                    # F401 = unused import (full file not available to verify usage)
                    "--extend-ignore=E9,F821,F401",
                ] + paths,
                capture_output=True,
                text=True,
                timeout=30,
            )
        except FileNotFoundError:
            # ruff not installed — silently skip
            return []
        except subprocess.TimeoutExpired:
            return []

        if not result.stdout:
            return []

        try:
            raw = json.loads(result.stdout)
        except json.JSONDecodeError:
            return []

        prefix = tmpdir + "/"
        for item in raw:
            abs_path = item.get("filename", "")
            rel_path = abs_path.removeprefix(prefix)
            findings.append({
                "file": rel_path,
                "line": item.get("location", {}).get("row"),
                "col": item.get("location", {}).get("column"),
                "code": item.get("code", ""),
                "message": item.get("message", ""),
                "url": item.get("url", ""),
            })

    return findings
