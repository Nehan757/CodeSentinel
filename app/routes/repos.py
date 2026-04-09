import logging
from fastapi import APIRouter, BackgroundTasks
from app.services import indexing_service

logger = logging.getLogger(__name__)
router = APIRouter()


def _run_analysis(repo_full_name: str, branch: str) -> None:  # sync → runs in thread pool
    try:
        path = indexing_service.analyze_repo(repo_full_name, branch=branch)
        logger.info(f"[indexing] Manifest saved to {path}")
    except Exception:
        logger.exception(f"[indexing] Failed to analyze {repo_full_name}@{branch}")


@router.post("/repos/{owner}/{repo}/analyze", status_code=202)
async def analyze_repo(
    owner: str,
    repo: str,
    background_tasks: BackgroundTasks,
    branch: str = "main",
):
    repo_full_name = f"{owner}/{repo}"
    background_tasks.add_task(_run_analysis, repo_full_name, branch)
    return {
        "status": "accepted",
        "repo": repo_full_name,
        "branch": branch,
        "message": f"Indexing started. Manifest will be saved to indexes/{owner}_{repo}_{branch}_manifest.md",
    }
