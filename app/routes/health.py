from fastapi import APIRouter
from app.config import settings

router = APIRouter()


@router.get("/health")
def health():
    return {
        "status": "ok",
        "openai_model": settings.OPENAI_MODEL,
        "openai": "configured" if settings.OPENAI_API_KEY else "missing",
        "github": "configured" if settings.GITHUB_TOKEN else "missing",
    }
