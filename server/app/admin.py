from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, PickupRequest


class UserAdmin(BaseUserAdmin):
    ordering = ["email"]
    list_display = ["email", "full_name", "is_client", "is_seller", "is_staff"]
    list_filter = ["is_client", "is_seller", "is_staff", "is_active"]

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("full_name",)}),
        (
            "Roles",
            {
                "fields": (
                    "is_client",
                    "is_seller",
                )
            },
        ),
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
                    "vendor_id_proof",
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
                    "is_client",
                    "is_seller",
                    "full_name",
                ),
            },
        ),
    )


try:
    admin.site.unregister(User)
except admin.sites.NotRegistered:
    pass

admin.site.register(User, UserAdmin)


@admin.register(PickupRequest)
class PickupRequestAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "status",
        "date",
        "time_slot",
        "assigned_to",
        "is_phone_verified",
    )
    list_filter = ("status", "date", "is_phone_verified")
    search_fields = ("user__email", "address", "id", "assigned_to__email")
    list_editable = ("status", "assigned_to")
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        (
            "Request Details",
            {
                "fields": (
                    "user",
                    "status",
                    "assigned_to",
                    "date",
                    "time_slot",
                    "scrape_image",
                )
            },
        ),
        (
            "Location",
            {"fields": ("address", "latitude", "longitude")},
        ),
        (
            "Contact & Verification",
            {
                "fields": (
                    "contact_name",
                    "contact_phone",
                    "is_phone_verified",
                    "otp_code",
                )
            },
        ),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at")},
        ),
    )

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "assigned_to":
            kwargs["queryset"] = User.objects.filter(is_seller=True)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

