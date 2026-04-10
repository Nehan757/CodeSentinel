# CLAUDE.md(claude --resume "codesentinel-phase-one-setup")

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

CodeSentinel is an AI-powered GitHub PR code review bot. It receives GitHub webhook events, sends the PR diff to OpenAI for analysis, and posts structured review comments back on the PR. It also has a repo analysis feature that generates a `.md` manifest of any codebase (groundwork for future RAG).

**Deployed at:** `http://65.0.64.192:8000` (AWS Lightsail, Ubuntu)

## Development

```bash
# Install deps (use a venv)
pip install -r requirements.txt

# Copy and fill in credentials
cp .env.example .env

# Run locally
uvicorn app.main:app --reload

# Run on server (production)
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Required env vars** (in `.env`):
- `OPENAI_API_KEY` — GPT-4o for review
- `GITHUB_TOKEN` — fine-grained PAT with Pull requests (R/W) + Contents (R)
- `GITHUB_WEBHOOK_SECRET` — shared secret set in GitHub repo webhook settings
- `OPENAI_MODEL` — defaults to `gpt-4o`

## Architecture

**Request flow:**
```
GitHub PR event
  → POST /webhook/github   (verify HMAC-SHA256 signature)
  → BackgroundTask: _run_review()
      → github_service.get_pr_diff()     # raw unified diff via GitHub API
      → review_service.review_diff()     # OpenAI JSON-mode → list[Finding]
      → github_service.post_review()     # single GitHub Reviews API call
```

**Analyze flow:**
```
POST /repos/{owner}/{repo}/analyze
  → BackgroundTask: _run_analysis()
      → github_service.get_repo_tree()   # Git Trees API, recursive
      → github_service.get_file_content() per file
      → writes indexes/{owner}_{repo}_{branch}_manifest.md
```

**Key design choices:**
- No Celery/Redis — FastAPI `BackgroundTasks` is enough for Phase 1. Sync background functions run in Starlette's thread pool (do not use `async def` for blocking IO tasks).
- GitHub API only — no git clone. PyGithub + httpx for all GitHub interactions.
- OpenAI `response_format={"type": "json_object"}` enforces structured output. The `Finding` Pydantic model in `review_service.py` validates each item.
- `post_review()` always posts a comment — even on 0 findings (posts a "✅ No issues found" message).

**Layer contracts:**
- `app/routes/` — HTTP only, no business logic
- `app/services/` — all logic lives here, no HTTP framework imports
- `app/config.py` — single `settings` singleton imported everywhere

## Testing Strategy

CodeSentinel reviews its own PRs, so testing must be done carefully to avoid noise from large accumulated diffs.

### Branches
- `main` — stable, production
- `dev` — active development branch; PRs from `dev → main` are the real releases
- `test` — throwaway branch for validating reviewer quality; never merged

### How to Test the Reviewer

**Do not use `dev → main` PRs to validate review quality.** Those PRs accumulate many commits of debugging history, producing large noisy diffs that cause the model to hallucinate stale findings.

Use the `test` branch instead:

```bash
git checkout test
git pull

# Make a small focused change — a new file, a function, a bug
# The change should have at least one real issue for CodeSentinel to catch

git add <file>
git commit -m "test: <description>"
git push origin test
```

Then open a PR from `test → dev` on GitHub. CodeSentinel will review it automatically.

**Good test PRs:**
- Single file, 1–2 commits
- Contains at least one real issue (mutable default arg, bare except, missing error handling, etc.)
- Focused scope — the model performs best on clean, small diffs

**After testing:**
- Close the PR without merging
- Reset or amend commits on `test` as needed for the next test run
- Never merge `test` into `dev` or `main`

### What to Verify
- Findings reference only files present in the diff (no hallucinated paths)
- Severity levels are appropriate (bugs → critical/warning, style → info)
- Linter findings (ruff) align with model findings — linter catches B/E/F codes, model catches logic/design issues
- Loop completes in 2 iterations max (linter → optional Tavily search → final answer)

## Roadmap

### Phase 1 — Done ✅
Single OpenAI call reviews the diff. No tools, no agents, no RAG.

### Phase 2 — Done ✅
Implemented:
- **Linter tool** (`run_linter`): fetches full file content from PR head branch (`refs/pull/{pr_number}/head`), runs `ruff` locally, returns structured findings. Locked to a single call per review loop.
- **Web search tool** (`tavily-search`, `tavily-extract`): Tavily MCP via OpenAI Responses API. Dispatched server-side — no local dispatch code needed.
- Hand-built agent loop using OpenAI **Responses API** with mixed tool types (local function + MCP). Max 5 iterations.
- Removed lines stripped from diff before sending to model to prevent stale findings.
- Per-iteration tool i/o logging for full transparency.
- `test → dev` branch strategy for validating review quality on clean single-commit PRs.

### Phase 3 — Next: Basic RAG + Celery + Redis
Use the `.md` manifests generated by the analyze feature as the RAG corpus:
- Embed with `text-embedding-3-small`
- Store in FAISS (in-process, persisted to disk)
- At review time: query with function/class names from the diff → inject relevant project context into the review prompt

**Also introduce Celery + Redis in this phase** (review time grows significantly with RAG, BackgroundTasks becomes a liability):
- Redis DB 0: task queue (incoming review jobs)
- Redis DB 1: task state (PENDING → STARTED → PROGRESS → SUCCESS/FAILURE)
- Replace `background_tasks.add_task(_run_review, ...)` with `review_pr.delay(...)`
- Add `GET /reviews/{task_id}` endpoint to poll task state from DB 1
- Run 3 processes: uvicorn + celery worker + redis-server

### Phase 4 — Full CRAG Multi-agent
Full Corrective RAG pipeline as designed in `codesentinel-blueprint.jsx`:
- 5-agent CRAG flow: Context Retrieval → Relevance Evaluation (score > 0.75) → Query Refinement → External Knowledge → Response Synthesis
- AST-boundary chunking (not fixed-token) for better retrieval precision
- ReAct agent loop with 3 tools: `run_linter`, `search_project_context`, `search_official_docs`
- Inline GitHub review comments per finding (critical → inline, info → summary)
- Per-repo config via `.codesentinel.yml`

**Decide Redis persistence in this phase** — evaluate based on load and criticality:
- Default (Phase 3): Redis is pure RAM — a crash loses all pending tasks in DB 0 (lost reviews, no data corruption)
- If high volume or retries are critical: enable `appendonly yes` in `redis.conf` — Redis writes every operation to disk, survives crashes at the cost of ~10% performance
- If task history matters long-term: migrate DB 1 to PostgreSQL as the result backend

**Decide `result_expires` in this phase** — two valid approaches:
- **Skip expiry (recommended until Phase 4)**: results accumulate in DB 1, enabling failed-task debugging, idempotency checks (don't re-review same PR), and audit trail. At low PR volume this won't clog RAM.
- **Set expiry**: `result_expires = 3600` in celery config — Celery auto-purges results after 1 hour. Keeps DB 1 bounded but loses debuggability and history.
- **Correct long-term answer**: skip expiry in Phase 3, migrate DB 1 to PostgreSQL in Phase 4 for permanent storage — then Redis is just a temporary holding area and expiry becomes irrelevant.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Config status check |
| GET | `/docs` | FastAPI auto-docs (Swagger UI) |
| POST | `/webhook/github` | GitHub PR webhook receiver |
| POST | `/repos/{owner}/{repo}/analyze` | Trigger repo manifest generation |
