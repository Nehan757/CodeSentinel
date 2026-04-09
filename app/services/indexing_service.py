import os
from pathlib import Path
from app.services import github_service

# Files/dirs to skip during analysis
SKIP_PATTERNS = {
    "node_modules", "__pycache__", ".git", ".venv", "venv", "env",
    "dist", "build", ".next", ".nuxt", "coverage",
}
SKIP_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp",
    ".pdf", ".zip", ".tar", ".gz", ".whl", ".egg",
    ".pyc", ".pyo", ".so", ".dylib", ".dll", ".exe",
    ".min.js", ".min.css", ".map",
    ".lock",  # package-lock.json, yarn.lock, Cargo.lock
}
SKIP_FILENAMES = {
    "package-lock.json", "yarn.lock", "Cargo.lock", "poetry.lock",
    "Pipfile.lock", "composer.lock", "Gemfile.lock",
}
MAX_FILE_SIZE = 50_000  # bytes — skip files larger than this
PREVIEW_LINES = 30


def _should_skip(path: str, size: int | None) -> bool:
    parts = Path(path).parts
    if any(p in SKIP_PATTERNS for p in parts):
        return True
    if Path(path).name in SKIP_FILENAMES:
        return True
    suffix = Path(path).suffix.lower()
    if suffix in SKIP_EXTENSIONS:
        return True
    if path.endswith(".min.js") or path.endswith(".min.css"):
        return True
    if size and size > MAX_FILE_SIZE:
        return True
    return False


def _language_from_path(path: str) -> str:
    ext_map = {
        ".py": "Python", ".js": "JavaScript", ".ts": "TypeScript",
        ".jsx": "JSX", ".tsx": "TSX", ".java": "Java", ".go": "Go",
        ".rs": "Rust", ".cpp": "C++", ".c": "C", ".cs": "C#",
        ".rb": "Ruby", ".php": "PHP", ".swift": "Swift", ".kt": "Kotlin",
        ".sh": "Shell", ".yaml": "YAML", ".yml": "YAML", ".json": "JSON",
        ".toml": "TOML", ".md": "Markdown", ".html": "HTML", ".css": "CSS",
        ".sql": "SQL", ".tf": "Terraform", ".dockerfile": "Dockerfile",
    }
    name = Path(path).name.lower()
    if name == "dockerfile":
        return "Dockerfile"
    return ext_map.get(Path(path).suffix.lower(), "Text")


def _build_tree_string(file_paths: list[str]) -> str:
    """Build a simple indented file tree from a flat list of paths."""
    lines = []
    seen_dirs: set[str] = set()
    for path in sorted(file_paths):
        parts = Path(path).parts
        for i, part in enumerate(parts[:-1]):
            dir_path = "/".join(parts[: i + 1])
            if dir_path not in seen_dirs:
                seen_dirs.add(dir_path)
                lines.append("  " * i + f"📁 {part}/")
        lines.append("  " * (len(parts) - 1) + f"📄 {parts[-1]}")
    return "\n".join(lines)


def analyze_repo(repo_full_name: str, branch: str = "main") -> str:
    """
    Walk the repo, fetch file contents, and write a structured .md manifest.
    Returns the path to the generated file.
    """
    print(f"[indexing] Starting analysis of {repo_full_name}@{branch}")

    tree = github_service.get_repo_tree(repo_full_name, branch=branch)
    all_paths = [f["path"] for f in tree]

    # Filter to analysable files
    analysable = [
        f for f in tree if not _should_skip(f["path"], f.get("size"))
    ]

    print(f"[indexing] {len(tree)} total files, {len(analysable)} will be documented")

    # Build manifest sections
    sections = []

    # Header
    sections.append(f"# Project Manifest: `{repo_full_name}`\n")
    sections.append(f"**Branch:** `{branch}`  \n")
    sections.append(f"**Total files:** {len(tree)}  \n")
    sections.append(f"**Documented files:** {len(analysable)}\n")
    sections.append("\n---\n")

    # File tree
    sections.append("## File Tree\n")
    sections.append("```")
    sections.append(_build_tree_string(all_paths))
    sections.append("```\n")
    sections.append("\n---\n")

    # File summaries
    sections.append("## File Summaries\n")

    for file_info in analysable:
        path = file_info["path"]
        size = file_info.get("size", 0)
        lang = _language_from_path(path)

        try:
            content = github_service.get_file_content(repo_full_name, path, branch=branch)
        except Exception as e:
            print(f"[indexing] Could not fetch {path}: {e}")
            content = ""

        lines = content.splitlines()
        line_count = len(lines)
        preview = "\n".join(lines[:PREVIEW_LINES])
        truncated = line_count > PREVIEW_LINES

        sections.append(f"### `{path}`\n")
        sections.append(f"**Language:** {lang} | **Lines:** {line_count} | **Size:** {size} bytes\n")
        if preview:
            fence = f"```{lang.lower()}"
            sections.append(fence)
            sections.append(preview)
            if truncated:
                sections.append(f"\n... ({line_count - PREVIEW_LINES} more lines)")
            sections.append("```\n")
        sections.append("")

    manifest = "\n".join(sections)

    # Save to disk
    indexes_dir = Path(__file__).parent.parent.parent / "indexes"
    indexes_dir.mkdir(exist_ok=True)

    safe_name = repo_full_name.replace("/", "_")
    out_path = indexes_dir / f"{safe_name}_{branch}_manifest.md"
    out_path.write_text(manifest, encoding="utf-8")

    print(f"[indexing] Manifest written to {out_path}")
    return str(out_path)
