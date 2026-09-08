# 🏢 CRE AI Pro

> An AI-powered **Commercial Real Estate** sales platform built for the Pakistani market. It pairs a rich property-management dashboard with an intelligent sales chatbot that engages website visitors, qualifies them as leads, and schedules viewings — automatically.

**Monorepo** containing two apps:

- **Backend** — FastAPI REST API + LangGraph AI agent (`backend/`)
- **Frontend** — Next.js dashboard (`frontend/`)

---

## ✨ Highlights

CRE AI Pro isn't just another CRUD for listings. Its core differentiator is an **AI Sales Agent named "Ayesha"** that runs the entire top-of-funnel sales conversation on your behalf:

- **Natural-language conversation** — understands city, budget, property type, and whether a visitor wants to buy or rent.
- **Anti-hallucination by design** — the LLM never decides what properties exist. Live inventory is retrieved from the database *outside* the model, then the model only phrases responses around verified rows. Every reply is post-validated for price/title accuracy, with deterministic template fallbacks when the LLM is unavailable — so the bot **never makes things up**.
- **Automatic lead capture & scoring** — extracts names, emails, Pakistani phone numbers, and budgets from chat using deterministic rules, then scores each lead 0–100 based on data completeness and engagement.
- **Cold, targeted follow-up emails** — new leads automatically receive matched property recommendations via email.

---

## 🧩 Key Features

| Area | What's implemented |
| --- | --- |
| 🤖 **AI Sales Agent** | LangGraph pipeline (understand → retrieve → respond) with multi-turn memory, criteria accumulation across turns ("office in Lahore" + "cheaper?" inherits filters), and 3-property verified recommendations. |
| 🏠 **Property Management** | Full CRUD for commercial listings with rich filtering (city, type, price range, listing type, text search) and Pakistani unit support — Marla, Kanal, Sqft, Sq. Yard, priced in PKR. |
| 👥 **Lead Management** | Capture, auto-scoring, pipeline statuses (new → contacted → qualified → viewing → converted → lost), notes, and manual/chat sources. |
| 📅 **Viewing Booking** | One-click site-visit scheduling, auto-linking to leads, status lifecycle (pending → confirmed → completed / cancelled), and confirmation emails. |
| 📧 **Automated Email** | Styled follow-ups with matched-property cards + booking confirmations via the Resend API (no-op gracefully when unconfigured). |
| 📊 **Dashboard Analytics** | Aggregated stats: active listings, inventory value (PKR), lead pipeline breakdown, hot leads, property distribution by city, recent leads, and upcoming viewings. |
| 🇵🇰 **Pakistani-Market Localization** | PKR formatting (Crore/Lakh), phone normalization (`03xx-xxxxxxx`), 12 recognized cities, and Urdu greeting support ("assalam", "aoa", "mera naam"). |

---

## 🏗️ Tech Stack

### Backend — `backend/`

| Layer | Technology |
| --- | --- |
| Web framework | FastAPI (ASGI, Pydantic v2) |
| Server | Uvicorn |
| ORM / Database | SQLAlchemy 2.0 · SQLite (+ runtime schema migration) |
| AI agent framework | LangGraph (StateGraph) |
| LLM integration | LangChain Core · ChatOllama (`llama3.2:1b`) · LangChain Groq (available for production) |
| Entity extraction | Deterministic regex/keyword (no LLM) |
| Emailing | Resend API (via httpx) |
| Observability | LangSmith (tracing) |

### Frontend — `frontend/`

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router) · React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI kit | shadcn/ui + Base UI (`button`, `card`, `dialog`, `table`, `sheet`, …) |
| Icons | lucide-react |
| Markdown | react-markdown (AI chat rendering) |

---

## 📁 Project Structure

```
cre-ai-pro/
├── backend/
│   ├── main.py                  # FastAPI app entrypoint
│   ├── requirements.txt
│   ├── seed_data.py             # Demo data (12 properties, 3 leads)
│   ├── db_renew.py              # Reset properties/leads tables
│   └── app/
│       ├── api/v1/              # REST endpoints
│       │   ├── properties.py  leads.py  chat.py
│       │   ├── conversations.py  bookings.py  stats.py
│       ├── agents/sales_agent.py  # LangGraph "Ayesha" agent
│       ├── core/config.py         # Settings (.env)
│       ├── db/                    # engine, session, schema migration
│       ├── models/                # SQLAlchemy models
│       ├── schemas/               # Pydantic DTOs
│       └── services/
│           ├── extraction.py      # entity extraction
│           ├── scoring.py         # lead scoring
│           └── email.py           # Resend emails
└── frontend/
    └── src/
        ├── app/                   # pages: dashboard, chat, properties, leads, bookings
        ├── components/            # UI components + layout/Sidebar
        └── lib/                   # api client, types, formatting
```

---

## 🛣️ Progress & Roadmap

> Honest status as of **September 2026**.

### ✅ Implemented (working end-to-end)

- [x] Full-stack monorepo (FastAPI + Next.js)
- [x] AI Sales Agent with verified-inventory retrieval + anti-hallucination validation
- [x] Multi-turn conversational memory & criteria accumulation
- [x] Deterministic lead capture (name, email, phone, city, budget, property type)
- [x] Rule-based lead scoring + pipeline statuses
- [x] Property CRUD with Pakistani units & filters
- [x] Viewing booking lifecycle + booking confirmation emails
- [x] Automated lead follow-up emails with matched properties
- [x] Dashboard analytics (stats aggregation + frontend dashboards)
- [x] Demo/seed data for quick evaluation

### 🚧 In progress / left to implement

- [ ] **Authentication & authorization** — currently an internal, unauthenticated dashboard
- [ ] **Production LLM** — switch from local Ollama (`llama3.2:1b`) to Groq/cloud models (dependencies already installed) for higher-quality responses
- [ ] **Charts** — `recharts` and `framer-motion` are declared but not yet wired in; the dashboard uses custom CSS bars today
- [ ] **Formal test suite** — backend unit/integration tests + frontend component tests not yet added
- [ ] **Alembic migrations** — currently using a lightweight runtime schema-migration helper; Alembic is installed for future use
- [ ] **Deployment** — Dockerization and CI/CD not yet configured
- [ ] **Multi-agent expansion** — e.g. dedicated prospecting / negotiation agents beyond the single sales agent

### 📈 Approximate progress

| Layer | Progress |
| --- | --- |
| Backend API & data layer | ~90% |
| AI agent pipeline | ~80% |
| Frontend dashboard UX | ~75% |
| Production hardening (auth, CI/CD, testing, cloud LLM) | ~30% |

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.11+**
- **Node.js 18+** (20+ recommended)
- **Ollama** (for the local LLM) — install from [ollama.com](https://ollama.com) and pull the model:
  ```bash
  ollama pull llama3.2:1b
  ```

### 1. Backend

```bash
cd backend

# Create & activate a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env            # then edit .env (see below)

# (Optional) Load demo data
python seed_data.py --yes

# Run the API (listens on http://localhost:8001)
uvicorn main:app --reload --port 8001
```

**`.env` — key variables:**

```env
PROJECT_NAME=CRE AI Pro
API_V1_STR=/api/v1
DATABASE_URL=sqlite:///./cre_ai_pro.db

# Local LLM (Ollama)
OLLAMA_MODEL=llama3.2:1b
OLLAMA_BASE_URL=http://localhost:11434

# Optional: enable emails (Resend)
RESEND_API_KEY=your_resend_key
EMAIL_FROM="CRE AI Pro <onboarding@resend.dev>"

# Optional: production-grade LLM via Groq
GROQ_API_KEY=your_groq_key
```

> 💡 **No Ollama?** The agent falls back to deterministic, data-driven template replies when the LLM is unreachable, so the API still works — the bot just answers from the inventory without generative phrasing.

Interactive API docs are available at [http://localhost:8001/docs](http://localhost:8001/docs).

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# (Optional) Point to a non-default backend
export NEXT_PUBLIC_API_URL=http://localhost:8001/api/v1

# Start the dashboard
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## 🔌 API Overview

All endpoints are prefixed with `/api/v1`:

| Method | Path | Description |
| --- | --- | --- |
| `POST/GET` | `/properties` | Create / list properties (with filters & pagination) |
| `GET/PUT/DELETE` | `/properties/{id}` | Get / update / soft-delete a property |
| `POST/GET` | `/leads` | Create / list leads (auto-scored) |
| `GET/PUT/DELETE` | `/leads/{id}` | Get / update / soft-delete a lead |
| `POST` | `/chat` | Send a message to the AI agent (returns reply + matched properties) |
| `GET` | `/conversations` | List chat conversations |
| `GET/DELETE` | `/conversations/{id}` | Get conversation history / delete it |
| `POST/GET` | `/bookings` | Create / list viewings |
| `GET/PATCH/DELETE` | `/bookings/{id}` | Get / update status / cancel a booking |
| `GET` | `/stats` | Dashboard analytics |
| `GET` | `/health` | Health check |

---

## 🧑‍💻 Contributing

This is an early-stage project — contributions, ideas, and feedback are welcome. The codebase is organized into a clean `backend/app` + `frontend/src` structure that makes it easy to extend (new endpoints, services, or agent nodes).

## 📄 License
MIT License

Copyright (c) 2026 Fawad Ahmad

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## 🙋 Contact

https://fawad-ai.vercel.app/
