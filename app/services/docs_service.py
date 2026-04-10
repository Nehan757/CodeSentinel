import re
import httpx

# Allowlisted domains — only these are ever fetched
ALLOWLIST: dict[str, str] = {
    "fastapi": "https://fastapi.tiangolo.com/",
    "pydantic": "https://docs.pydantic.dev/latest/",
    "httpx": "https://www.python-httpx.org/",
    "starlette": "https://www.starlette.io/",
    "asyncio": "https://docs.python.org/3/library/asyncio.html",
    "typing": "https://docs.python.org/3/library/typing.html",
    "pathlib": "https://docs.python.org/3/library/pathlib.html",
    "os": "https://docs.python.org/3/library/os.html",
    "json": "https://docs.python.org/3/library/json.html",
    "subprocess": "https://docs.python.org/3/library/subprocess.html",
    "logging": "https://docs.python.org/3/library/logging.html",
    "datetime": "https://docs.python.org/3/library/datetime.html",
    "re": "https://docs.python.org/3/library/re.html",
    "celery": "https://docs.celeryq.dev/en/stable/",
    "redis": "https://redis-py.readthedocs.io/en/stable/",
    "sqlalchemy": "https://docs.sqlalchemy.org/",
    "openai": "https://platform.openai.com/docs/overview",
}


def detect_new_imports(diff: str) -> list[str]:
    """
    Extract top-level module names from newly added import lines in the diff.
    Returns only modules present in ALLOWLIST.
    """
    modules: set[str] = set()
    for line in diff.splitlines():
        if not line.startswith("+") or line.startswith("+++"):
            continue
        stripped = line[1:].strip()
        m = re.match(r"^import\s+([\w.]+)", stripped)
        if m:
            modules.add(m.group(1).split(".")[0])
            continue
        m = re.match(r"^from\s+([\w.]+)\s+import", stripped)
        if m:
            modules.add(m.group(1).split(".")[0])

    return [mod for mod in modules if mod in ALLOWLIST]


def fetch_docs(module: str, topic: str = "") -> str:
    """
    Fetch documentation for a module from the allowlist.
    Returns truncated plain text (strips HTML tags).
    """
    if module not in ALLOWLIST:
        return f"Module '{module}' is not in the documentation allowlist. Allowed: {', '.join(ALLOWLIST)}"

    url = ALLOWLIST[module]
    try:
        with httpx.Client(timeout=10, follow_redirects=True) as client:
            resp = client.get(url, headers={"User-Agent": "CodeSentinel/2.0"})
            resp.raise_for_status()
            text = re.sub(r"<[^>]+>", " ", resp.text)
            text = re.sub(r"\s+", " ", text).strip()
            snippet = text[:2000]
            return f"[Docs: {module} — {url}]\n\n{snippet}"
    except Exception as exc:
        return f"Failed to fetch docs for '{module}' ({url}): {exc}"
