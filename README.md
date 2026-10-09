# AI Operations Command Center

**Autonomous Business Incident Investigation & Resolution System**

An internal operations platform for NovaCommerce, a fictional e-commerce company.

The system takes a business problem — "why did today's sales drop?" — and drives it through
a complete lifecycle: investigation, root cause identification, recommended action, human
approval where required, execution, verification, and a final written report.

The goal is a system that behaves like an **AI operations employee** rather than a chatbot.
It decides what to investigate next based on what it finds, gathers attributable evidence,
and is judged on whether the problem actually went away — not on whether its answer sounded
plausible.

> **Status: Phase 1 — Project Foundation.**
> The foundation runs. There is no database, no AI agent, and no business logic yet.
> See [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md) for exactly what exists.

---

## Technologies

| Layer | Technology | Status |
|---|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS v4 | Phase 1 ✅ |
| Backend | Python 3.12, FastAPI, Uvicorn | Phase 1 ✅ |
| Database | PostgreSQL, SQLAlchemy | Phase 10 |
| AI agent | Python, LLM API with tool calling | Phase 11 |
| Version control | Git, GitHub | Phase 1 ✅ |
| Deployment | Docker, Docker Compose | Phase 16 |

The reasoning behind each choice is recorded in [`docs/DECISIONS.md`](docs/DECISIONS.md).

---

## Folder Structure

```
ai-operations-command-center/
│
├── frontend/              Next.js application — presentation only
│   ├── src/app/           App Router pages and layout
│   └── public/            Static assets
│
├── backend/               FastAPI application
│   └── app/
│       ├── main.py        Application entry point
│       ├── core/          Configuration
│       └── api/routes/    Route modules
│
├── docs/                  Project documentation — read this first
│   ├── PROJECT_SPEC.md        What is being built, and why
│   ├── ARCHITECTURE.md        How it is shaped
│   ├── DEVELOPMENT_PLAN.md    The order it gets built in
│   ├── DECISIONS.md           What was decided, and what it cost
│   └── CURRENT_STATE.md       Where things stand right now
│
├── .env.example           Environment template — no real secrets
├── .gitignore
└── README.md
```

Frontend and backend are separate applications. They share nothing but an HTTP contract.
That separation is deliberate and is described in
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Prerequisites

- **Node.js** 18.18 or newer (developed on v22)
- **Python** 3.10 or newer (developed on 3.12)
- **npm**

---

## Getting Started

Clone the repository, then set up your environment file:

```bash
cp .env.example .env
```

The defaults work for local development. Nothing needs to be filled in for Phase 1.

### Start the backend

```bash
cd backend

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the development server
uvicorn app.main:app --reload --port 8000
```

The backend serves on **http://localhost:8000**.
Interactive API documentation is at **http://localhost:8000/docs**.

### Start the frontend

In a second terminal:

```bash
cd frontend

npm install
npm run dev
```

The frontend serves on **http://localhost:3000**.

Both need to be running to work on the project, but in Phase 1 they do not yet talk to
each other.

---

## Testing the Health Endpoint

With the backend running:

```bash
curl http://localhost:8000/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "ai-operations-command-center-backend"
}
```

Or open **http://localhost:8000/health** in a browser.

This endpoint reports only that the process is up. It deliberately does not check the
database or any external service, because none exist yet — a health check that reports on
dependencies it does not have is worse than none.

---

## Useful Commands

**Frontend** (from `frontend/`)

| Command | Purpose |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm test` | Frontend tests (Vitest) |

**Backend** (from `backend/`, with the venv active)

| Command | Purpose |
|---|---|
| `uvicorn app.main:app --reload --port 8000` | Development server with hot reload |
| `pip install -r requirements.txt` | Install dependencies |
| `pip freeze > requirements.txt` | Update the dependency lockfile |
| `pip install -r requirements-dev.txt` | Install test dependencies |
| `pytest` | Backend tests (in-memory SQLite; no PostgreSQL or LLM needed) |

---

## Development Approach

The project is built in sixteen small, controlled phases. Each phase has an explicit scope,
is tested locally, and is committed before the next begins. Work outside the current phase's
scope is deliberately avoided — the discipline is what keeps a project of this size
reasonable to work on.

The full plan is in [`docs/DEVELOPMENT_PLAN.md`](docs/DEVELOPMENT_PLAN.md).

**Before working on this project, read the five documents in `docs/`.** They record
decisions that are expensive to rediscover and easy to accidentally contradict.

---

## Security Notes

- `.env` is git-ignored. Only `.env.example` is tracked, and it contains no real values.
- The LLM API key, when it is introduced in Phase 11, is **server-side only**. It must never
  be given a `NEXT_PUBLIC_` prefix or reach the browser.
- Any variable prefixed `NEXT_PUBLIC_` is embedded in the client bundle and is public.
