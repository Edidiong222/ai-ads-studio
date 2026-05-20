"""Structured logging for AI generation (observability-friendly)."""
from __future__ import annotations

import json
import logging
from typing import Any

logger = logging.getLogger("studio.ai_ops")


def log_ai_operation(
    *,
    operation: str,
    user_id: int | None,
    status: str,
    brief_id: str | None = None,
    campaign_id: str | None = None,
    variant_count: int | None = None,
    image_job_id: str | None = None,
    error_type: str | None = None,
    message: str | None = None,
    extra: dict[str, Any] | None = None,
) -> None:
    payload = {
        "event": "ai_operation",
        "operation": operation,
        "user_id": user_id,
        "status": status,
        "brief_id": brief_id,
        "campaign_id": campaign_id,
        "variant_count": variant_count,
        "image_job_id": image_job_id,
        "error_type": error_type,
        "message": message,
        **(extra or {}),
    }
    logger.info(json.dumps(payload, default=str))
