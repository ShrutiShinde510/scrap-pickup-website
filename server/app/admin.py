from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


class UserAdmin(BaseUserAdmin):
    ordering = ["email"]
    list_display = ["email", "full_name", "is_staff"]

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("full_name",)}),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
        (
            "Vendor Info",
            {
                "fields": (
                    "business_name",
                    "business_type",
                    "operating_areas",
                    "scrape_types",
                )
            },
        ),
        (
            "Vendor Documents",
            {
                "fields": (
                    "business_license",
                    "gst_certificate",
                    "address_proof",
                    "id_proof",
                )
            },
        ),
        (
            "Vendor Verification",
            {
                "fields": (
                    "is_verified",
                    "is_phone_verified",
                    "is_email_verified",
                )
            },
        ),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "password",
                    "confirm_password",
                ),
            },
        ),
    )


admin.site.register(User, UserAdmin)
