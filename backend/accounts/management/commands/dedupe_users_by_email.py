"""Remove duplicate User rows that share the same email (keeps newest by id)."""
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db.models import Count

User = get_user_model()


class Command(BaseCommand):
    help = "Delete older duplicate users with the same email (case-insensitive)."

    def handle(self, *args, **options):
        dupes = (
            User.objects.values("email")
            .annotate(c=Count("id"))
            .filter(c__gt=1)
            .exclude(email="")
        )
        removed = 0
        for row in dupes:
            email = row["email"]
            users = list(User.objects.filter(email__iexact=email).order_by("-id"))
            keep = users[0]
            for extra in users[1:]:
                self.stdout.write(f"  remove user id={extra.id} email={email} (keep id={keep.id})")
                extra.delete()
                removed += 1
        self.stdout.write(self.style.SUCCESS(f"Removed {removed} duplicate user(s)."))
