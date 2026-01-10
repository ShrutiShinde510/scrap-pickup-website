from django.contrib.auth.models import AbstractUser
from django.db import models
from .managers import CustomUserManager


class User(AbstractUser):
    username = None
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=150, blank=True)

    # common fields
    phone_number = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)

    # role flags
    is_client = models.BooleanField(default=False)
    is_seller = models.BooleanField(default=False)

    # Vendor Specific Fields
    business_name = models.CharField(max_length=255, blank=True)
    business_type = models.CharField(max_length=100, blank=True)
    operating_areas = models.TextField(
        blank=True, help_text="Comma separated list of cities"
    )

    # Documents
    business_license = models.FileField(
        upload_to="vendor_docs/license/", blank=True, null=True
    )
    gst_certificate = models.FileField(
        upload_to="vendor_docs/gst/", blank=True, null=True
    )
    address_proof = models.FileField(
        upload_to="vendor_docs/address/", blank=True, null=True
    )

    id_proof = models.FileField(upload_to="client_docs/id/", blank=True, null=True)
    vendor_id_proof = models.FileField(
        upload_to="vendor_docs/id/", blank=True, null=True
    )

    # Verification Flags
    is_verified = models.BooleanField(default=False)
    is_phone_verified = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)

    # storing list like ["PAPER", "GLASS"]
    scrape_types = models.JSONField(default=list, blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

    def __str__(self):
        return self.email


class PickupRequest(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("open", "Open"),
        ("vendor_accepted", "Vendor Accepted"),
        ("scheduled", "Scheduled"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="pickup_requests"
    )
    address = models.TextField()
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    date = models.DateField()
    time_slot = models.CharField(max_length=50)
    scrape_image = models.ImageField(upload_to="pickup_images/", blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_pickups",
    )

    # Scrap Details
    scrap_type = models.CharField(max_length=50, default="Mixed")
    quantity = models.DecimalField(max_digits=10, decimal_places=2, help_text="Quantity in Kg", default=0.0)
    estimated_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    # contact & verification
    contact_name = models.CharField(max_length=150, blank=True)
    contact_phone = models.CharField(max_length=15, blank=True)
    is_phone_verified = models.BooleanField(default=False)
    otp_code = models.CharField(max_length=6, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Pickup {self.id} - {self.status}"


class ChatMessage(models.Model):
    pickup_request = models.ForeignKey(
        PickupRequest, on_delete=models.CASCADE, related_name="messages"
    )
    sender = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="sent_messages"
    )
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    
    # Offer Details
    is_offer = models.BooleanField(default=False)
    offer_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    offer_status = models.CharField(
        max_length=20, 
        choices=[('pending', 'Pending'), ('accepted', 'Accepted'), ('rejected', 'Rejected')],
        default='pending'
    )

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Msg from {self.sender.email} on Pickup {self.pickup_request.id}"
