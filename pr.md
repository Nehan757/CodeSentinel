---

## Pull Request Summary

Replaces the allowlist-based `fetch_docs` tool with Tavily MCP, giving the review agent unrestricted web search and URL extraction via OpenAI's server-side MCP dispatch. Switches the agent loop from Chat Completions to the Responses API (required for MCP tool support) and bumps openai to 1.66.0.

---

### Changes Made

- `app/services/review_service.py` (rewritten): switched from `client.chat.completions.create` to `client.responses.create`; replaced `fetch_docs` function tool with a Tavily MCP tool entry (`type: "mcp"`); updated `_dispatch_tool()` to handle only local function calls; updated `input_items` accumulation to match Responses API conversation format; updated system prompt to reference `tavily-search` and `tavily-extract`
- `app/services/docs_service.py` (deleted): functionality superseded by Tavily MCP
- `app/config.py`: added required `TAVILY_API_KEY: str` field
- `.env.example`: added `TAVILY_API_KEY=tvly-...` entry
- `requirements.txt`: bumped `openai` from `1.51.0` to `1.66.0`
- `app/main.py`: bumped FastAPI `version` param to `0.2.1`

---

### Payload/Response Changes

#### GET /

**Response Changes:**
- Modified: `version` — `"0.2.0"` to `"0.2.1"` (once the hardcoded string in `root()` is corrected — see breaking changes)

No changes to webhook or review API payloads. The `Finding` model schema is unchanged; `post_review()` in `github_service.py` requires no updates.

---

### Breaking Changes

**1. TAVILY_API_KEY is now a required startup field**

`TAVILY_API_KEY: str` has no default in `config.py`. Any existing deployment that restarts without adding this variable to `.env` will fail at import time with a pydantic `ValidationError` — the app will not start. Migration: add `TAVILY_API_KEY=tvly-...` to `.env` before restarting.

**2. openai 1.51.0 → 1.66.0**

The Responses API (`client.responses.create`) does not exist in 1.51.0. Rolling back the package without also reverting `review_service.py` will cause an `AttributeError` at review time. The two changes must be deployed together.

---

### Known Bugs in This PR

**Bug 1 — Version string mismatch in `app/main.py` (line 23)**

`FastAPI(version="0.2.1")` (used by `/docs` Swagger UI) but the `root()` handler returns `"version": "0.2.0"`. These should match. The `root()` return dict needs updating to `"0.2.1"`.

**Bug 2 — Responses API assistant turn format (review_service.py line 174)**

The conversation continuation after a local function call appends:
```python
input_items.append({"role": "assistant", "content": response.output})
```
The Responses API expects prior output items to be passed back as top-level input entries (each output item already carries `type`, `id`, etc.), not nested inside a role/content wrapper. The correct pattern is:
```python
input_items.extend(response.output)
```
This bug is silent on non-Python PRs (where `run_linter` is never called) but will cause a malformed request error on the follow-up API call whenever the linter is dispatched.

---

### New Dependencies

**requirements.txt:**
- `openai==1.66.0` — upgraded from 1.51.0; required for Responses API and MCP tool type support

**.env variables:**
- `TAVILY_API_KEY` — Tavily API key, embedded in the MCP server URL at startup. Required; no default. Obtain from app.tavily.com.

**Removed:**
- `docs_service.py` deleted; `httpx` remains in `requirements.txt` but is now unused — safe to remove in a follow-up cleanup.

---

### API Latency Impact

NA — Tavily searches are resolved server-side by OpenAI before the response returns, so latency characteristics are similar to the previous agent loop. Background task timing is unchanged from the caller's perspective.

---

### Testing Instructions

1. Open a PR that modifies a Python file with a known ruff violation (e.g. an unused import). Confirm server logs show `[linter] ruff returned N finding(s)` and the GitHub review comment includes the linter finding.

2. Open a PR that introduces a new third-party import (e.g. `import requests`). Confirm logs show a Tavily search occurring and the final review comment reflects documentation-backed analysis.

3. Start the service without `TAVILY_API_KEY` in `.env`. Confirm it fails immediately at startup with a pydantic `ValidationError` (expected, intentional) rather than failing silently at review time.

---
