import hashlib
import hmac
import logging
from fastapi import APIRouter, BackgroundTasks, Header, HTTPException, Request
from app.config import settings
from app.services import github_service, review_service

logger = logging.getLogger(__name__)
router = APIRouter()


def _verify_signature(payload: bytes, signature: str) -> bool:
    """Verify GitHub HMAC-SHA256 webhook signature."""
    expected = "sha256=" + hmac.new(
        settings.GITHUB_WEBHOOK_SECRET.encode(),
        payload,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


# Note: request.json() re-reads the body — must be called after reading body bytes


def _run_review(repo_full_name: str, pr_number: int) -> None:
    """Background task: fetch diff → review → post findings."""
    try:
        logger.info(f"[review] Starting review for {repo_full_name}#{pr_number}")
        diff = github_service.get_pr_diff(repo_full_name, pr_number)
        findings = review_service.review_diff(diff)
        logger.info(f"[review] Found {len(findings)} findings for {repo_full_name}#{pr_number}")
        github_service.post_review(
            repo_full_name,
            pr_number,
            [f.model_dump() for f in findings],
        )
        logger.info(f"[review] Review posted for {repo_full_name}#{pr_number}")
    except Exception:
        logger.exception(f"[review] Failed to review {repo_full_name}#{pr_number}")


@router.post("/webhook/github", status_code=202)
async def github_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    x_hub_signature_256: str = Header(None),
    x_github_event: str = Header(None),
):
    payload = await request.body()

    # Verify signature
    if not x_hub_signature_256:
        raise HTTPException(status_code=400, detail="Missing signature header")
    if not _verify_signature(payload, x_hub_signature_256):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    # Only handle pull_request events
    if x_github_event != "pull_request":
        return {"status": "ignored", "reason": f"event '{x_github_event}' not handled"}

    data = await request.json()
    action = data.get("action")
    if action not in ("opened", "synchronize", "reopened"):
        return {"status": "ignored", "reason": f"action '{action}' not handled"}

    repo_full_name = data["repository"]["full_name"]
    pr_number = data["pull_request"]["number"]

    background_tasks.add_task(_run_review, repo_full_name, pr_number)

    return {"status": "accepted", "repo": repo_full_name, "pr": pr_number}
