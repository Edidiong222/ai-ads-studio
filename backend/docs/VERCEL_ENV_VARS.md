# Vercel environment variables

Copy each **name** and **value** from your local `backend/.env` into:

**Vercel → Project → Settings → Environment Variables → Production** (and Preview if you use it).

Do **not** commit `.env` to git.

After your first deploy, add your exact hostname to `DJANGO_ALLOWED_HOSTS`, e.g. `ai-ads-studio-api.vercel.app,.vercel.app`.

---

## Required on Vercel

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | **Supabase Transaction pooler** URL (port **6543**) — see below |
| `DJANGO_SECRET_KEY` | Same as local `.env` (generated secret) |
| `DJANGO_DEBUG` | `false` |
| `DJANGO_ALLOWED_HOSTS` | `your-project.vercel.app,.vercel.app` |
| `SERVE_FRONTEND` | `false` (students use their own HTML) |
| `CORS_ALLOW_ALL` | `true` for class, or list origins in `CORS_ALLOWED_ORIGINS` |
| `GROQ_API_KEY` | Groq API key |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` |
| `JWT_ACCESS_MINUTES` | `60` |
| `JWT_REFRESH_DAYS` | `7` |

## Supabase (uploads / PDFs)

| Variable | Notes |
|----------|--------|
| `SUPABASE_URL` | `https://dduympqtnpdocwnvxxwa.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase publishable / anon key |
| `SUPABASE_STORAGE_BUCKET` | `pdfs` (create bucket in Supabase if missing) |

## Do not set on Vercel

| Variable | Why |
|----------|-----|
| `USE_SQLITE` | Serverless has no persistent disk |
| `POSTGRES_*` alone | Use `DATABASE_URL` instead |

---

## DATABASE_URL — use Supabase **pooler** (fixes 503 on Vercel)

**Do not use** the direct host `db.xxxxx.supabase.co:5432` on Vercel. It often fails with:

`Cannot assign requested address` (IPv6 / serverless).

### Get the correct string

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Connect**.
2. Choose **ORMs** or **Connection string**.
3. Select **Transaction** mode (port **6543**), not Session/Direct.
4. Copy the URI. It looks like:

```text
postgresql://postgres.dduympqtnpdocwnvxxwa:[YOUR-PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
```

5. Append if missing: `?sslmode=require`
6. If your password has special characters (`@`, `#`, etc.), [URL-encode](https://www.urlencoder.org/) it.
7. Paste into **Vercel → Settings → Environment Variables → `DATABASE_URL`** for Production and Preview.
8. **Redeploy** the project.

### Local dev

You can keep direct `db....supabase.co:5432` in local `.env`, or use the same pooler URL everywhere.

---

## Run migrations on Supabase (fixes register 500)

Vercel build may **not** apply migrations to your real database if `DATABASE_URL` was missing at build time.  
If `POST /api/auth/register/` returns **500**, run this **once** from your PC:

```powershell
cd backend
$env:DATABASE_URL = "postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres?sslmode=require"
$env:DJANGO_SECRET_KEY = "same-secret-as-vercel"
$env:DJANGO_DEBUG = "false"
python manage.py migrate
```

Then test:

```powershell
$body = '{"email":"you@test.com","password":"TestPass123!","password_confirm":"TestPass123!"}'
Invoke-RestMethod -Uri "https://ai-ads-studio-kappa.vercel.app/api/auth/register/" -Method POST -Body $body -ContentType "application/json"
```

`GET /api/` should return `"database": "connected"` after you redeploy the latest backend.

---

## Vercel project settings

| Setting | Value |
|---------|--------|
| Repository branch | `backend` |
| Root directory | `backend` |
| Framework | Other (`vercel.json` in `backend/`) |

---

## Student API URL

After deploy:

```text
https://<your-vercel-project>.vercel.app/api
```

Students set:

```javascript
window.API_BASE = "https://<your-vercel-project>.vercel.app/api";
```
