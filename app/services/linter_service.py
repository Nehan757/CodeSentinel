import json
import subprocess
import tempfile
from pathlib import Path


def get_python_filenames_from_diff(diff: str) -> list[str]:
    """Return list of Python file paths touched in the diff."""
    filenames = []
    for line in diff.splitlines():
        if line.startswith("+++ b/") and line.endswith(".py"):
            filenames.append(line[6:])
    return filenames


def run_ruff(file_contents: dict[str, str]) -> list[dict]:
    """
    Write full file contents to a temp dir, run ruff, return structured findings.

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
                ["ruff", "check", "--output-format=json", "--no-cache"] + paths,
                capture_output=True,
                text=True,
                timeout=30,
            )
        except FileNotFoundError:
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
