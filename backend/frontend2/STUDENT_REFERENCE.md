# Instructor reference UI (do not copy blindly)

This folder is the **polished reference** for demos. Students should **design their own UI** but use the same API contract.

## Run locally (full site)

```powershell
cd backend
$env:SERVE_FRONTEND="true"
.\.venv\Scripts\python.exe manage.py runserver 8000
```

Open http://127.0.0.1:8000/signin.html

## Files

| File | Role |
|------|------|
| `ui.js` | API client, toasts, HTML escape, token refresh |
| `auth.js` | Login gate, register, login |
| `app.js` | Dashboard, campaigns, analytics, ads, notifications |
| `nav.js` | Sidebar routes, sign out |
| `studio.css` | Shared visual polish |

## Point at instructor API

```javascript
window.API_BASE = "https://ai-ads-studio-kappa.vercel.app/api";
```

Or use `/config.js` when running from Django locally.

## Test analytics charts

1. Sign in → **Campaigns** → **+ New campaign**
2. Click **Simulate live run** on a card
3. Open **Analytics** — charts update; page refreshes every 8 seconds

## Security notes for students

- Never commit API keys in frontend code
- Store JWT in `localStorage` only for class projects; production apps often prefer httpOnly cookies
- Always escape user-generated text before `innerHTML` (see `StudioUI.escapeHtml`)
