# Bundle frontend for Vercel (backend root directory) and build Django templates.
# Run from repo root:
#   powershell -File backend/scripts/prepare-vercel-frontend.ps1
#
# Then commit and push:
#   git add backend/studio/templates/web backend/studio/static/web backend/frontend2
#   git add backend/studio/web_urls.py backend/studio/web_views.py

$ErrorActionPreference = "Stop"
$ScriptDir = $PSScriptRoot
$BackendDir = Split-Path -Parent $ScriptDir
$RepoRoot = Split-Path -Parent $BackendDir
$Src = Join-Path $RepoRoot "frontend2"
$Dest = Join-Path $BackendDir "frontend2"

if (-not (Test-Path $Src)) {
    Write-Host "frontend2/ not found at $Src - run sync-frontend2.ps1 first if you use student branches."
    exit 1
}

Write-Host "Copying frontend2 -> backend/frontend2 (for Vercel when Root Directory = backend)..."
if (Test-Path $Dest) { Remove-Item $Dest -Recurse -Force }
Copy-Item $Src $Dest -Recurse

Set-Location $BackendDir
Write-Host "Building Django web templates..."
python manage.py build_web_templates
python manage.py collectstatic --noinput

Write-Host ""
Write-Host "Done. In Vercel set:"
Write-Host '  SERVE_FRONTEND = true   (exactly, not truev)'
Write-Host "  Root Directory = backend   OR repo root with root vercel.json"
Write-Host ""
Write-Host "Commit before deploy:"
Write-Host "  backend/studio/templates/web"
Write-Host "  backend/studio/static/web"
Write-Host "  backend/frontend2"
