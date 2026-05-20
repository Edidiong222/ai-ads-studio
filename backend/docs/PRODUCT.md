# Product positioning vs API classroom use

The **hosted web shell** exposes a slim surface: `/` (marketing), `/create-ad/`, `/pricing/`, `/settings/`, auth, and email verification.

**All REST routes under `/api/` remain mounted** regardless of whether the student uses the Django templates. Nothing in `studio/web_urls.py` removes `/api/dashboard/`, `/api/campaigns/`, Swagger at `/docs/`, etc. Students who only integrate via HTTP clients are unaffected.

| Promise | Delivered surface |
|---------|-------------------|
| Copy‑ready variants | `/api/ad-briefs/` + `POST .../generate/`, disclaimers applied |
| Visuals | `/api/ads/generate-image/` + status polling |
| Variant PDF | `GET /api/ad-briefs/<id>/variants/pdf/` (authenticated) |
| Observability | `studio.ai_ops` JSON logs; optional `SENTRY_DSN` in production |

We do **not** publish to Meta, Google, or other networks from this codebase. Messaging should say paste/copy/export only.
