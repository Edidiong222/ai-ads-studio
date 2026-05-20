# Vercel not updating? Fix register 500

## Symptom

- `GET /api/` returns only `{"message": "AI Ads Studio API is running"}` (old code)
- `POST /api/auth/register/` returns **500**
- `/static/rest_framework/...` returns **404**

## Cause

1. Vercel is **not deploying** the `backend` branch (wrong root directory or branch).
2. **Migrations** never ran on Supabase (`accounts_userprofile` table missing).
3. **`DATABASE_URL` uses direct Supabase host** (`db.xxx.supabase.co:5432`) → **503** on Vercel with `Cannot assign requested address`. Use **Transaction pooler** (port **6543**) — see [VERCEL_ENV_VARS.md](./VERCEL_ENV_VARS.md).

## Preview works but Production is old (“Current” on wrong deploy)

If **Preview** deployments show `backend` + latest commits (`077ec84`, `7eff65b`) but **Production** shows an old “Redeploy of …” from another branch, students hitting `ai-ads-studio-kappa.vercel.app` still get the **old API**.

### Option A — Promote latest Preview to Production (fastest)

1. Vercel → **Deployments**
2. Open the top **Preview** deploy (`077ec84` — `Fix CI: use password that fails…`)
3. Click **⋯** (three dots) → **Promote to Production**
4. Confirm

Production URL will now serve the same code as Preview.

### Option B — Point Production at `backend` branch (permanent)

1. **Settings → Git → Production Branch** → change from `main` to **`backend`**
2. **Deployments → Redeploy** (or push a small commit to `backend`)

Every future push to `backend` will update Production automatically.

---

## Fix in Vercel Dashboard

1. **Settings → General → Root Directory**  
   - If your repo root is `ai-ads-studio-1`: leave **empty** (use root `vercel.json`)  
   - OR set to **`backend`** (uses `backend/vercel.json`)

2. **Settings → Git → Production Branch** → **`backend`**

3. **Settings → Environment Variables** (Production):
   - `DATABASE_URL` = Supabase **Transaction pooler** URL (port **6543**, host `*.pooler.supabase.com`) — **not** `db.xxx.supabase.co:5432`
   - `DJANGO_SECRET_KEY` = long random string
   - `DJANGO_DEBUG` = `false`
   - `DJANGO_ALLOWED_HOSTS` = `ai-ads-studio-kappa.vercel.app,.vercel.app`
   - `EXPOSE_API_ERRORS` = `true` (temporary, to see real errors)
   - Do **not** set `USE_SQLITE`

4. **Deployments → Redeploy** latest commit (must include `version` in `/api/` response).

## Verify deploy

```http
GET https://ai-ads-studio-kappa.vercel.app/api/
```

**New code** returns:

```json
{
  "status": "ok",
  "message": "AI Ads Studio API is running",
  "version": "abc123...",
  "database": "connected",
  "migrations": "applied"
}
```

## Test register

```json
POST /api/auth/register/
{
  "email": "student@test.com",
  "password": "TestPass123!",
  "password_confirm": "TestPass123!",
  "full_name": "Test Student"
}
```

Expect **201 Created**, not 500.
