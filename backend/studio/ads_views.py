"""Spec-style /api/ads/* endpoints (aliases over studio models)."""

import logging
import threading

from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .models import AdBrief, GeneratedAd, ImageGenerationJob, Notification
from .serializers import AdBriefCreateSerializer, AdBriefSerializer, AdVariantSerializer
from .services.ai_ops import log_ai_operation
from .services.grok import generate_image, is_configured
from .services.moderation import moderate_brief_input
from .services.usage import check_image_quota, record_image_generation

logger = logging.getLogger(__name__)

ASPECT_MAP = {
    "square": "1:1",
    "story": "9:16",
    "banner": "16:9",
}


class ImageGenerateThrottle(ScopedRateThrottle):
    scope = "image_generate"


def _run_image_job(job_id):
    from django.db import connection

    connection.close()
    job = ImageGenerationJob.objects.select_related("brief").get(id=job_id)
    try:
        brief = job.brief
        product = job.product_name or (brief.product_service if brief else "Product")
        prompt = (
            f"Professional ad creative for {product}. "
            f"Style: {job.style or 'modern, clean'}. "
            f"Format: {job.platform_format}. High quality marketing visual, no text overlay."
        )
        aspect = ASPECT_MAP.get(job.platform_format, "1:1")
        url = generate_image(prompt, aspect_ratio=aspect)
        job.status = ImageGenerationJob.STATUS_DONE
        job.image_url = url
        job.save(update_fields=["status", "image_url", "updated_at"])
        GeneratedAd.objects.create(
            user=job.user,
            brief=job.brief,
            ad_type=GeneratedAd.TYPE_IMAGE,
            content=url,
            platform_format=job.platform_format,
        )
        record_image_generation(job.user)
        Notification.objects.create(
            user=job.user,
            title="Image ready",
            message=f"Your ad image for {product[:60]} is ready to download.",
        )
        log_ai_operation(
            operation="image_generate",
            user_id=job.user_id,
            status="ok",
            brief_id=str(job.brief_id) if job.brief_id else None,
            image_job_id=str(job.id),
            extra={"platform_format": job.platform_format},
        )
    except Exception as exc:
        logger.exception("image job %s failed", job_id)
        log_ai_operation(
            operation="image_generate",
            user_id=job.user_id,
            status="error",
            brief_id=str(job.brief_id) if job.brief_id else None,
            image_job_id=str(job.id),
            error_type=exc.__class__.__name__,
            message=str(exc)[:500],
        )
        job.status = ImageGenerationJob.STATUS_FAILED
        job.error_message = str(exc)[:500]
        job.save(update_fields=["status", "error_message", "updated_at"])


class AdsBriefView(APIView):
    """POST /api/ads/brief — create brief."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        ser = AdBriefCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        brief = ser.save(owner=request.user)
        return Response(AdBriefSerializer(brief, context={"request": request}).data, status=201)


class AdsGenerateView(APIView):
    """POST /api/ads/generate — body: { brief_id }"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        brief_id = request.data.get("brief_id")
        if not brief_id:
            return Response({"error": "brief_id is required"}, status=400)
        from .views import AdBriefGenerateView

        view = AdBriefGenerateView.as_view()
        return view(request, brief_id=brief_id)


class AdsGenerateImageView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ImageGenerateThrottle]
    throttle_scope = "image_generate"

    def post(self, request):
        if not is_configured():
            return Response(
                {
                    "error": "GROK_API_KEY is not configured on the server.",
                    "detail": (
                        "Images use xAI Grok (not Groq). In backend/.env set GROK_API_KEY or XAI_API_KEY "
                        "to your key from https://console.x.ai — then restart runserver. "
                        "Check GET /api/ → grok_image_ready should be true."
                    ),
                },
                status=503,
            )
        check_image_quota(request.user)
        brief_id = request.data.get("brief_id")
        brief = None
        if brief_id:
            brief = get_object_or_404(AdBrief, id=brief_id, owner=request.user)
            ok, reason = moderate_brief_input(
                {
                    "product_service": brief.product_service,
                    "audience": brief.audience,
                    "key_message": brief.key_message,
                }
            )
            if not ok:
                return Response({"error": reason}, status=400)

        product_name = request.data.get("product_name") or (
            brief.product_service if brief else ""
        )
        if not product_name:
            return Response({"error": "product_name or brief_id is required"}, status=400)

        platform_format = request.data.get("platform_format", GeneratedAd.FORMAT_SQUARE)
        if platform_format not in dict(GeneratedAd.FORMAT_CHOICES):
            platform_format = GeneratedAd.FORMAT_SQUARE

        job = ImageGenerationJob.objects.create(
            user=request.user,
            brief=brief,
            product_name=product_name[:512],
            style=(request.data.get("style") or "")[:128],
            platform_format=platform_format,
            status=ImageGenerationJob.STATUS_PENDING,
        )

        thread = threading.Thread(target=_run_image_job, args=(job.id,), daemon=True)
        thread.start()

        return Response(
            {"job_id": str(job.id), "status": job.status},
            status=202,
        )


class AdsImageStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, job_id):
        job = get_object_or_404(ImageGenerationJob, id=job_id, user=request.user)
        payload = {"job_id": str(job.id), "status": job.status}
        if job.status == ImageGenerationJob.STATUS_DONE:
            payload["image_url"] = job.image_url
        if job.status == ImageGenerationJob.STATUS_FAILED:
            payload["error"] = job.error_message or "Image generation failed"
        return Response(payload)
