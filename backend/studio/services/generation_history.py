import json
import logging
from typing import Any

from studio.models import GenerationRecord

logger = logging.getLogger("studio.generation")


def log_generation_start(user, source_type: str, source_id) -> None:
    logger.info(
        "generation_start user=%s source=%s:%s",
        getattr(user, "id", None),
        source_type,
        source_id,
    )


def log_generation_success(user, source_type: str, source_id, variant_count: int) -> None:
    logger.info(
        "generation_success user=%s source=%s:%s variants=%s",
        getattr(user, "id", None),
        source_type,
        source_id,
        variant_count,
    )


def log_generation_failure(user, source_type: str, source_id, error: str) -> None:
    logger.warning(
        "generation_failure user=%s source=%s:%s error=%s",
        getattr(user, "id", None),
        source_type,
        source_id,
        error,
    )


def save_generation_record(
    user,
    *,
    source_type: str,
    source_id,
    input_data: dict,
    output_data: Any,
    variant_count: int | None = None,
    status: str = GenerationRecord.STATUS_SUCCESS,
    error_message: str = "",
) -> GenerationRecord | None:
    if not user or not user.is_authenticated:
        return None
    if variant_count is None:
        variant_count = len(output_data) if isinstance(output_data, list) else 0
    try:

        def _json_safe(obj):
            if obj is None:
                return obj
            return json.loads(json.dumps(obj, default=str))

        od = output_data if isinstance(output_data, (dict, list)) else {"raw": str(output_data)}
        id_safe = _json_safe(input_data)
        od_safe = _json_safe(od)
        return GenerationRecord.objects.create(
            user=user,
            source_type=source_type,
            source_id=source_id,
            input_data=id_safe,
            output_data=od_safe,
            variant_count=variant_count,
            status=status,
            error_message=error_message[:512],
        )
    except Exception:
        logger.exception("failed to save generation record user=%s", user.id)
        return None
