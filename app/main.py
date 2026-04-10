import logging
from fastapi import FastAPI
from app.routes import health, repos, webhook

# ANSI color codes
_RESET  = "\033[0m"
_GREY   = "\033[90m"
_CYAN   = "\033[96m"
_GREEN  = "\033[92m"
_YELLOW = "\033[93m"
_RED    = "\033[91m"
_BOLD   = "\033[1m"

_LEVEL_COLORS = {
    "DEBUG":    _GREY,
    "INFO":     _GREEN,
    "WARNING":  _YELLOW,
    "ERROR":    _RED,
    "CRITICAL": _RED + _BOLD,
}


class _ColorFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        level_color = _LEVEL_COLORS.get(record.levelname, "")
        record.levelname = f"{level_color}{record.levelname}{_RESET}"
        record.name = f"{_CYAN}{record.name}{_RESET}"
        record.asctime = self.formatTime(record, self.datefmt)
        record.asctime = f"{_GREY}{record.asctime}{_RESET}"
        return (
            f"{record.asctime} [{record.levelname}] {record.name}: {record.getMessage()}"
        )


_handler = logging.StreamHandler()
_handler.setFormatter(_ColorFormatter())
logging.basicConfig(level=logging.INFO, handlers=[_handler])

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
