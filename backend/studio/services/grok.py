"""xAI Grok API — chat (copy) and image generation."""

import logging

import httpx
from django.conf import settings

logger = logging.getLogger(__name__)

XAI_BASE = "https://api.x.ai/v1"


class GrokServiceError(Exception):
    pass


def _api_key() -> str:
    key = getattr(settings, "GROK_API_KEY", "") or ""
    if not key:
        raise GrokServiceError(
            "GROK_API_KEY is not configured. Add your xAI API key to backend/.env"
        )
    return key


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {_api_key()}",
        "Content-Type": "application/json",
    }


def is_configured() -> bool:
    return bool(getattr(settings, "GROK_API_KEY", ""))


def chat_json(system: str, user_prompt: str) -> dict:
    """Return parsed JSON from Grok chat completion."""
    import json

    model = getattr(settings, "GROK_MODEL", "grok-3-latest")
    timeout = int(getattr(settings, "GROK_TIMEOUT_SECONDS", 60))
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.85,
        "response_format": {"type": "json_object"},
    }
    with httpx.Client(timeout=timeout) as client:
        resp = client.post(
            f"{XAI_BASE}/chat/completions",
            headers=_headers(),
            json=payload,
        )
    if resp.status_code >= 400:
        logger.error("Grok chat error %s: %s", resp.status_code, resp.text[:500])
        raise GrokServiceError(f"Grok API error ({resp.status_code})")
    content = resp.json()["choices"][0]["message"]["content"]
    return json.loads(content)


def generate_image(prompt: str, aspect_ratio: str = "1:1") -> str:
    """Generate one image; return URL."""
    model = getattr(settings, "GROK_IMAGE_MODEL", "grok-imagine-image-quality")
    timeout = int(getattr(settings, "GROK_IMAGE_TIMEOUT_SECONDS", 120))
    payload = {
        "model": model,
        "prompt": prompt,
        "n": 1,
        "aspect_ratio": aspect_ratio,
        "response_format": "url",
    }
    with httpx.Client(timeout=timeout) as client:
        resp = client.post(
            f"{XAI_BASE}/images/generations",
            headers=_headers(),
            json=payload,
        )
    if resp.status_code >= 400:
        logger.error("Grok image error %s: %s", resp.status_code, resp.text[:500])
        raise GrokServiceError(f"Grok image API error ({resp.status_code})")
    data = resp.json()
    items = data.get("data") or []
    if not items:
        raise GrokServiceError("Grok returned no image data")
    url = items[0].get("url") or items[0].get("b64_json")
    if not url:
        raise GrokServiceError("Grok image response missing URL")
    return url
