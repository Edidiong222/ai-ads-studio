# AI Ads Studio — MVP to market (honest roadmap)

Current state: **instructor-ready demo** + **student API**. Not yet a commercial SaaS.

---

## Shipped in this polish (local `frontend2/` only)

- Unified design system (`studio.css`)
- Secure API layer (`ui.js`): XSS escape, JWT refresh, toasts
- Production auth UX (inline errors, loading states, API logout)
- Live analytics refresh (8s) + campaign **Simulate live run**
- Dashboard / campaigns / notifications wired to real API

**Not pushed to `backend` branch** — show students this reference, they rebuild UI on their branches against your API.

---

## Phase 1 — Sellable MVP (8–12 weeks)

| Area | Requirement |
|------|-------------|
| Product | One clear promise: “AI ad copy + briefs for SMB marketers” |
| Frontend | Single React/Next app (replace scattered HTML branches) |
| Auth | Email verify, password reset, rate limits |
| Billing | Stripe subscriptions + usage caps on generate |
| AI | Reliable Groq/LLM with queue + fallback + cost tracking |
| Data | Postgres backups, migrations CI, no SQLite in prod |
| Deploy | API on Render/Railway; CDN for frontend |
| Legal | Terms, privacy, AI disclosure, content policy |
| Support | Error monitoring (Sentry), status page |

---

## Phase 2 — Differentiation (3–6 months)

- Meta / Google Ads **read-only** insights (real metrics, not simulate)
- Team workspaces (org, roles, shared campaigns)
- Brand kit (logo, colors, voice) in every generation
- Export: PDF brief, CSV, share links
- A/B variant scoring (pick winner before spend)

---

## Phase 3 — “Big” product (12+ months)

- Direct ad publish + budget management
- Creative assets (images/video) not just copy
- Attribution / ROAS dashboards
- Enterprise SSO, audit logs, SOC2 path
- Mobile app or PWA offline drafts

---

## What students build vs instructor owns

| Instructor (you) | Students |
|--------------------|----------|
| API on Vercel (`/api`) | HTML/JS UI on their branches |
| DB, auth, generate, analytics endpoints | Wire `window.API_BASE` to your URL |
| OpenAPI + `LIVE_API.md` | Match layouts to polished reference in `frontend2/` |

---

## API URL for class

```
https://ai-ads-studio-kappa.vercel.app/api
```

Docs: `https://ai-ads-studio-kappa.vercel.app/docs/`
