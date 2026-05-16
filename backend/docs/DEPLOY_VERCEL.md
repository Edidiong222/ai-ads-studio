# Deploy the API on Vercel (`backend` branch)

Students keep their **HTML in `frontend2/`** on their own branches. They point `window.API_BASE` at **your** hosted API.

> **Important:** Vercel is serverless. **SQLite will not work** (data is wiped). Use **PostgreSQL** (Neon or Vercel Postgres). Groq key stays in Vercel env vars, never in git.

---

## 1. Database (required)

Pick one free Postgres host:

| Provider | Notes |
|----------|--------|
| [Neon](https://neon.tech) | Easy; copy **connection string** → `DATABASE_URL` |
| [Vercel Postgres](https://vercel.com/storage/postgres) | Add from Vercel project → Storage |

Connection string looks like:

`postgresql://user:pass@host/db?sslmode=require`

---

## 2. Vercel project (GitHub → `backend` branch)

1. Go to [vercel.com](https://vercel.com) → **Add New Project**.
2. Import **Edidiong222/ai-ads-studio** (or your fork).
3. **Production Branch:** `backend` (not `main`).
4. **Root Directory:** `backend` (click Edit → set to `backend`).
5. Framework: **Other** (Vercel uses `backend/vercel.json`).
6. **Environment variables** (Production + Preview):

| Variable | Example / notes |
|----------|-----------------|
| `DATABASE_URL` | Postgres URL from step 1 |
| `DJANGO_SECRET_KEY` | Long random string |
| `DJANGO_DEBUG` | `false` |
| `DJANGO_ALLOWED_HOSTS` | `your-app.vercel.app,.vercel.app` |
| `SERVE_FRONTEND` | `false` (API only for students) |
| `CORS_ALLOW_ALL` | `true` for class demos, or set `CORS_ALLOWED_ORIGINS` to student URLs |
| `GROQ_API_KEY` | Your real Groq key |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` |
| `JWT_ACCESS_MINUTES` | `60` |
| `JWT_REFRESH_DAYS` | `7` |

Optional (file uploads to cloud):

- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_STORAGE_BUCKET`

7. **Deploy**.

After deploy, your API base is:

`https://<your-project>.vercel.app/api`

Docs: `https://<your-project>.vercel.app/docs/`

---

## 3. What students do

They **do not** deploy the backend. They only change how the UI finds the API.

### Option A — `config.js` (if they serve pages from Django locally)

When running your server locally, `/config.js` sets `API_BASE`. On Vercel with `SERVE_FRONTEND=false`, students host HTML themselves and set the base URL in JS.

### Option B — Set base URL in their scripts (recommended)

At the top of `auth.js` (or a small `config.js` they add):

```javascript
window.API_BASE = "https://YOUR-PROJECT.vercel.app/api";
```

All existing `auth.js` / `app.js` calls use `window.API_BASE`.

### Option C — Live Server / static host

If they open HTML from `http://127.0.0.1:5500`, add that origin to your Vercel env:

`CORS_ALLOWED_ORIGINS=http://127.0.0.1:5500,http://localhost:5500`

Or use `CORS_ALLOW_ALL=true` for teaching (less strict).

### Test from browser console

```javascript
fetch("https://YOUR-PROJECT.vercel.app/api/")
  .then((r) => r.json())
  .then(console.log);
```

Sign up / sign in:

- `POST https://YOUR-PROJECT.vercel.app/api/auth/register/`
- `POST https://YOUR-PROJECT.vercel.app/api/auth/login/`

---

## 4. Share with the class

Send students:

1. **API base URL:** `https://YOUR-PROJECT.vercel.app/api`
2. **OpenAPI docs:** `https://YOUR-PROJECT.vercel.app/docs/`
3. **Guide:** `backend/docs/API_GUIDE.md` on GitHub (`backend` branch)

They keep building UI on branches like `ad-page`, `Dashboard`, etc., and only wire `API_BASE` to your deployment.

---

## 5. Redeploy after you push `backend`

```powershell
git checkout backend
git add backend/
git commit -m "fix(api): ..."
git push origin backend
```

Vercel redeploys automatically if Git integration is enabled.

---

## 6. Limits & troubleshooting

| Issue | Fix |
|-------|-----|
| 500 on first request | Cold start; check Vercel **Logs** |
| `DisallowedHost` | Add hostname to `DJANGO_ALLOWED_HOSTS` |
| CORS error in browser | Set `CORS_ALLOW_ALL=true` or add student origin to `CORS_ALLOWED_ORIGINS` |
| DB errors | Confirm `DATABASE_URL` and migrations ran (build log should show `migrate`) |
| Generate ads fails | Set valid `GROQ_API_KEY` in Vercel env |
| SQLite / empty DB | You must use `DATABASE_URL`, not `USE_SQLITE` on Vercel |

**Easier alternative:** [Render](https://render.com) or [Railway](https://railway.app) run Django as a normal web service (often simpler than serverless). Vercel works for an API-only deployment if Postgres is configured.

---

## 7. Quick checklist

- [ ] Postgres created, `DATABASE_URL` in Vercel
- [ ] Project root = `backend`, branch = `backend`
- [ ] `SERVE_FRONTEND=false`, `DJANGO_DEBUG=false`
- [ ] `GROQ_API_KEY` set
- [ ] CORS configured for student origins
- [ ] Test `/api/` and `/docs/` in browser
- [ ] Give students the API URL + `API_GUIDE.md`
