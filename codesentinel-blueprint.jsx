import { useState } from "react";

const sections = [
  "overview",
  "architecture",
  "techstack",
  "features",
  "crag",
  "agent",
  "tradeoffs",
  "failures",
  "scaling",
  "structure",
  "endpoints",
  "interview",
];

const sectionLabels = {
  overview: "Overview",
  architecture: "Architecture",
  techstack: "Tech Stack",
  features: "Features",
  crag: "CRAG Pipeline",
  agent: "Agent Design",
  tradeoffs: "Trade-offs",
  failures: "Failure Modes",
  scaling: "Scaling",
  structure: "Project Structure",
  endpoints: "API Endpoints",
  interview: "Interview Prep",
};

// ─── Design tokens ───
const c = {
  bg: "#0a0a0f",
  surface: "#111118",
  surfaceHover: "#18182a",
  border: "#1e1e30",
  borderAccent: "#2d2d4a",
  text: "#e4e4ef",
  textMuted: "#8888a4",
  textDim: "#55556a",
  accent: "#7c5cff",
  accentDim: "#5a3fd4",
  accentGlow: "rgba(124,92,255,0.15)",
  green: "#34d399",
  greenDim: "rgba(52,211,153,0.12)",
  red: "#f87171",
  redDim: "rgba(248,113,113,0.12)",
  amber: "#fbbf24",
  amberDim: "rgba(251,191,36,0.12)",
  cyan: "#22d3ee",
  cyanDim: "rgba(34,211,238,0.12)",
};

const font = {
  display: "'JetBrains Mono', 'Fira Code', monospace",
  body: "'DM Sans', 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

// ─── Utility components ───
function Badge({ children, color = c.accent, bg = c.accentGlow }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 4,
        fontSize: 11,
        fontFamily: font.mono,
        fontWeight: 600,
        color,
        background: bg,
        letterSpacing: 0.5,
        textTransform: "uppercase",
      }}
    >
      {children}
    </span>
  );
}

function Card({ children, style = {} }) {
  return (
    <div
      style={{
        background: c.surface,
        border: `1px solid ${c.border}`,
        borderRadius: 8,
        padding: "20px 22px",
        marginBottom: 16,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2
        style={{
          fontFamily: font.display,
          fontSize: 22,
          fontWeight: 700,
          color: c.text,
          margin: 0,
          letterSpacing: -0.5,
        }}
      >
        {children}
      </h2>
      {sub && (
        <p
          style={{
            fontFamily: font.body,
            fontSize: 14,
            color: c.textMuted,
            margin: "6px 0 0",
            lineHeight: 1.5,
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

function CodeBlock({ children }) {
  return (
    <pre
      style={{
        background: "#080810",
        border: `1px solid ${c.border}`,
        borderRadius: 6,
        padding: "14px 16px",
        fontFamily: font.mono,
        fontSize: 12,
        color: c.green,
        overflow: "auto",
        lineHeight: 1.6,
        margin: "12px 0",
      }}
    >
      {children}
    </pre>
  );
}

function FlowStep({ num, title, desc, color = c.accent }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 14,
        marginBottom: 14,
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          background: `${color}20`,
          border: `2px solid ${color}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: font.mono,
          fontSize: 13,
          fontWeight: 700,
          color,
          flexShrink: 0,
        }}
      >
        {num}
      </div>
      <div>
        <div
          style={{
            fontFamily: font.mono,
            fontSize: 13,
            fontWeight: 600,
            color: c.text,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: font.body,
            fontSize: 13,
            color: c.textMuted,
            lineHeight: 1.5,
            marginTop: 2,
          }}
        >
          {desc}
        </div>
      </div>
    </div>
  );
}

function TradeoffRow({ decision, optionA, optionB, chose, reason }) {
  return (
    <Card>
      <div
        style={{
          fontFamily: font.mono,
          fontSize: 13,
          fontWeight: 700,
          color: c.accent,
          marginBottom: 10,
        }}
      >
        {decision}
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
        <div
          style={{
            flex: 1,
            minWidth: 200,
            padding: "10px 14px",
            background: chose === "A" ? c.greenDim : "#0d0d14",
            border: `1px solid ${chose === "A" ? c.green : c.border}`,
            borderRadius: 6,
          }}
        >
          <div
            style={{
              fontFamily: font.mono,
              fontSize: 11,
              color: chose === "A" ? c.green : c.textDim,
              marginBottom: 4,
            }}
          >
            {chose === "A" ? "✓ CHOSEN" : "OPTION A"}
          </div>
          <div
            style={{
              fontFamily: font.body,
              fontSize: 13,
              color: c.text,
              lineHeight: 1.4,
            }}
          >
            {optionA}
          </div>
        </div>
        <div
          style={{
            flex: 1,
            minWidth: 200,
            padding: "10px 14px",
            background: chose === "B" ? c.greenDim : "#0d0d14",
            border: `1px solid ${chose === "B" ? c.green : c.border}`,
            borderRadius: 6,
          }}
        >
          <div
            style={{
              fontFamily: font.mono,
              fontSize: 11,
              color: chose === "B" ? c.green : c.textDim,
              marginBottom: 4,
            }}
          >
            {chose === "B" ? "✓ CHOSEN" : "OPTION B"}
          </div>
          <div
            style={{
              fontFamily: font.body,
              fontSize: 13,
              color: c.text,
              lineHeight: 1.4,
            }}
          >
            {optionB}
          </div>
        </div>
      </div>
      <div
        style={{
          fontFamily: font.body,
          fontSize: 13,
          color: c.textMuted,
          lineHeight: 1.5,
          borderLeft: `3px solid ${c.accent}`,
          paddingLeft: 12,
        }}
      >
        <strong style={{ color: c.text }}>Reasoning:</strong> {reason}
      </div>
    </Card>
  );
}

// ─── Section Renderers ───

function OverviewSection() {
  return (
    <div>
      <SectionTitle sub="A GitHub-integrated AI code review bot with agentic tool calling and Corrective RAG">
        CodeSentinel — Project Overview
      </SectionTitle>

      <Card
        style={{
          background: `linear-gradient(135deg, ${c.accentGlow}, ${c.surface})`,
          borderColor: c.accentDim,
        }}
      >
        <div
          style={{
            fontFamily: font.body,
            fontSize: 15,
            color: c.text,
            lineHeight: 1.7,
          }}
        >
          <strong>CodeSentinel</strong> is a production-grade AI code review service that receives GitHub PR webhook events,
          analyzes code changes using an agentic LLM with tool-calling capabilities, retrieves project-specific
          context via Corrective RAG (CRAG), and posts structured review comments directly on the PR.
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginTop: 16 }}>
        {[
          { label: "Build Time", value: "3 Weeks", icon: "⏱" },
          { label: "Stack Size", value: "7 Tools", icon: "🔧" },
          { label: "Trade-offs", value: "5 Anchors", icon: "⚖️" },
          { label: "Failure Modes", value: "4 Known", icon: "🛡" },
          { label: "RAG Variant", value: "CRAG", icon: "🔍" },
          { label: "Agent Pattern", value: "ReAct + Tools", icon: "🤖" },
        ].map((s, i) => (
          <Card key={i} style={{ textAlign: "center", padding: "16px 12px" }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
            <div
              style={{
                fontFamily: font.mono,
                fontSize: 16,
                fontWeight: 700,
                color: c.accent,
              }}
            >
              {s.value}
            </div>
            <div
              style={{
                fontFamily: font.body,
                fontSize: 12,
                color: c.textMuted,
                marginTop: 2,
              }}
            >
              {s.label}
            </div>
          </Card>
        ))}
      </div>

      <Card style={{ marginTop: 16 }}>
        <div
          style={{
            fontFamily: font.mono,
            fontSize: 12,
            fontWeight: 600,
            color: c.amber,
            marginBottom: 10,
          }}
        >
          WHAT MAKES THIS INTERVIEW-PROOF
        </div>
        <div style={{ fontFamily: font.body, fontSize: 13, color: c.textMuted, lineHeight: 1.7 }}>
          <strong style={{ color: c.text }}>Narrow domain:</strong> Code review is a well-defined problem — the input is always a diff, the output is always comments. No ambiguous business logic.
          <br /><br />
          <strong style={{ color: c.text }}>Many engineering layers:</strong> Webhook security, async task processing, LLM orchestration, vector search, GitHub API integration, caching, error handling — 7+ layers to discuss.
          <br /><br />
          <strong style={{ color: c.text }}>Finite question ceiling:</strong> Every possible interviewer question maps to one of: diff handling, agent tool selection, RAG retrieval quality, GitHub API limits, false positive management, or scaling. All preparable.
        </div>
      </Card>
    </div>
  );
}

function ArchitectureSection() {
  return (
    <div>
      <SectionTitle sub="End-to-end data flow from PR webhook to posted review comments">
        System Architecture
      </SectionTitle>

      <Card style={{ background: "#080810" }}>
        <pre
          style={{
            fontFamily: font.mono,
            fontSize: 11,
            color: c.textMuted,
            lineHeight: 1.8,
            overflow: "auto",
            margin: 0,
          }}
        >
{`┌─────────────┐      ┌──────────────────┐      ┌──────────────┐
│   GitHub     │─────▶│   FastAPI         │─────▶│  Celery      │
│   Webhook    │ POST │   Webhook Handler │.delay│  Worker      │
│  (PR event)  │      │  • Verify HMAC    │      │  (prefork)   │
└─────────────┘      │  • Parse payload  │      └──────┬───────┘
                      │  • Dispatch task  │             │
                      └──────────────────┘             ▼
                                                ┌──────────────┐
                                                │  Review      │
                                                │  Agent       │
                                                │  (ReAct)     │
                                                └──────┬───────┘
                         ┌─────────────────────────────┤
                         ▼              ▼               ▼
                   ┌──────────┐  ┌───────────┐  ┌────────────┐
                   │  Tool:   │  │  Tool:    │  │  Tool:     │
                   │  Linter  │  │  CRAG     │  │  Web Docs  │
                   │  (ruff)  │  │  Pipeline │  │  (allowlist│
                   └──────────┘  └─────┬─────┘  │  domains)  │
                                       │        └────────────┘
                                       ▼
                                ┌──────────────┐
                                │  Vector DB   │
                                │  (FAISS /    │
                                │  Redis VSS)  │
                                └──────────────┘
                         │
                         ▼
                  ┌──────────────┐      ┌──────────────┐
                  │  Relevance   │─No──▶│  Query       │
                  │  Evaluator   │      │  Refinement  │──▶ Retry
                  │  (score>0.75)│      └──────────────┘
                  └──────┬───────┘
                         │ Yes
                         ▼
                  ┌──────────────┐      ┌──────────────┐
                  │  Response    │─────▶│  GitHub API  │
                  │  Synthesis   │      │  Post Review │
                  │  (findings)  │      │  Comments    │
                  └──────────────┘      └──────────────┘`}
        </pre>
      </Card>

      <Card>
        <div style={{ fontFamily: font.mono, fontSize: 12, fontWeight: 600, color: c.cyan, marginBottom: 12 }}>
          DATA FLOW — STEP BY STEP
        </div>
        <FlowStep num="1" title="Webhook Receipt" desc="GitHub sends POST to /webhook/github with X-Hub-Signature-256 header. FastAPI verifies HMAC-SHA256 using shared secret, parses PR event payload." color={c.cyan} />
        <FlowStep num="2" title="Task Dispatch" desc="Handler extracts PR number, repo, diff URL. Dispatches Celery task via .delay(). Returns 202 Accepted immediately. GitHub gets response in <500ms." color={c.cyan} />
        <FlowStep num="3" title="Diff Fetching" desc="Celery worker fetches the PR diff from GitHub API. Splits into per-file diffs. Filters out auto-generated files (lockfiles, migrations, .min.js)." color={c.cyan} />
        <FlowStep num="4" title="Agent Reasoning Loop" desc="ReAct agent analyzes each file diff. Decides which tools to invoke: linter for syntax, CRAG for project context, web docs for library references." color={c.accent} />
        <FlowStep num="5" title="CRAG Retrieval" desc="Agent queries vector DB with function/class names from diff. Relevance evaluator scores results. If score < 0.75, query is refined and retried once." color={c.accent} />
        <FlowStep num="6" title="Review Generation" desc="Agent synthesizes findings from all tools into structured JSON: severity, category, file, line, suggestion. Deduplicates overlapping findings." color={c.green} />
        <FlowStep num="7" title="GitHub Comment Posting" desc="Findings posted via GitHub Reviews API in a single batch call. Critical findings → inline comments. Low severity → summary comment." color={c.green} />
      </Card>
    </div>
  );
}

function TechStackSection() {
  const tools = [
    {
      name: "FastAPI",
      role: "HTTP layer + webhook receiver",
      why: "Native async, Pydantic validation for webhook payloads, automatic OpenAPI docs. Lightweight — no ORM or template engine overhead.",
      color: c.green,
    },
    {
      name: "Celery + Redis",
      role: "Async task processing (broker DB 0, results DB 1)",
      why: "PR review takes 15-45 seconds (LLM + GitHub API). Cannot block the webhook response. Celery decouples receipt from processing. Redis is already needed for caching, so it doubles as broker — no new infra.",
      color: c.accent,
    },
    {
      name: "OpenAI API (GPT-4o)",
      role: "Agent brain + structured output + embeddings",
      why: "Function calling for tool invocation. Structured output mode for enforcing finding schemas. text-embedding-3-small for codebase embeddings. Single provider reduces API key management.",
      color: c.cyan,
    },
    {
      name: "FAISS",
      role: "Vector store for codebase embeddings",
      why: "In-process, no network hop. Persisted to disk after indexing. Sub-millisecond search for <50K vectors. Zero infrastructure — just a file on disk. Migration path to Redis VSS or Qdrant at scale.",
      color: c.amber,
    },
    {
      name: "GitHub API (PyGithub)",
      role: "PR diff fetching + review comment posting",
      why: "PyGithub wraps REST v3 cleanly. Batch review comment endpoint reduces API calls. Webhook signature verification built-in.",
      color: c.text,
    },
    {
      name: "Ruff",
      role: "Linter tool for the agent",
      why: "10-100x faster than Flake8/Pylint. JSON output for structured parsing. Agent calls ruff on changed files as one of its tools. Zero-config sensible defaults.",
      color: c.red,
    },
    {
      name: "Pydantic + pytest",
      role: "Validation + testing",
      why: "Pydantic validates webhook payloads, agent finding schemas, config. pytest for unit tests on agent tool selection, CRAG retrieval quality, and review formatting.",
      color: c.green,
    },
  ];

  return (
    <div>
      <SectionTitle sub="7 tools — each with a clear 'why not the alternative' answer">
        Technology Stack
      </SectionTitle>
      {tools.map((t, i) => (
        <Card key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontFamily: font.mono, fontSize: 15, fontWeight: 700, color: t.color }}>
              {t.name}
            </span>
            <Badge color={c.textMuted} bg={`${c.textDim}30`}>{t.role}</Badge>
          </div>
          <div style={{ fontFamily: font.body, fontSize: 13, color: c.textMuted, lineHeight: 1.6 }}>
            {t.why}
          </div>
        </Card>
      ))}

      <Card style={{ borderColor: c.amber, background: c.amberDim }}>
        <div style={{ fontFamily: font.mono, fontSize: 12, fontWeight: 600, color: c.amber, marginBottom: 6 }}>
          ⚠ STACK BOUNDARY — DO NOT ADD MORE
        </div>
        <div style={{ fontFamily: font.body, fontSize: 13, color: c.text, lineHeight: 1.5 }}>
          7 tools = the ceiling. Every additional tool is a new attack surface for interview questions.
          If tempted to add LangChain, Pinecone, Kafka, etc. — resist. Build the agent loop manually
          with OpenAI function calling. You'll understand it deeper and can explain every line.
        </div>
      </Card>
    </div>
  );
}

function FeaturesSection() {
  const core = [
    { name: "Webhook-Driven PR Review", desc: "GitHub sends webhook on PR open/update → bot reviews automatically. No polling, no cron. Event-driven architecture." },
    { name: "Agentic Multi-Tool Analysis", desc: "ReAct agent decides per-file which tools to call: linter, CRAG retrieval, web doc search. Not a fixed pipeline — the agent reasons about what each file needs." },
    { name: "Corrective RAG (CRAG)", desc: "Retrieves project-specific patterns from indexed codebase. Evaluates retrieval relevance. Refines query if score < 0.75. Falls back to web docs if codebase has no relevant context." },
    { name: "Structured Review Comments", desc: "Findings posted as GitHub review with inline comments on specific lines. Severity levels: critical/warning/info. Batch posted via single API call." },
    { name: "Project Context Manifest", desc: "'Analyze this project' command traverses codebase, extracts AST signatures, docstrings, import graphs, README. Generates embeddings and indexes in FAISS." },
    { name: "Smart File Filtering", desc: "Auto-skips lockfiles, .min.js, migrations, auto-generated code. Configurable via .codesentinel.yml in repo root." },
  ];

  const additional = [
    { name: "Per-Repo YAML Config", desc: ".codesentinel.yml in repo root: severity thresholds, ignored paths, enabled tools, custom rules, language preferences." },
    { name: "Review Deduplication", desc: "If linter and LLM flag the same issue, deduplicate into a single finding with combined evidence. Reduces comment noise." },
    { name: "Scoped Web Search", desc: "Domain-allowlisted web search (docs.python.org, fastapi.tiangolo.com, redis.io/docs, etc.) for latest API references. No open-ended search." },
    { name: "Content Hash Caching", desc: "SHA-256 of file content cached in Redis DB 2. If file unchanged from last review, skip re-analysis. Saves ~60% of LLM calls on incremental PRs." },
    { name: "Review Metrics Dashboard", desc: "Track: findings per PR, false positive rate, review latency, cost per review. Stored in Redis, exposed via /metrics endpoint." },
    { name: "Circuit Breaker for OpenAI", desc: "After 3 consecutive API failures: fallback to linter-only mode. Posts partial review with disclaimer. Prevents full review failure on API outage." },
  ];

  return (
    <div>
      <SectionTitle sub="Core capabilities + strategic additions that generate interview talking points">
        Features
      </SectionTitle>

      <div style={{ fontFamily: font.mono, fontSize: 12, fontWeight: 600, color: c.green, marginBottom: 12 }}>
        CORE FEATURES (Week 1-2)
      </div>
      {core.map((f, i) => (
        <Card key={i}>
          <div style={{ fontFamily: font.mono, fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 6 }}>
            {f.name}
          </div>
          <div style={{ fontFamily: font.body, fontSize: 13, color: c.textMuted, lineHeight: 1.5 }}>
            {f.desc}
          </div>
        </Card>
      ))}

      <div style={{ fontFamily: font.mono, fontSize: 12, fontWeight: 600, color: c.amber, marginBottom: 12, marginTop: 24 }}>
        ADDITIONAL FEATURES (Week 3)
      </div>
      {additional.map((f, i) => (
        <Card key={i}>
          <div style={{ fontFamily: font.mono, fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 6 }}>
            {f.name}
          </div>
          <div style={{ fontFamily: font.body, fontSize: 13, color: c.textMuted, lineHeight: 1.5 }}>
            {f.desc}
          </div>
        </Card>
      ))}
    </div>
  );
}

function CRAGSection() {
  return (
    <div>
      <SectionTitle sub="Corrective RAG — the retrieval variant that self-corrects before generating">
        CRAG Pipeline Deep Dive
      </SectionTitle>

      <Card style={{ borderColor: c.accent, background: c.accentGlow }}>
        <div style={{ fontFamily: font.body, fontSize: 14, color: c.text, lineHeight: 1.7 }}>
          <strong>Why CRAG over other RAG variants:</strong> Standard RAG retrieves and trusts blindly.
          CRAG adds a relevance evaluation step between retrieval and generation. If retrieved context
          is irrelevant (wrong module, outdated pattern), CRAG refines the query or falls back to
          alternative sources — exactly how a human reviewer works.
        </div>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <div style={{ fontFamily: font.mono, fontSize: 12, fontWeight: 600, color: c.cyan, marginBottom: 16 }}>
          CRAG FLOW — 5 AGENTS
        </div>
        <FlowStep num="1" title="Context Retrieval Agent" desc="Extracts function names, class names, and import paths from the PR diff. Queries FAISS with these as search terms. Returns top-5 chunks from the project's indexed codebase." color={c.cyan} />
        <FlowStep num="2" title="Relevance Evaluation Agent" desc="Scores each retrieved chunk: cosine similarity > 0.75 = relevant, 0.5-0.75 = ambiguous, < 0.5 = irrelevant. This is the 'corrective' step that prevents the reviewer from using wrong context." color={c.amber} />
        <FlowStep num="3" title="Query Refinement Agent" desc="For ambiguous results: rewrites the query using AST-extracted parent class names, decorator types, or module-level docstrings. One retry max — prevents infinite loops." color={c.accent} />
        <FlowStep num="4" title="External Knowledge Agent" desc="When codebase has no relevant context (new library being introduced), falls back to allowlisted web docs. Fetches latest API signatures from official documentation only." color={c.green} />
        <FlowStep num="5" title="Response Synthesis Agent" desc="Combines validated codebase context + web docs + linter output into a final review finding. Each finding includes source attribution: 'Based on project pattern in utils/auth.py' or 'Per FastAPI docs v0.115'." color={c.text} />
      </Card>

      <Card style={{ marginTop: 16 }}>
        <div style={{ fontFamily: font.mono, fontSize: 12, fontWeight: 600, color: c.green, marginBottom: 10 }}>
          INDEXING PIPELINE — "ANALYZE THIS PROJECT"
        </div>
        <CodeBlock>{`# Triggered via POST /repos/{owner}/{repo}/analyze
# or .codesentinel.yml auto_index: true

1. Clone repo (shallow, depth=1)
2. Walk file tree, skip .gitignore patterns
3. For each .py file:
   a. Parse AST → extract function sigs, class defs, docstrings
   b. Extract import graph (what imports what)
   c. Read inline comments and type hints
4. Chunk by function/class boundary (not fixed token size)
   → Semantic chunking: one chunk = one function + its docstring
5. Generate embeddings via text-embedding-3-small
6. Index in FAISS, persist to disk
7. Store manifest metadata in Redis:
   - repo_hash (commit SHA at index time)
   - chunk_count, embedding_model_version
   - index_timestamp`}</CodeBlock>
        <div style={{ fontFamily: font.body, fontSize: 13, color: c.textMuted, lineHeight: 1.5 }}>
          <strong style={{ color: c.amber }}>Interview anchor:</strong> "I chunk by AST boundaries, not fixed token sizes.
          A 300-token function stays as one chunk because splitting it mid-logic would make retrieval return
          half a function — useless context. The trade-off: variable chunk sizes mean some chunks are 50 tokens
          and some are 800, which affects embedding quality. I tested both approaches and AST-boundary chunking
          improved retrieval precision by ~20% on my test set."
        </div>
      </Card>
    </div>
  );
}

function AgentSection() {
  return (
    <div>
      <SectionTitle sub="ReAct agent with tool calling — not LangChain, hand-built with OpenAI function calling">
        Agent Design
      </SectionTitle>

      <Card>
        <div style={{ fontFamily: font.mono, fontSize: 12, fontWeight: 600, color: c.accent, marginBottom: 12 }}>
          WHY HAND-BUILT OVER LANGCHAIN
        </div>
        <div style={{ fontFamily: font.body, fontSize: 13, color: c.textMuted, lineHeight: 1.7 }}>
          LangChain adds ~15 transitive dependencies, abstracts away the tool-calling protocol, and makes debugging
          the agent loop opaque. By building directly on OpenAI's function calling API, every decision the agent makes
          is visible in the message history. In an interview, you can trace exactly why the agent called CRAG
          for file A but only ran the linter for file B — because you wrote the loop, not a framework.
        </div>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <div style={{ fontFamily: font.mono, fontSize: 12, fontWeight: 600, color: c.cyan, marginBottom: 10 }}>
          AGENT TOOLS (3 TOOLS)
        </div>
        {[
          {
            name: "run_linter",
            desc: "Executes ruff on the changed file. Returns structured JSON: line number, rule code, message. Agent calls this for every Python file — it's cheap and fast (<1s).",
            when: "Always called first. Non-negotiable baseline.",
            color: c.red,
          },
          {
            name: "search_project_context",
            desc: "Queries the CRAG pipeline with function/class names from the diff. Returns relevant codebase patterns, existing conventions, and related code. This is where the CRAG relevance evaluation happens.",
            when: "Called when: new function added, existing function modified, import changed, error handling pattern detected.",
            color: c.accent,
          },
          {
            name: "search_official_docs",
            desc: "Fetches documentation from allowlisted domains. Agent provides a library name + method name. Returns the relevant API doc section. Domain allowlist stored in .codesentinel.yml.",
            when: "Called when: new import introduced, deprecated API usage detected, version-specific behavior suspected.",
            color: c.green,
          },
        ].map((t, i) => (
          <div
            key={i}
            style={{
              padding: "14px 16px",
              background: "#0d0d14",
              border: `1px solid ${c.border}`,
              borderLeft: `3px solid ${t.color}`,
              borderRadius: 6,
              marginBottom: 10,
            }}
          >
            <div style={{ fontFamily: font.mono, fontSize: 14, fontWeight: 700, color: t.color }}>
              {t.name}()
            </div>
            <div style={{ fontFamily: font.body, fontSize: 13, color: c.textMuted, lineHeight: 1.5, marginTop: 6 }}>
              {t.desc}
            </div>
            <div style={{ fontFamily: font.mono, fontSize: 11, color: c.textDim, marginTop: 6 }}>
              TRIGGER: {t.when}
            </div>
          </div>
        ))}
      </Card>

      <Card style={{ marginTop: 16 }}>
        <div style={{ fontFamily: font.mono, fontSize: 12, fontWeight: 600, color: c.amber, marginBottom: 10 }}>
          AGENT LOOP — PSEUDOCODE
        </div>
        <CodeBlock>{`messages = [system_prompt, {"role": "user", "content": diff_for_file}]

while True:
    response = openai.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        tools=TOOL_DEFINITIONS,          # 3 tools
        tool_choice="auto",              # agent decides
    )

    if response.finish_reason == "stop":
        # Agent is done reasoning → extract findings
        findings = parse_structured_findings(response)
        break

    if response.finish_reason == "tool_calls":
        for tool_call in response.tool_calls:
            result = execute_tool(tool_call)  # run_linter / CRAG / web_docs
            messages.append(tool_call_message)
            messages.append(tool_result_message)
        # Loop continues — agent sees tool results and reasons again

    if len(messages) > MAX_TURNS:        # safety cap: 8 turns
        break  # prevent infinite loops`}</CodeBlock>
      </Card>
    </div>
  );
}

function TradeoffsSection() {
  return (
    <div>
      <SectionTitle sub="5 architectural decisions with clear A-vs-B reasoning">
        Trade-off Anchors
      </SectionTitle>

      <TradeoffRow
        decision="1. Full-diff context vs. File-by-file analysis"
        optionA="Send entire PR diff to LLM — cross-file context (renamed function + all callers)"
        optionB="Analyze each file independently — fits in context window, parallelizable"
        chose="B"
        reason="Large PRs (20+ files) exceed GPT-4o's context window. File-by-file analysis is parallelizable via ThreadPoolExecutor and keeps token costs predictable. Cross-file issues (renamed function not updated everywhere) are caught by the linter tool, not the LLM. For PRs with <10 files, the agent receives a summary of all changed files as additional context."
      />

      <TradeoffRow
        decision="2. Hand-built agent loop vs. LangChain/LlamaIndex"
        optionA="LangChain — faster to build, built-in tool management, community support"
        optionB="Raw OpenAI function calling — full control, no framework dependencies, debuggable"
        chose="B"
        reason="LangChain adds ~15 transitive dependencies and abstracts the tool-calling protocol behind layers of base classes. In an interview, being able to show the exact 40-line agent loop and explain every message in the conversation history is more valuable than saying 'LangChain handled it.' Also, LangChain versions break frequently — pinning to raw OpenAI SDK is more stable."
      />

      <TradeoffRow
        decision="3. AST-boundary chunking vs. Fixed-token chunking"
        optionA="Fixed 512-token chunks with 100-token overlap — standard RAG practice"
        optionB="Chunk by function/class AST boundaries — variable size, semantically coherent"
        chose="B"
        reason="Code has natural semantic boundaries (functions, classes). A fixed-token split might cut a function in half, making the retrieved chunk useless for understanding project patterns. AST-boundary chunking keeps each chunk as a complete unit of logic. Trade-off: some chunks are very small (10-token one-liners) and some are very large (500-token classes), which affects embedding quality unevenly."
      />

      <TradeoffRow
        decision="4. FAISS (in-process) vs. Redis Vector Search vs. Dedicated vector DB"
        optionA="Redis VSS — already running Redis, no new infra"
        optionB="FAISS — zero infrastructure, persisted to disk, sub-ms search"
        chose="B"
        reason="Each repo's index is <50K vectors. FAISS handles this in-memory with sub-millisecond search. No network hop. Persisting to disk means the index survives worker restarts. Redis VSS would work but adds vector search module dependency and uses shared Redis memory. Migration path: if supporting 100+ repos, move to Qdrant with namespace isolation."
      />

      <TradeoffRow
        decision="5. Inline comments per finding vs. Single summary comment"
        optionA="Inline comments on specific lines — most actionable for developers"
        optionB="Single summary comment — less noisy, easier to scan"
        chose="A"
        reason="Hybrid approach: critical findings get inline comments on the specific line. Info-level suggestions go into a single summary comment at the top of the review. This keeps signal-to-noise ratio high — developers see critical issues exactly where they need to fix them, and can optionally read the summary for style suggestions. GitHub's batch review API posts all comments in one call."
      />
    </div>
  );
}

function FailuresSection() {
  const failures = [
    {
      title: "High False Positive Rate",
      severity: "HIGH",
      desc: "LLMs confidently flag correct code as buggy. A decorator pattern the LLM hasn't seen looks 'wrong' even though it's idiomatic in the project.",
      mitigation: "Severity-gated posting: only critical findings get inline comments. Warning/info go to summary comment. Per-repo feedback loop: developers react with 👎 on false positives, stored in Redis, fed back as negative examples in the system prompt.",
      gap: "No automated false-positive detection yet. Relies on manual 👎 reactions. Would build a classifier trained on reaction data at scale.",
      color: c.red,
    },
    {
      title: "CRAG Retrieval Returns Stale Context",
      severity: "MEDIUM",
      desc: "Codebase index was built at commit abc123 but the PR modifies code introduced in commit def456. The CRAG retrieval returns patterns from the old version.",
      mitigation: "Store the commit SHA at index time. On each PR review, compare current HEAD with indexed SHA. If they diverge by >20 commits, trigger a re-index before review. Log a warning if reviewing against stale index.",
      gap: "Re-indexing is not incremental — full re-index on every staleness detection. Would build delta-indexing: only re-embed changed files since last index.",
      color: c.amber,
    },
    {
      title: "Large PRs Exceed Context Window",
      severity: "MEDIUM",
      desc: "A 50-file PR generates too many findings for the agent to synthesize. Individual file analysis works, but cross-file coherence is lost.",
      mitigation: "Truncate per-file diffs at 8,000 tokens. Skip auto-generated files. For PRs >20 files, post a summary comment suggesting the PR be broken into smaller chunks, then review the first 20 files.",
      gap: "No cross-file analysis for large PRs. Would implement a two-pass approach: first pass per-file, second pass synthesizes cross-file findings.",
      color: c.amber,
    },
    {
      title: "OpenAI API Outage Blocks All Reviews",
      severity: "HIGH",
      desc: "If OpenAI is down, no reviews are posted. PRs merge without any automated review. Single point of failure on external API.",
      mitigation: "Circuit breaker: after 3 consecutive failures, fall back to linter-only mode. Post a degraded review with ruff findings only + disclaimer. Queue failed tasks for retry when API recovers.",
      gap: "No secondary LLM provider configured. Would add Azure OpenAI as failover, or a local model (Ollama + CodeLlama) for emergency linter-augmented reviews.",
      color: c.red,
    },
  ];

  return (
    <div>
      <SectionTitle sub="4 known failure modes — proactively disclosed to show engineering maturity">
        Known Failure Modes
      </SectionTitle>

      {failures.map((f, i) => (
        <Card key={i} style={{ borderLeft: `3px solid ${f.color}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontFamily: font.mono, fontSize: 14, fontWeight: 700, color: c.text }}>
              {f.title}
            </span>
            <Badge
              color={f.severity === "HIGH" ? c.red : c.amber}
              bg={f.severity === "HIGH" ? c.redDim : c.amberDim}
            >
              {f.severity}
            </Badge>
          </div>
          <div style={{ fontFamily: font.body, fontSize: 13, color: c.textMuted, lineHeight: 1.6, marginBottom: 10 }}>
            <strong style={{ color: c.text }}>Problem:</strong> {f.desc}
          </div>
          <div style={{ fontFamily: font.body, fontSize: 13, color: c.textMuted, lineHeight: 1.6, marginBottom: 10 }}>
            <strong style={{ color: c.green }}>Current mitigation:</strong> {f.mitigation}
          </div>
          <div style={{ fontFamily: font.body, fontSize: 13, color: c.textMuted, lineHeight: 1.6, borderLeft: `2px solid ${c.textDim}`, paddingLeft: 10 }}>
            <strong style={{ color: c.amber }}>Acknowledged gap:</strong> {f.gap}
          </div>
        </Card>
      ))}
    </div>
  );
}

function ScalingSection() {
  return (
    <div>
      <SectionTitle sub="Predictable scaling narrative from 1 repo to 1,000">
        Scalability Roadmap
      </SectionTitle>

      {[
        {
          stage: "STAGE 1 — Current (1-5 repos)",
          items: [
            "Single Celery worker, prefork pool (2 processes)",
            "FAISS index per repo, persisted to local disk",
            "Redis single instance (broker DB 0, results DB 1, cache DB 2)",
            "~50 PR reviews/day capacity",
          ],
          color: c.green,
        },
        {
          stage: "STAGE 2 — 10x (5-50 repos)",
          items: [
            "Horizontal Celery workers (4-8 processes across machines)",
            "FAISS indices stored in GCS, loaded on-demand with LRU cache",
            "Redis cluster for high availability",
            "Per-repo worker routing: large repos get dedicated workers",
            "Content hash caching saves ~60% of LLM calls",
          ],
          color: c.amber,
        },
        {
          stage: "STAGE 3 — 100x (50-500 repos)",
          items: [
            "Migrate FAISS → Qdrant with namespace isolation per repo",
            "Add Azure OpenAI as LLM failover provider",
            "Webhook event deduplication (GitHub sometimes double-delivers)",
            "Priority queues: paid orgs review faster",
            "Delta-indexing: only re-embed changed files on each push",
            "Review finding database for pattern analysis across repos",
          ],
          color: c.red,
        },
        {
          stage: "STAGE 4 — 1000x (enterprise)",
          items: [
            "Multi-tenant architecture with org-level isolation",
            "Fine-tuned review model on org-specific code patterns",
            "Kafka replaces Redis as message broker (guaranteed ordering)",
            "Review analytics dashboard per team/org",
            "CI/CD integration: block merge on critical findings",
          ],
          color: c.accent,
        },
      ].map((s, i) => (
        <Card key={i}>
          <div style={{ fontFamily: font.mono, fontSize: 13, fontWeight: 700, color: s.color, marginBottom: 12 }}>
            {s.stage}
          </div>
          {s.items.map((item, j) => (
            <div key={j} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "flex-start" }}>
              <span style={{ color: s.color, fontFamily: font.mono, fontSize: 12, flexShrink: 0 }}>→</span>
              <span style={{ fontFamily: font.body, fontSize: 13, color: c.textMuted, lineHeight: 1.5 }}>{item}</span>
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
}

function StructureSection() {
  return (
    <div>
      <SectionTitle sub="Layered architecture with enforced separation of concerns">
        Project Structure
      </SectionTitle>

      <Card style={{ background: "#080810" }}>
        <pre style={{ fontFamily: font.mono, fontSize: 12, color: c.textMuted, lineHeight: 1.7, margin: 0, overflow: "auto" }}>
{`codesentinel/
├── app/
│   ├── main.py                  # FastAPI app factory
│   ├── config.py                # Pydantic Settings (env vars)
│   ├── routes/
│   │   ├── webhook.py           # POST /webhook/github (HMAC verify)
│   │   ├── repos.py             # POST /repos/{owner}/{repo}/analyze
│   │   └── health.py            # GET /health, GET /metrics
│   ├── services/
│   │   ├── review_service.py    # Orchestrates review for a PR
│   │   ├── indexing_service.py  # "Analyze project" → manifest + FAISS
│   │   └── github_service.py   # Fetch diff, post comments
│   ├── agent/
│   │   ├── review_agent.py      # ReAct loop (40 lines, hand-built)
│   │   ├── tools.py             # Tool definitions + executors
│   │   ├── prompts.py           # System prompts, finding schema
│   │   └── tool_schemas.py      # OpenAI function calling schemas
│   ├── rag/
│   │   ├── crag_pipeline.py     # CRAG orchestrator (retrieve→evaluate→refine)
│   │   ├── indexer.py           # AST parser → chunker → embedder
│   │   ├── retriever.py         # FAISS search + relevance scoring
│   │   ├── evaluator.py         # Relevance threshold (>0.75)
│   │   └── web_docs.py          # Allowlisted web doc fetcher
│   ├── tasks/
│   │   ├── celery_app.py        # Celery config (prefetch=1, acks_late)
│   │   └── review_task.py       # Celery task: review_pr.delay()
│   ├── models/
│   │   ├── webhook_payload.py   # Pydantic: GitHub webhook schema
│   │   ├── finding.py           # Pydantic: ReviewFinding schema
│   │   └── config_schema.py     # Pydantic: .codesentinel.yml schema
│   └── utils/
│       ├── diff_parser.py       # Parse unified diff → per-file changes
│       ├── ast_extractor.py     # Python AST → function sigs, classes
│       ├── hmac_verify.py       # Webhook signature verification
│       └── circuit_breaker.py   # OpenAI failure tracking + fallback
├── tests/
│   ├── test_agent_tool_selection.py
│   ├── test_crag_retrieval.py
│   ├── test_diff_parser.py
│   ├── test_webhook_verify.py
│   └── fixtures/
│       ├── sample_diffs/
│       └── sample_repos/
├── .codesentinel.yml            # Default config
├── docker-compose.yml           # FastAPI + Celery + Redis
├── Dockerfile
├── DECISIONS.md                 # 5 trade-off decisions documented
├── ARCHITECTURE.md              # Diagram + data flow
└── requirements.txt`}
        </pre>
      </Card>

      <Card>
        <div style={{ fontFamily: font.mono, fontSize: 12, fontWeight: 600, color: c.accent, marginBottom: 10 }}>
          LAYER CONTRACTS (enforced by convention)
        </div>
        {[
          { layer: "routes/", rule: "HTTP only. Parse request, call service, return response. No business logic.", color: c.cyan },
          { layer: "services/", rule: "Business logic. Zero HTTP imports. Raises typed exceptions (ReviewError). Services call agent/rag/tasks.", color: c.accent },
          { layer: "agent/", rule: "LLM interaction only. Receives diff string, returns list of Finding objects. No GitHub API calls.", color: c.green },
          { layer: "rag/", rule: "Retrieval only. Receives query string, returns ranked chunks with scores. No review logic.", color: c.amber },
          { layer: "tasks/", rule: "Celery task definitions. Thin wrappers around service calls. No business logic in tasks.", color: c.red },
        ].map((l, i) => (
          <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10, alignItems: "flex-start" }}>
            <span style={{ fontFamily: font.mono, fontSize: 13, fontWeight: 700, color: l.color, minWidth: 90 }}>
              {l.layer}
            </span>
            <span style={{ fontFamily: font.body, fontSize: 13, color: c.textMuted, lineHeight: 1.5 }}>
              {l.rule}
            </span>
          </div>
        ))}
      </Card>
    </div>
  );
}

function EndpointsSection() {
  const endpoints = [
    { method: "POST", path: "/webhook/github", desc: "Receive PR webhook events. Verifies HMAC-SHA256 signature. Dispatches Celery task. Returns 202.", status: "202" },
    { method: "POST", path: "/repos/{owner}/{repo}/analyze", desc: "Trigger codebase indexing. Clones repo, parses AST, generates embeddings, builds FAISS index.", status: "202" },
    { method: "GET", path: "/repos/{owner}/{repo}/index-status", desc: "Check indexing progress. Returns: pending/indexing/ready/failed + chunk count.", status: "200" },
    { method: "GET", path: "/reviews/{task_id}", desc: "Poll review task status. Returns: pending/reviewing/completed/failed + findings count.", status: "200" },
    { method: "GET", path: "/health", desc: "Health check. Returns Redis connectivity, Celery worker count, OpenAI API status.", status: "200" },
    { method: "GET", path: "/metrics", desc: "Review metrics: avg latency, findings/PR, false positive rate, cost/review, cache hit rate.", status: "200" },
  ];

  return (
    <div>
      <SectionTitle sub="6 endpoints — minimal API surface, maximum functionality">
        API Endpoints
      </SectionTitle>

      {endpoints.map((e, i) => (
        <Card key={i}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
            <span style={{
              fontFamily: font.mono,
              fontSize: 11,
              fontWeight: 700,
              color: e.method === "POST" ? c.amber : c.green,
              background: e.method === "POST" ? c.amberDim : c.greenDim,
              padding: "2px 8px",
              borderRadius: 3,
            }}>
              {e.method}
            </span>
            <span style={{ fontFamily: font.mono, fontSize: 14, fontWeight: 600, color: c.text }}>
              {e.path}
            </span>
            <span style={{ fontFamily: font.mono, fontSize: 11, color: c.textDim, marginLeft: "auto" }}>
              → {e.status}
            </span>
          </div>
          <div style={{ fontFamily: font.body, fontSize: 13, color: c.textMuted, lineHeight: 1.5 }}>
            {e.desc}
          </div>
        </Card>
      ))}
    </div>
  );
}

function InterviewSection() {
  return (
    <div>
      <SectionTitle sub="Predicted interview questions mapped to prepared answers">
        Interview Preparation Map
      </SectionTitle>

      <Card style={{ borderColor: c.accent, background: c.accentGlow }}>
        <div style={{ fontFamily: font.mono, fontSize: 12, fontWeight: 600, color: c.accent, marginBottom: 10 }}>
          QUESTION CEILING TEST — 25 QUESTIONS, ALL PREPARABLE
        </div>
        <div style={{ fontFamily: font.body, fontSize: 13, color: c.textMuted, lineHeight: 1.5 }}>
          Every question an interviewer can ask falls into one of 6 categories below.
          If you can answer all 25, you've hit the ceiling. No surprises.
        </div>
      </Card>

      {[
        {
          category: "Architecture & Data Flow (5 Qs)",
          questions: [
            "Walk me through what happens when a PR is opened.",
            "Why async processing? Why not review synchronously?",
            "How does the webhook signature verification work?",
            "What happens if the Celery worker crashes mid-review?",
            "Draw the system architecture on a whiteboard.",
          ],
          color: c.cyan,
        },
        {
          category: "Agent Design (5 Qs)",
          questions: [
            "Why build the agent loop yourself instead of using LangChain?",
            "How does the agent decide which tools to call?",
            "What if the agent enters an infinite tool-calling loop?",
            "Show me the exact message history for a typical review.",
            "How do you test the agent's tool selection logic?",
          ],
          color: c.accent,
        },
        {
          category: "CRAG / RAG (5 Qs)",
          questions: [
            "Why Corrective RAG over standard RAG?",
            "Explain your chunking strategy. Why AST boundaries?",
            "What's your relevance threshold and how did you choose it?",
            "What happens when the codebase index is stale?",
            "How would you migrate from FAISS to a dedicated vector DB?",
          ],
          color: c.green,
        },
        {
          category: "Failure & Reliability (4 Qs)",
          questions: [
            "What's your false positive rate? How do you reduce it?",
            "What happens if OpenAI is down?",
            "How do you handle large PRs that exceed context limits?",
            "What's the blast radius if Redis goes down?",
          ],
          color: c.red,
        },
        {
          category: "Scaling (3 Qs)",
          questions: [
            "How would you scale this to 100 repos?",
            "What's the bottleneck at 10x load?",
            "How would you add multi-tenant support?",
          ],
          color: c.amber,
        },
        {
          category: "Cost & Production (3 Qs)",
          questions: [
            "What's the cost per PR review?",
            "How do you monitor review quality in production?",
            "What metrics would you track?",
          ],
          color: c.text,
        },
      ].map((cat, i) => (
        <Card key={i}>
          <div style={{ fontFamily: font.mono, fontSize: 13, fontWeight: 700, color: cat.color, marginBottom: 12 }}>
            {cat.category}
          </div>
          {cat.questions.map((q, j) => (
            <div key={j} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
              <span style={{ fontFamily: font.mono, fontSize: 12, color: cat.color, flexShrink: 0 }}>Q{j + 1}.</span>
              <span style={{ fontFamily: font.body, fontSize: 13, color: c.textMuted, lineHeight: 1.4 }}>{q}</span>
            </div>
          ))}
        </Card>
      ))}

      <Card style={{ borderColor: c.green, background: c.greenDim }}>
        <div style={{ fontFamily: font.mono, fontSize: 12, fontWeight: 600, color: c.green, marginBottom: 8 }}>
          PRESENTATION FRAMEWORK — Context → Decision → Trade-off → Measurement
        </div>
        <div style={{ fontFamily: font.body, fontSize: 13, color: c.text, lineHeight: 1.7 }}>
          Don't say: "I used CRAG for retrieval."
          <br /><br />
          Say: "Standard RAG retrieved codebase patterns but 30% of the time returned irrelevant context — wrong module, outdated function.
          I added a relevance evaluation step between retrieval and generation: cosine similarity scoring with a 0.75 threshold.
          Below the threshold, the query gets refined using AST-extracted parent class names. The trade-off: an extra LLM call per low-confidence retrieval,
          adding ~2 seconds. But review accuracy improved from 70% to 88% on my 50-PR test set, and false positives dropped by 40%."
        </div>
      </Card>
    </div>
  );
}

// ─── Main App ───

const sectionRenderers = {
  overview: OverviewSection,
  architecture: ArchitectureSection,
  techstack: TechStackSection,
  features: FeaturesSection,
  crag: CRAGSection,
  agent: AgentSection,
  tradeoffs: TradeoffsSection,
  failures: FailuresSection,
  scaling: ScalingSection,
  structure: StructureSection,
  endpoints: EndpointsSection,
  interview: InterviewSection,
};

export default function CodeSentinelBlueprint() {
  const [active, setActive] = useState("overview");
  const ActiveSection = sectionRenderers[active];

  return (
    <div style={{ background: c.bg, minHeight: "100vh", color: c.text, fontFamily: font.body }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        padding: "28px 24px 20px",
        borderBottom: `1px solid ${c.border}`,
        background: `linear-gradient(180deg, ${c.accentGlow}, transparent)`,
      }}>
        <div style={{ fontFamily: font.mono, fontSize: 11, color: c.accent, letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>
          Project Blueprint
        </div>
        <h1 style={{ fontFamily: font.display, fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: -1 }}>
          CodeSentinel
        </h1>
        <p style={{ fontFamily: font.body, fontSize: 14, color: c.textMuted, margin: "6px 0 0" }}>
          AI Code Review Bot • Agentic Tool Calling • Corrective RAG
        </p>
      </div>

      {/* Navigation */}
      <div style={{
        display: "flex",
        gap: 4,
        padding: "12px 16px",
        overflowX: "auto",
        borderBottom: `1px solid ${c.border}`,
        background: c.surface,
        flexWrap: "wrap",
      }}>
        {sections.map((s) => (
          <button
            key={s}
            onClick={() => setActive(s)}
            style={{
              fontFamily: font.mono,
              fontSize: 11,
              fontWeight: active === s ? 700 : 500,
              color: active === s ? c.accent : c.textMuted,
              background: active === s ? c.accentGlow : "transparent",
              border: `1px solid ${active === s ? c.accentDim : "transparent"}`,
              borderRadius: 4,
              padding: "6px 12px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.15s",
            }}
          >
            {sectionLabels[s]}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "24px 20px", maxWidth: 800, margin: "0 auto" }}>
        <ActiveSection />
      </div>
    </div>
  );
}
