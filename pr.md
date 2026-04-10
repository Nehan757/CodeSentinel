---

## Pull Request Summary

Upgrades CodeSentinel from a single-shot OpenAI review call to a hand-built multi-agent loop using OpenAI function calling. The agent can now invoke a ruff linter and an allowlisted documentation fetcher before producing its final findings, improving review depth and accuracy for Python PRs.

---

### Changes Made

- `app/services/linter_service.py` (new): parses unified diffs to extract Python file content, writes to a temp directory, runs `ruff check --output-format=json`, and returns structured findings
- `app/services/docs_service.py` (new): resolves allowlisted module names to documentation URLs and fetches truncated plain-text snippets via httpx; includes `detect_new_imports()` utility for future use
- `app/services/review_service.py` (rewritten): replaced single `chat.completions.create` call with a 5-iteration agent loop using OpenAI function calling; added `_dispatch_tool()`, `_parse_findings()` with markdown-fence stripping and JSON fallback parsing, and pre-extraction of Python file contents before the loop starts
- `requirements.txt`: added `ruff==0.9.10`
- `app/main.py`: bumped version to `0.2.0`, phase to `2`

---

### Payload/Response Changes

#### GET /

**Response Changes:**
- Modified: `version` — `"0.1.0"` to `"0.2.0"`
- Modified: `phase` — `1` to `2`

No changes to webhook or review API payloads. The `Finding` model schema (file, line, severity, message, suggestion) is unchanged, so `post_review()` in `github_service.py` requires no updates.

---

### Breaking Changes

NA — the webhook contract, review output schema, and all other endpoints are unchanged. The `GET /` version bump is a metadata field change; no known clients depend on it programmatically.

---

### New Dependencies

**requirements.txt:**
- `ruff==0.9.10` — Python linter used by `linter_service.run_ruff()`; must be available on the server/container PATH. The linter silently no-ops if ruff is not found (`FileNotFoundError` is caught), so startup is not blocked, but linter findings will be absent until installed.

**.env variables:**
- None added.

---

### API Latency Impact

- `POST /webhook/github` (background task): review latency increases by 1–4 API round-trips per PR (up to 5 agent iterations instead of 1). Each `fetch_docs` call adds up to 10 seconds of blocking httpx I/O. For a typical Python PR the agent will make 1 linter call + 0–1 docs calls before producing findings, adding roughly 5–15 seconds to background task duration. This does not affect webhook response time (202 is still returned immediately).

---

### Testing Instructions

1. Open a PR that modifies a Python file with a known ruff violation (e.g. an unused import). Confirm the GitHub review comment includes the linter finding in the findings list alongside any LLM-generated findings.

2. Open a PR that adds `import httpx` or `from fastapi import ...`. Confirm the agent calls `fetch_docs` (visible in server logs as `[docs] fetching docs for '...'`) and still produces a valid review comment.

3. Open a PR on a non-Python repo (e.g. only Markdown or JSON changes). Confirm `py_filenames` is empty, the agent skips `run_linter`, and a review comment is still posted (either findings or the "No issues found" message).

---

### Known Latent Bug

**File:** `app/services/review_service.py`, `_parse_findings()`, line 130

The fallback JSON extraction path (`re.search(r"\{.*\}", content, re.DOTALL)`) calls `json.loads(m.group())` without a surrounding try/except. If the regex matches a non-JSON substring, a `JSONDecodeError` propagates up through `review_diff()` and is silently swallowed by the broad `except Exception` in `webhook.py`, resulting in no review comment being posted for that PR.

**Suggested fix:**

```python
try:
    raw = json.loads(m.group())
except json.JSONDecodeError:
    logger.warning("[review] Fallback JSON extraction also failed")
    return []
```

---
