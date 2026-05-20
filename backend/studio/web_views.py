from django.http import HttpResponse
from django.shortcuts import render
from django.views.generic import TemplateView


def api_config_js(request):
    base = request.build_absolute_uri("/api").rstrip("/")
    body = f'window.API_BASE = "{base}";\n'
    return HttpResponse(body, content_type="application/javascript")


class WebPageView(TemplateView):
    """App shell pages (sidebar layout)."""

    active_nav = ""

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx["active_nav"] = self.active_nav
        return ctx


def signin_page(request):
    return render(request, "web/signin.html")


def signup_page(request):
    return render(request, "web/signup.html")


def home_page(request):
    return render(request, "web/landing.html")


def verify_email_page(request):
    return render(request, "web/verify_email.html")
