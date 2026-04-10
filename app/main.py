import logging
from fastapi import FastAPI
from app.routes import health, repos, webhook

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

app = FastAPI(
    title="CodeSentinel",
    description="AI-powered GitHub PR code review bot — Phase 2",
    version="0.2.1",
)

app.include_router(health.router)
app.include_router(webhook.router)
app.include_router(repos.router)


@app.get("/")
def root():
    return {"service": "CodeSentinel", "version": "0.2.1", "phase": 2}
