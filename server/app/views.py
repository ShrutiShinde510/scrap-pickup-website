from rest_framework import status
from rest_framework.generics import GenericAPIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import ClientRegistrationSerializer, SellerRegistrationSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from .serializers import PickupRequestSerializer, OTPVerificationSerializer
from .models import PickupRequest
import random
from .services.otp_service import OTPService
from django.core.cache import cache


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


def get_auth_response(user, message):
    refresh = RefreshToken.for_user(user)
    return Response(
        {
            "message": message,
            "user": {
                "email": user.email,
                "full_name": user.full_name,
                "is_client": user.is_client,
                "is_seller": user.is_seller,
            },
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        },
        status=status.HTTP_201_CREATED,
    )


class ClientRegistrationView(GenericAPIView):
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    serializer_class = ClientRegistrationSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return get_auth_response(user, "Client registered successfully.")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SellerRegistrationView(GenericAPIView):
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]
    serializer_class = SellerRegistrationSerializer

    def post(self, request):
        data = request.data
        if hasattr(data, "getlist"):
            data = data.copy()  # Make mutable
            scrape_types = data.getlist("scrape_types")
            if scrape_types:
                data["scrape_types"] = scrape_types

        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            user = serializer.save()
            return get_auth_response(user, "Seller registered successfully.")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SendOTPView(GenericAPIView):
    permission_classes = [AllowAny]

    def post(self, request):
        contact = request.data.get("contact")
        channel = request.data.get("channel", "sms")

        if not contact:
            return Response(
                {"error": "Contact is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        otp_service = OTPService()
        status_msg = otp_service.send_otp(contact, channel=channel)

        if status_msg:
             return Response(
                {"message": f"OTP sent successfully via {channel}", "status": status_msg},
                status=status.HTTP_200_OK,
            )
        else:
             return Response(
                {"error": "Failed to send OTP. Check configuration."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class CreatePickupView(GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PickupRequestSerializer
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            pickup_request = serializer.save(user=request.user)

            return Response(
                {
                    "message": "Pickup request initiated.",
                    "request_id": pickup_request.id,
                    "status": pickup_request.status,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyOTPView(GenericAPIView):
    permission_classes = [AllowAny]

    def post(self, request):
        contact = request.data.get("contact")
        otp = request.data.get("otp")

        if not contact or not otp:
            return Response(
                {"error": "Contact and OTP are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        otp_service = OTPService()
        is_valid = otp_service.verify_otp(contact, otp)

        if is_valid:
            return Response({"message": "OTP Verified"}, status=status.HTTP_200_OK)

        return Response(
            {"error": "Invalid or expired OTP"}, status=status.HTTP_400_BAD_REQUEST
        )


class VerifyPickupOTPView(GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = OTPVerificationSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            req_id = serializer.validated_data["request_id"]
            otp = serializer.validated_data["otp"]

            try:
                pickup_req = PickupRequest.objects.get(id=req_id)
                if pickup_req.otp_code == otp:
                    pickup_req.is_phone_verified = True
                    pickup_req.status = "confirmed"
                    pickup_req.save()
                    return Response(
                        {"message": "Phone verified. Pickup confirmed."},
                        status=status.HTTP_200_OK,
                    )
                else:
                    return Response(
                        {"error": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST
                    )

            except PickupRequest.DoesNotExist:
                return Response(
                    {"error": "Request not found"}, status=status.HTTP_404_NOT_FOUND
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ContactInfoView(GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PickupRequestSerializer

    def post(self, request):
        req_id = request.data.get("request_id")
        if not req_id:
            return Response(
                {"error": "request_id required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            pickup = PickupRequest.objects.get(id=req_id, user=request.user)
            contact_name = request.data.get("contact_name")
            contact_phone = request.data.get("contact_phone")

            pickup.contact_name = contact_name
            pickup.contact_phone = contact_phone

            otp_service = OTPService()
            mock_otp = otp_service.send_otp(contact_phone, channel="sms")

            pickup.otp_code = mock_otp
            pickup.save()

            print(f"------------> OTP for Request {req_id}: {mock_otp}")

            return Response(
                {
                    "message": "Contact info updated. OTP sent.",
                    "request_id": pickup.id,
                    "mock_otp": mock_otp,
                },
                status=status.HTTP_200_OK,
            )

        except PickupRequest.DoesNotExist:
            return Response(
                {"error": "Pickup request not found"}, status=status.HTTP_404_NOT_FOUND
            )
