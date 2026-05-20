# Local Django web UI (templates)

The instructor UI from `frontend2/` is served as a normal Django site on your machine (templates + static), not as raw `.html` files.

## Setup

```powershell
cd backend
$env:USE_SQLITE = "true"
$env:SERVE_FRONTEND = "true"
python manage.py migrate
python manage.py build_web_templates   # sync HTML/JS/CSS from frontend2/
python manage.py runserver 8003
```

Open **http://127.0.0.1:8003/signin/** (root `/` redirects there).

## URLs

| Page | URL |
|------|-----|
| Sign in | `/signin/` |
| Sign up | `/signup/` |
| Dashboard | `/dashboard/` |
| Create ad | `/create-ad/` |
| Campaigns | `/campaigns/` |
| Analytics | `/analytics/` |
| Notifications | `/notifications/` |
| Settings | `/settings/` |
| History | `/history/` |
| Pricing | `/pricing/` |
| API base (JS) | `/config.js` |

Old paths like `/signin.html` redirect to the URLs above.

## After editing `frontend2/`

Re-run:

```powershell
python manage.py build_web_templates
```

Templates land in `studio/templates/web/`; assets in `studio/static/web/`.

## Production (Vercel)

Keep `SERVE_FRONTEND=false` — students use their own HTML against the live API only.
