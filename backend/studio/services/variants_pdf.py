"""Export ad brief variants to a multi-page PDF (copy for sharing / clients)."""

import io
from xml.sax.saxutils import escape

from django.http import HttpResponse

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer

from studio.models import AdBrief, AdVariant


def _p(text: str) -> str:
    return escape(text or "").replace("\n", "<br/>")


def build_variants_pdf_bytes(brief: AdBrief, variants: list[AdVariant]) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter)
    styles = getSampleStyleSheet()

    story = [
        Paragraph(
            "<b>AI Ads Studio — Variant pack</b><br/><font size=10>"
            "For copy-paste only. We do not publish to Meta or any ad network from this file.</font>",
            styles["Title"],
        ),
        Spacer(1, 0.25 * inch),
        Paragraph(
            f"<b>Product / service:</b> {_p(brief.product_service)}<br/>"
            f"<b>Audience:</b> {_p(brief.audience)}<br/>"
            f"<b>Platform:</b> {_p(brief.platform)} &nbsp; <b>Tone:</b> {_p(brief.tone)}",
            styles["Normal"],
        ),
        Spacer(1, 0.35 * inch),
    ]

    for i, v in enumerate(variants, start=1):
        story.append(Paragraph(f"<b>Variant {i}</b>", styles["Heading2"]))
        story.append(Spacer(1, 6))
        story.append(Paragraph(f"<b>Headline</b><br/>{_p(v.headline)}", styles["Normal"]))
        story.append(Spacer(1, 6))
        story.append(Paragraph(f"<b>Primary text</b><br/>{_p(v.body)}", styles["Normal"]))
        if v.cta:
            story.append(Spacer(1, 6))
            story.append(Paragraph(f"<b>CTA</b><br/>{_p(v.cta)}", styles["Normal"]))
        if i < len(variants):
            story.append(PageBreak())

    doc.build(story)
    return buf.getvalue()


def variants_pdf_response(brief: AdBrief, variants: list[AdVariant], filename: str) -> HttpResponse:
    data = build_variants_pdf_bytes(brief, list(variants))
    resp = HttpResponse(data, content_type="application/pdf")
    resp["Content-Disposition"] = f'attachment; filename="{filename}"'
    return resp
