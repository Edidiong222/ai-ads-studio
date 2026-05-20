from django.urls import path

from .billing_views import (
    BillingCheckoutView,
    BillingPortalView,
    BillingStatusView,
    StripeWebhookView,
)
from .views import (
    EmailVerifyView,
    LoginView,
    LogoutView,
    MeView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    RefreshView,
    RegisterView,
    ResendVerificationView,
)

_pairs = (
    ("register/", RegisterView.as_view(), "auth-register"),
    ("login/", LoginView.as_view(), "auth-login"),
    ("refresh/", RefreshView.as_view(), "auth-refresh"),
    ("logout/", LogoutView.as_view(), "auth-logout"),
    ("me/", MeView.as_view(), "auth-me"),
    ("password-reset/", PasswordResetRequestView.as_view(), "auth-password-reset"),
    ("password-reset/confirm/", PasswordResetConfirmView.as_view(), "auth-password-reset-confirm"),
    ("verify-email/", EmailVerifyView.as_view(), "auth-verify-email"),
    ("resend-verify/", ResendVerificationView.as_view(), "auth-resend-verify"),
    ("billing/status/", BillingStatusView.as_view(), "billing-status"),
    ("billing/checkout/", BillingCheckoutView.as_view(), "billing-checkout"),
    ("billing/portal/", BillingPortalView.as_view(), "billing-portal"),
    ("billing/webhook/", StripeWebhookView.as_view(), "billing-webhook"),
)

urlpatterns = []
for pattern, view, name in _pairs:
    urlpatterns.append(path(pattern, view, name=name))
    if pattern.endswith("/"):
        urlpatterns.append(path(pattern.rstrip("/"), view, name=f"{name}-no-slash"))
