from rest_framework import serializers
from .models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import PickupRequest


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        data["user"] = {
            "email": self.user.email,
            "full_name": self.user.full_name,
            "phone_number": self.user.phone_number,
            "is_client": self.user.is_client,
            "is_seller": self.user.is_seller,
            "is_verified": self.user.is_verified,
            "is_phone_verified": self.user.is_phone_verified,
            "is_email_verified": self.user.is_email_verified,
        }
        return data


class ClientRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    # Override email to drop the unique validator so we can handle existing users in create()
    email = serializers.EmailField()

    class Meta:
        model = User
        fields = [
            "email",
            "password",
            "full_name",
            "phone_number",
            "address",
            "city",
            "id_proof",
        ]
        extra_kwargs = {
            'email': {'validators': []}
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if 'email' in self.fields:
            self.fields['email'].validators = []

    def validate(self, attrs):
        # We can do custom validation here if needed
        return attrs

    def create(self, validated_data):
        email = validated_data.get("email")
        password = validated_data.get("password")
        
        # Check if user exists
        try:
            user = User.objects.get(email=email)
            # User exists, verify password
            if not user.check_password(password):
                 raise serializers.ValidationError({"password": ["Account with this email exists, but password incorrect."]})
            
            # Link Profile: Update to be a client
            user.is_client = True
            
            # Update other fields if provided (and not empty)
            for attr, value in validated_data.items():
                if attr not in ['email', 'password'] and value:
                    setattr(user, attr, value)
            
            user.save()
            return user
            
        except User.DoesNotExist:
            # Create new user
            validated_data["is_client"] = True
            return User.objects.create_user(**validated_data)


class SellerRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    scrape_types = serializers.ListField(
        child=serializers.CharField(max_length=50), allow_empty=True, required=False
    )
    # Override email to drop unique validator
    email = serializers.EmailField()

    class Meta:
        model = User
        fields = [
            "email",
            "password",
            "full_name",
            "phone_number",
            "address",
            "city",
            "scrape_types",
            "business_name",
            "business_type",
            "operating_areas",
            "business_license",
            "gst_certificate",
            "address_proof",
            "vendor_id_proof",
        ]
        extra_kwargs = {
            'email': {'validators': []}
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if 'email' in self.fields:
            self.fields['email'].validators = []

    def create(self, validated_data):
        email = validated_data.get("email")
        password = validated_data.get("password")

        # Check if user exists
        try:
            user = User.objects.get(email=email)
             # User exists, verify password
            if not user.check_password(password):
                 raise serializers.ValidationError({"password": ["Account with this email exists, but password incorrect."]})
            
            # Link Profile: Update to be a seller
            user.is_seller = True

             # Update other fields logic 
            for attr, value in validated_data.items():
                if attr not in ['email', 'password'] and value:
                    setattr(user, attr, value)

            user.save()
            return user

        except User.DoesNotExist:
            validated_data["is_seller"] = True
            return User.objects.create_user(**validated_data)


class PickupRequestSerializer(serializers.ModelSerializer):
    contact_name = serializers.CharField(required=False, allow_blank=True)
    contact_phone = serializers.CharField(required=False, allow_blank=True)
    vendor_name = serializers.SerializerMethodField()
    vendor_phone = serializers.SerializerMethodField()

    class Meta:
        model = PickupRequest
        fields = [
            "id",
            "address",
            "latitude",
            "longitude",
            "date",
            "time_slot",
            "scrape_image",
            "status",
            "contact_name",
            "contact_phone",
            "is_phone_verified",
            "scrap_type",
            "quantity",
            "estimated_price",
            "created_at",
            "vendor_name",
            "vendor_phone",
        ]
        read_only_fields = ["id", "status", "is_phone_verified", "created_at"]

    def get_vendor_name(self, obj):
        return obj.assigned_to.full_name if obj.assigned_to else None

    def get_vendor_phone(self, obj):
        return obj.assigned_to.phone_number if obj.assigned_to else None


class OTPVerificationSerializer(serializers.Serializer):
    request_id = serializers.IntegerField()
    otp = serializers.CharField(min_length=6, max_length=6)
