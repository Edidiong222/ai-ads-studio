from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from django.views.generic import RedirectView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/", include("studio.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path(
        "docs",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui-no-slash",
    ),
]

if not settings.SERVE_FRONTEND:
    urlpatterns.insert(
        0,
        path(
            "",
            RedirectView.as_view(url="/docs/", permanent=False),
            name="api-root",
        ),
    )

if settings.SERVE_FRONTEND:
    urlpatterns += [
        path("", include("studio.web_urls")),
    ]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
