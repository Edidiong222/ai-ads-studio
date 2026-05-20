from django.conf import settings
from rest_framework.exceptions import APIException

from accounts.models import UserProfile


class UsageLimitExceeded(APIException):
    status_code = 402
    default_detail = "Usage limit reached. Upgrade required."
    default_code = "quota_exceeded"

    def __init__(self, detail=None, code=None, upgrade_url=None):
        super().__init__(detail, code)
        self.upgrade_url = upgrade_url or getattr(settings, "PUBLIC_APP_URL", "") + "/pricing/"

    def get_full_details(self):
        details = super().get_full_details()
        if isinstance(details, dict):
            details["upgrade_url"] = self.upgrade_url
            details["error"] = "quota_exceeded"
        return details


def get_or_create_profile(user) -> UserProfile:
    profile, _ = UserProfile.objects.get_or_create(user=user)
    profile.reset_usage_if_needed()
    return profile


def _raise_quota(profile: UserProfile, kind: str):
    msg = f"Monthly {kind} generation limit reached. Upgrade to Pro for more."
    raise UsageLimitExceeded(detail=msg)


def check_copy_quota(user) -> UserProfile:
    if not user.is_authenticated:
        return None
    profile = get_or_create_profile(user)
    if profile.plan != UserProfile.PLAN_PRO and profile.copy_generations_used >= profile.copy_limit:
        _raise_quota(profile, "copy")
    return profile


def check_image_quota(user) -> UserProfile:
    if not user.is_authenticated:
        return None
    profile = get_or_create_profile(user)
    if profile.plan != UserProfile.PLAN_PRO and profile.image_generations_used >= profile.image_limit:
        _raise_quota(profile, "image")
    return profile


def check_generation_quota(user) -> UserProfile:
    """Legacy combined check — uses copy quota."""
    return check_copy_quota(user)


def record_copy_generation(user, count: int = 1) -> None:
    if not user.is_authenticated:
        return
    profile = get_or_create_profile(user)
    profile.copy_generations_used += count
    profile.generations_this_month += count
    profile.save(update_fields=["copy_generations_used", "generations_this_month"])


def record_image_generation(user, count: int = 1) -> None:
    if not user.is_authenticated:
        return
    profile = get_or_create_profile(user)
    profile.image_generations_used += count
    profile.generations_this_month += count
    profile.save(update_fields=["image_generations_used", "generations_this_month"])


def record_generation(user, count: int = 1) -> None:
    record_copy_generation(user, count)


def user_can_generate(user) -> bool:
    if not user or not user.is_authenticated:
        return True
    profile = get_or_create_profile(user)
    if profile.plan == UserProfile.PLAN_PRO:
        return True
    return profile.generations_this_month < profile.generation_limit
