# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Overview

**LeadCapture Pro** is a multi-tenant SaaS platform for automated lead capture, qualification, and management with real-time scoring, WhatsApp notifications, and AI-powered lead qualification agents.

- **Tech Stack**: Node.js + Express (backend), React 19 + Vite (frontend), Supabase (PostgreSQL + Auth), Vercel (serverless), n8n (workflow automation)
- **Languages**: Portuguese UI and business logic; English code comments

---

## Development Commands

### Backend

```bash
cd server
npm install
npm run dev        # nodemon, port 4000
npm start          # production-like local run
```

### Frontend

```bash
cd frontend/dashboard-admin
npm install
npm run dev        # Vite dev server, port 5173
npm run build      # production build
```

### Full Build (Vercel deploy)

```bash
# From project root — compiles frontend and copies dist → server/public/dashboard-build/
npm run build
```

### Tests

```bash
npm test                   # run all Vitest tests once
npm run test:watch         # watch mode
npm run test:ui            # Vitest UI dashboard
npm run test:coverage      # coverage report

# Run a specific test file
npm test -- server/routes/__tests__/leads.spec.js
```

### Local Docker Automation Stack

```bash
docker compose -f docker/docker-compose.yml up -d   # n8n, Evolution API, PostgreSQL
docker compose -f docker/docker-compose.yml down
```

---

## Architecture

```
leadcapture-pro/
├── server/                    # Express backend API
│   ├── routes/               # API route handlers
│   ├── services/             # Business logic (agente.js, emailService.js)
│   ├── middleware/           # Auth, validation, rate-limiting
│   ├── core/                 # database.js, scoring.js, validation utilities
│   ├── comunicacao/          # Email & WhatsApp integrations
│   ├── public/               # Static assets + React dashboard build output
│   ├── app.js               # Express middleware setup; no listen()
│   └── index.js             # Entry point with listen()
├── frontend/dashboard-admin/  # React 19 + Vite SPA
│   └── src/
│       ├── App.jsx          # Routes, AuthProvider/TenantProvider, lazy pages
│       ├── pages/           # *Page components
│       ├── components/      # Reusable UI (layout/, dashboard/, admin/, crm/)
│       ├── hooks/           # React Query data hooks
│       └── services/        # Supabase client, API utilities
├── api/                      # Vercel serverless entry (api/index.js)
├── supabase/migrations/      # SQL schema migrations
├── n8n/workflows/            # Workflow JSON definitions
├── docker/                   # docker-compose for local automation stack
├── docs/                     # Architecture, API, and deployment docs
├── scripts/build.sh          # Full build pipeline script
├── vercel.json               # Vercel rewrites and config
└── vitest.config.js
```

### Key Files

- **[server/app.js](server/app.js)** — Express middleware, CORS, all route mounting. Imported by index.js (no `listen`).
- **[frontend/dashboard-admin/src/App.jsx](frontend/dashboard-admin/src/App.jsx)** — React Router, AuthProvider/TenantProvider wrappers, lazy-loaded page imports.
- **[server/core/database.js](server/core/database.js)** — Singleton Supabase client using `service_role` key.
- **[server/core/scoring.js](server/core/scoring.js)** — Lead scoring: resolves capital input → threshold lookup → score + category.
- **[server/services/agente.js](server/services/agente.js)** — Claude-powered WhatsApp agent: config fetch, prompt building, multi-turn conversation.
- **[vercel.json](vercel.json)** — Routes `/api/*` to serverless function; `/*` falls back to `/index.html`.

---

## Multi-Tenant Architecture

All core tables (`leads`, `marcas`, `interacoes`, `agente_configs`) carry a `tenant_id` foreign key. Tenant isolation is enforced at the backend query level (RLS is temporarily disabled in Supabase due to a prior recursion issue — rely on backend token validation + `tenant_id` filters).

**Auth flow**: User authenticates with Supabase Auth (email/password) → backend looks up `usuarios` by `auth_id` to resolve `tenant_id` and `role` → frontend loads tenant context and role-based permissions via `AuthContext` / `TenantContext`.

---

## Core Data Model

| Table | Purpose |
|-------|---------|
| `tenants` | Franchisor company; branding, AI config, scoring rules |
| `usuarios` | Users linked to `auth_id` (Supabase Auth) and `tenant_id` |
| `marcas` | Products/brands per tenant; `score_config` (JSONB) holds capital thresholds |
| `leads` | Prospects with `score` (0–100), `categoria` (hot/warm/cold), `status`, `ia_analise` (JSONB) |
| `interacoes` | Interaction history (notes, calls, emails, WhatsApp) |
| `agente_configs` | Per-tenant AI agent personality and prompt customization |

**`marcas.score_config` JSONB structure:**
```json
{
  "thresholds": [
    { "min": 0,      "max": 80000,     "score": 55, "category": "cold" },
    { "min": 80001,  "max": 150000,    "score": 70, "category": "warm" },
    { "min": 150001, "max": 999999999, "score": 85, "category": "hot"  }
  ]
}
```

---

## AI Agent (Agente Z / "Lia")

The agent (`server/services/agente.js`) is a Claude-powered WhatsApp qualification bot, customized per tenant via `agente_configs`.

**Flow:** Lead sends WhatsApp message → Evolution API webhook → backend fetches agent config (5-min cache) + lead history from `interacoes` → Claude processes with system prompt → response sent back via Evolution API, lead record updated in DB.

**`agente_configs` key fields:** `nome_agente`, `pitch_principal`, `capital_minimo`, `segmento`, `prompt_extra`.

---

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/leads` | Create lead from landing page form |
| POST | `/api/leads/google-forms` | Google Forms webhook |
| GET | `/api/marcas/slug/:slug` | Public brand fetch (landing pages) |
| POST | `/api/chat` | Claude AI chat |
| POST | `/api/whatsapp` | Evolution API inbound webhook |
| POST | `/api/agente` | AI agent message handler |
| POST | `/api/tasks` | Task management |
| GET | `/health` | Health check |

---

## Frontend Patterns

- **Data fetching**: React Query (TanStack) — hooks in `src/hooks/` (e.g., `useLeads`, `useMarcas`, `useMetrics`, `useInteracoes`). Stale time: 10 min, cache: 60 min.
- **Auth/Tenant**: `useAuth()` → `{ usuario, tenant, login, logout, isAdmin, hasPermission }`; `useTenant()` → admin tenant switching.
- **Styling**: Tailwind CSS, dark theme. Animations via Framer Motion. Charts via Recharts.
- **Naming**: hooks `use*`, pages `*Page`, components `*Button` / `*Card`.
- **Code splitting**: All pages are lazy-loaded via `React.lazy()` in App.jsx.

---

## Deployment

**Vercel** is the production target. `npm run build` (root) runs `scripts/build.sh` which compiles the frontend and copies the dist output into `server/public/dashboard-build/`.

**Required environment variables:** `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `ANTHROPIC_API_KEY`, `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `RESEND_API_KEY` (or `SMTP_*`), `CORS_ORIGINS`, `SENTRY_DSN`.

**Vercel rewrites** (see [vercel.json](vercel.json)): `/api/*` → serverless function, `/*` → SPA index.

---

## Key Integrations

| Service | Purpose |
|---------|---------|
| Supabase | PostgreSQL database, Auth, real-time subscriptions |
| Anthropic Claude | AI agent conversations and lead scoring refinement |
| Evolution API | WhatsApp messaging (Docker container or hosted VPS) |
| Resend / SMTP | Email notifications (Resend primary, SMTP fallback) |
| n8n | Workflow automation (reporting, webhooks) |
| Google Forms | Lead capture via Apps Script webhook |
| Sentry | Error monitoring (`SENTRY_DSN`, `VITE_SENTRY_DSN`) |
