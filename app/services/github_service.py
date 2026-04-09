import httpx
from github import Github
from app.config import settings

_gh = Github(settings.GITHUB_TOKEN)


def get_pr_diff(repo_full_name: str, pr_number: int) -> str:
    """Fetch the raw unified diff for a PR."""
    url = f"https://api.github.com/repos/{repo_full_name}/pulls/{pr_number}"
    headers = {
        "Authorization": f"token {settings.GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3.diff",
    }
    with httpx.Client(timeout=30) as client:
        response = client.get(url, headers=headers)
        response.raise_for_status()
        return response.text


def post_review(repo_full_name: str, pr_number: int, findings: list[dict]) -> None:
    """Post all findings as a single GitHub PR review comment."""
    if not findings:
        body = (
            "## CodeSentinel Review\n\n"
            "✅ **No issues found.** This diff looks clean — no bugs, security issues, "
            "or significant code quality problems detected."
        )
    else:
        lines = ["## CodeSentinel Review\n"]
        for f in findings:
            severity_emoji = {"critical": "🔴", "warning": "🟡", "info": "🔵"}.get(
                f.get("severity", "info"), "🔵"
            )
            file_ref = f"**`{f['file']}`**" if f.get("line") is None else f"**`{f['file']}` line {f['line']}**"
            lines.append(f"### {severity_emoji} {f['severity'].upper()} — {file_ref}")
            lines.append(f"{f['message']}\n")
            if f.get("suggestion"):
                lines.append(f"**Suggestion:** {f['suggestion']}\n")
            lines.append("---")
        body = "\n".join(lines)

    repo = _gh.get_repo(repo_full_name)
    pr = repo.get_pull(pr_number)
    pr.create_review(body=body, event="COMMENT")


def get_repo_tree(repo_full_name: str, branch: str = "main") -> list[dict]:
    """Return flat list of all files in the repo via Git Trees API (recursive)."""
    repo = _gh.get_repo(repo_full_name)
    tree = repo.get_git_tree(sha=branch, recursive=True)
    return [
        {"path": item.path, "type": item.type, "size": item.size}
        for item in tree.tree
        if item.type == "blob"
    ]


def get_file_content(repo_full_name: str, path: str, branch: str = "main") -> str:
    """Fetch raw text content of a file via Contents API."""
    repo = _gh.get_repo(repo_full_name)
    content_file = repo.get_contents(path, ref=branch)
    return content_file.decoded_content.decode("utf-8", errors="replace")
