from django.urls import path

from .ads_views import AdsBriefView, AdsGenerateImageView, AdsGenerateView, AdsImageStatusView
from .legal_views import PrivacyView, TermsView
from .views import (
    AdBriefDetailView,
    AdBriefGenerateView,
    AdBriefListCreateView,
    AdBriefVariantsListView,
    AdBriefVariantsPdfView,
    AnalyticsView,
    CampaignDetailView,
    CampaignListCreateView,
    CampaignSimulateMetricsView,
    DashboardView,
    GenerationHistoryListView,
    HealthView,
    NotificationListView,
    NotificationMarkReadView,
    ProjectCreativesListView,
    ProjectDetailView,
    ProjectGenerateView,
    ProjectListCreateView,
)


def _dual_slash(pattern_slash, view, name):
    """Register with and without trailing slash (APPEND_SLASH is False)."""
    parts = [path(pattern_slash, view, name=name)]
    if pattern_slash.endswith("/"):
        stripped = pattern_slash.rstrip("/")
        if stripped:
            parts.append(path(stripped, view, name=f"{name}-no-slash"))
    return parts


urlpatterns = []

# Health: "" and optional no-slash for root health is same as "" 
urlpatterns.extend(_dual_slash("", HealthView.as_view(), "health"))

urlpatterns.extend(_dual_slash("ads/brief/", AdsBriefView.as_view(), "api-ads-brief"))
urlpatterns.extend(_dual_slash("ads/generate/", AdsGenerateView.as_view(), "api-ads-generate"))
urlpatterns.extend(
    _dual_slash("ads/generate-image/", AdsGenerateImageView.as_view(), "api-ads-generate-image")
)

# image-status has uuid in path — two variants
urlpatterns.extend(
    _dual_slash(
        "ads/image-status/<uuid:job_id>/",
        AdsImageStatusView.as_view(),
        "api-ads-image-status",
    )
)

urlpatterns.extend(_dual_slash("legal/terms/", TermsView.as_view(), "api-legal-terms"))
urlpatterns.extend(_dual_slash("legal/privacy/", PrivacyView.as_view(), "api-legal-privacy"))
urlpatterns.extend(
    _dual_slash("generations/", GenerationHistoryListView.as_view(), "api-generations")
)
urlpatterns.extend(_dual_slash("dashboard/", DashboardView.as_view(), "api-dashboard"))
urlpatterns.extend(_dual_slash("analytics/", AnalyticsView.as_view(), "api-analytics"))

urlpatterns.extend(_dual_slash("ad-briefs/", AdBriefListCreateView.as_view(), "api-ad-briefs"))
urlpatterns.extend(
    _dual_slash("ad-briefs/<uuid:brief_id>/", AdBriefDetailView.as_view(), "api-ad-brief-detail")
)
urlpatterns.extend(
    _dual_slash(
        "ad-briefs/<uuid:brief_id>/generate/",
        AdBriefGenerateView.as_view(),
        "api-ad-brief-generate",
    )
)
urlpatterns.extend(
    _dual_slash(
        "ad-briefs/<uuid:brief_id>/variants/",
        AdBriefVariantsListView.as_view(),
        "api-ad-brief-variants",
    )
)
urlpatterns.extend(
    _dual_slash(
        "ad-briefs/<uuid:brief_id>/variants/pdf/",
        AdBriefVariantsPdfView.as_view(),
        "api-ad-brief-variants-pdf",
    )
)

urlpatterns.extend(
    _dual_slash("campaigns/", CampaignListCreateView.as_view(), "api-campaigns")
)
urlpatterns.extend(
    _dual_slash("campaigns/<uuid:campaign_id>/", CampaignDetailView.as_view(), "api-campaign-detail")
)
urlpatterns.extend(
    _dual_slash(
        "campaigns/<uuid:campaign_id>/simulate/",
        CampaignSimulateMetricsView.as_view(),
        "api-campaign-simulate",
    )
)

urlpatterns.extend(
    _dual_slash("notifications/", NotificationListView.as_view(), "api-notifications")
)
urlpatterns.extend(
    _dual_slash(
        "notifications/<uuid:notification_id>/read/",
        NotificationMarkReadView.as_view(),
        "api-notification-read",
    )
)

urlpatterns.extend(
    _dual_slash("projects/", ProjectListCreateView.as_view(), "api-projects-list")
)
urlpatterns.extend(
    _dual_slash("projects/<uuid:project_id>/", ProjectDetailView.as_view(), "api-project-detail")
)
urlpatterns.extend(
    _dual_slash(
        "projects/<uuid:project_id>/generate/",
        ProjectGenerateView.as_view(),
        "api-project-generate",
    )
)
urlpatterns.extend(
    _dual_slash(
        "projects/<uuid:project_id>/creatives/",
        ProjectCreativesListView.as_view(),
        "api-project-creatives",
    )
)
