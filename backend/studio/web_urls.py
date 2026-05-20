from django.urls import path
from django.views.generic import RedirectView

from .web_views import (
    WebPageView,
    api_config_js,
    home_page,
    signin_page,
    signup_page,
    verify_email_page,
)

urlpatterns = [
    path("", home_page, name="web-home"),
    path("config.js", api_config_js, name="api-config-js"),
    path("signin/", signin_page, name="web-signin"),
    path("signup/", signup_page, name="web-signup"),
    path(
        "create-ad/",
        WebPageView.as_view(template_name="web/create_ad.html", active_nav="create-ad"),
        name="web-create-ad",
    ),
    path(
        "settings/",
        WebPageView.as_view(template_name="web/settings.html", active_nav="settings"),
        name="web-settings",
    ),
    path("pricing/", WebPageView.as_view(template_name="web/pricing.html"), name="web-pricing"),
    path("verify-email/", verify_email_page, name="web-verify-email"),
    # Legacy URLs → product shell (extra HTML sources remain in frontend2/ for reference)
    path("signin/signup.html", RedirectView.as_view(pattern_name="web-signup", permanent=False)),
    path("signin.html", RedirectView.as_view(pattern_name="web-signin", permanent=False)),
    path("signup.html", RedirectView.as_view(pattern_name="web-signup", permanent=False)),
    path("create-ad.html", RedirectView.as_view(pattern_name="web-create-ad", permanent=False)),
    path("settings.html", RedirectView.as_view(pattern_name="web-settings", permanent=False)),
    path("pricing.html", RedirectView.as_view(pattern_name="web-pricing", permanent=False)),
    path("verify-email.html", RedirectView.as_view(pattern_name="web-verify-email", permanent=False)),
    path("index.html", RedirectView.as_view(url="/create-ad/", permanent=False)),
    path("Dashboard.html", RedirectView.as_view(url="/create-ad/", permanent=False)),
]
