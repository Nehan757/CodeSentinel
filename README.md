# CodeSentinel

An AI-powered GitHub PR code review bot. When a pull request is opened or updated, CodeSentinel automatically reviews the diff, runs a linter, searches the web for relevant documentation and known issues, and posts a structured review comment directly on the PR.

**Deployed at:** `http://65.0.64.192:8000`

---

## How It Works

```
GitHub PR opened/updated
  → POST /webhook/github
  → Fetch PR diff (GitHub API)
  → Agent loop (OpenAI Responses API)
      ├── run_linter   → ruff on changed Python files
      └── tavily-search → web search via Tavily MCP
  → Post structured review comment on PR
```

The agent uses OpenAI's Responses API with two tools:
- **`run_linter`** — runs `ruff` locally on changed Python files, returns structured findings
- **`tavily-search` / `tavily-extract`** — real-time web search via Tavily MCP, used to verify API usage, check for CVEs, or look up documentation

---

## Setup

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd codesentinel
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in all values:

```env
OPENAI_API_KEY=sk-...          # OpenAI API key (GPT-4o recommended)
GITHUB_TOKEN=ghp_...           # GitHub fine-grained PAT (see permissions below)
GITHUB_WEBHOOK_SECRET=...      # Secret you set when configuring the webhook
OPENAI_MODEL=gpt-4o            # Model to use for review
TAVILY_API_KEY=tvly-...        # Tavily API key (from app.tavily.com)
```

### 3. Run the server

```bash
# Development
uvicorn app.main:app --reload

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

## Adding CodeSentinel as a Webhook to Your Repo

### Step 1 — Create a GitHub Fine-Grained Personal Access Token

Go to **GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.

Configure the token:

| Setting | Value |
|---|---|
| **Token name** | `codesentinel` |
| **Expiration** | Your choice (90 days recommended) |
| **Resource owner** | Your account or org |
| **Repository access** | Select the repos you want CodeSentinel to review |

Under **Repository permissions**, set:

| Permission | Level |
|---|---|
| **Pull requests** | Read and write (to post review comments) |
| **Contents** | Read-only (to fetch file contents for analysis) |
| **Metadata** | Read-only (required, auto-selected) |

Copy the generated token and set it as `GITHUB_TOKEN` in your `.env`.

---

### Step 2 — Add the Webhook to Your Repository

Go to your repository on GitHub → **Settings → Webhooks → Add webhook**.

Fill in the form:

| Field | Value |
|---|---|
| **Payload URL** | `http://65.0.64.192:8000/webhook/github` |
| **Content type** | `application/json` |
| **Secret** | A strong random string — copy this exactly into `GITHUB_WEBHOOK_SECRET` in your `.env` |
| **SSL verification** | Disable if using HTTP (enable if you add HTTPS/TLS) |
| **Which events?** | Select **"Let me select individual events"** |

Under individual events, check only:

- [x] **Pull requests**

Leave everything else unchecked. Click **Add webhook**.

---

### Step 3 — Verify the Webhook

Open or update a pull request in the repository. Within a few seconds you should see a review comment posted by the account associated with your `GITHUB_TOKEN`.

To check webhook delivery status: **repo Settings → Webhooks → your webhook → Recent Deliveries**. A green tick means the payload was received and returned 202.

To check server logs:
```bash
# If running directly
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Logs will show:
# [review] Starting review for owner/repo#123
# [linter] ruff returned N finding(s)
# [review] iteration 1 — function_calls=1, output_items=2
# [review] Review posted for owner/repo#123
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Version and phase info |
| `GET` | `/health` | Config status check |
| `GET` | `/docs` | Swagger UI (auto-generated) |
| `POST` | `/webhook/github` | GitHub PR webhook receiver |
| `POST` | `/repos/{owner}/{repo}/analyze` | Generate a codebase manifest (groundwork for RAG) |

---

## Project Structure

```
app/
├── main.py                   # FastAPI app, route registration
├── config.py                 # Settings (pydantic-settings, reads .env)
├── routes/
│   ├── webhook.py            # POST /webhook/github — HMAC verification + background task
│   ├── health.py             # GET /health
│   └── repos.py              # POST /repos/{owner}/{repo}/analyze
└── services/
    ├── review_service.py     # Agent loop — Responses API + Tavily MCP + linter
    ├── linter_service.py     # Diff parser + ruff subprocess runner
    ├── github_service.py     # GitHub API (diff fetch, review post, file content)
    └── indexing_service.py   # Repo manifest generator
indexes/                      # Generated .md manifests (gitignored except .gitkeep)
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `GITHUB_TOKEN` | Yes | Fine-grained PAT with PR (R/W) + Contents (R) |
| `GITHUB_WEBHOOK_SECRET` | Yes | Shared secret set in GitHub webhook settings |
| `TAVILY_API_KEY` | Yes | Tavily API key for web search via MCP |
| `OPENAI_MODEL` | No | Defaults to `gpt-4o` |

---

## Roadmap

| Phase | Status | Description |
|---|---|---|
| Phase 1 | ✅ Done | Single OpenAI call, basic diff review |
| Phase 2 | ✅ Done | Multi-agent loop — ruff linter + Tavily MCP web search |
| Phase 3 | Planned | RAG over codebase manifests + Celery + Redis |
| Phase 4 | Planned | Full CRAG pipeline, inline comments, per-repo config |
