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
from .serializers import PickupRequestSerializer, OTPVerificationSerializer, ChatMessageSerializer
from .models import PickupRequest, ChatMessage
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
                "phone_number": user.phone_number,
                "is_client": user.is_client,
                "is_seller": user.is_seller,
                "is_verified": user.is_verified,
                "is_phone_verified": user.is_phone_verified,
                "is_email_verified": user.is_email_verified,
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

            # Auto-confirm if user is already verified
            if request.user.is_phone_verified:
                pickup_request.status = "confirmed"
                pickup_request.is_phone_verified = True
                pickup_request.save()

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


class VerifyAccountView(GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        otp = request.data.get("otp")
        if not otp:
            return Response(
                {"error": "OTP is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        user = request.user
        otp_service = OTPService()
        
        # Verify using user's phone number
        is_valid = otp_service.verify_otp(user.phone_number, otp)

        if is_valid:
            user.is_phone_verified = True
            user.is_email_verified = True
            user.save()
            return Response(
                {
                    "message": "Account verified successfully",
                    "user": {
                        "email": user.email,
                        "full_name": user.full_name,
                        "phone_number": user.phone_number,
                        "is_client": user.is_client,
                        "is_seller": user.is_seller,
                        "is_verified": user.is_verified,
                        "is_phone_verified": user.is_phone_verified,
                        "is_email_verified": user.is_email_verified,
                    }
                },
                status=status.HTTP_200_OK,
            )
        
        return Response(
            {"error": "Invalid or expired OTP"}, status=status.HTTP_400_BAD_REQUEST
        )


class UserBookingsView(GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PickupRequestSerializer

    def get(self, request):
        bookings = PickupRequest.objects.filter(user=request.user).order_by("-created_at")
        serializer = self.get_serializer(bookings, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CancelPickupView(GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            pickup = PickupRequest.objects.get(id=pk, user=request.user)
            if pickup.status == "pending":
                pickup.status = "cancelled"
                pickup.save()
                return Response(
                    {"message": "Booking cancelled successfully"},
                    status=status.HTTP_200_OK,
                )
            else:
                return Response(
                    {"error": "Cannot cancel booking. Status is not pending."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except PickupRequest.DoesNotExist:
            return Response(
                {"error": "Booking not found"}, status=status.HTTP_404_NOT_FOUND
            )


class AvailablePickupsView(GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PickupRequestSerializer

    def get(self, request):
        if not request.user.is_seller:
             return Response({"error": "Only vendors can view available pickups"}, status=status.HTTP_403_FORBIDDEN)
        
        # Pickups that are confirmed (ready for vendor) and not yet assigned
        # Logic: status='confirmed' means client verified phone & created request.
        # assigned_to is None means no one took it yet.
        pickups = PickupRequest.objects.filter(status="confirmed", assigned_to__isnull=True).order_by("-created_at")
        serializer = self.get_serializer(pickups, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class VendorPickupsView(GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PickupRequestSerializer

    def get(self, request):
        if not request.user.is_seller:
             return Response({"error": "Only vendors can view their pickups"}, status=status.HTTP_403_FORBIDDEN)

        pickups = PickupRequest.objects.filter(assigned_to=request.user).order_by("-updated_at")
        serializer = self.get_serializer(pickups, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AcceptPickupView(GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not request.user.is_seller:
             return Response({"error": "Only vendors can accept pickups"}, status=status.HTTP_403_FORBIDDEN)

        try:
            pickup = PickupRequest.objects.get(id=pk, status="confirmed", assigned_to__isnull=True)
            pickup.assigned_to = request.user
            pickup.status = "vendor_accepted"
            pickup.save()
            return Response({"message": "Pickup accepted. Waiting for client approval."}, status=status.HTTP_200_OK)
        except PickupRequest.DoesNotExist:
            return Response({"error": "Pickup unavailable or already taken"}, status=status.HTTP_404_NOT_FOUND)


class VendorCancelPickupView(GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
         # Vendor cancels their acceptance status (if still in vendor_accepted)
        try:
            pickup = PickupRequest.objects.get(id=pk, assigned_to=request.user)
            if pickup.status == "vendor_accepted":
                pickup.assigned_to = None
                pickup.status = "confirmed" # Release back to pool
                pickup.save()
                return Response({"message": "Pickup acceptance cancelled. Released back to pool."}, status=status.HTTP_200_OK)
            else:
                 return Response({"error": "Cannot cancel. Status is not 'vendor_accepted'."}, status=status.HTTP_400_BAD_REQUEST)
        except PickupRequest.DoesNotExist:
            return Response({"error": "Pickup not found"}, status=status.HTTP_404_NOT_FOUND)


class ApproveVendorView(GenericAPIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        # Client approves the vendor assigned to their pickup
        try:
            pickup = PickupRequest.objects.get(id=pk, user=request.user)
            if pickup.status == "vendor_accepted" and pickup.assigned_to:
                pickup.status = "scheduled"
                pickup.save()
                return Response({"message": "Vendor approved. Pickup scheduled."}, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Invalid status for approval"}, status=status.HTTP_400_BAD_REQUEST)
        except PickupRequest.DoesNotExist:
             return Response({"error": "Pickup request not found"}, status=status.HTTP_404_NOT_FOUND)


class RejectVendorView(GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        # Client rejects the vendor
        try:
            pickup = PickupRequest.objects.get(id=pk, user=request.user)
            if pickup.status == "vendor_accepted":
                pickup.assigned_to = None
                pickup.status = "confirmed" # Go back to pool
                pickup.save()
                return Response({"message": "Vendor rejected. Request is open again."}, status=status.HTTP_200_OK)
            else:
                 return Response({"error": "Invalid status for rejection"}, status=status.HTTP_400_BAD_REQUEST)
        except PickupRequest.DoesNotExist:
             return Response({"error": "Pickup request not found"}, status=status.HTTP_404_NOT_FOUND)


class ChatView(GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ChatMessageSerializer

    def get(self, request, pickup_id):
        try:
            pickup = PickupRequest.objects.get(id=pickup_id)
        except PickupRequest.DoesNotExist:
            return Response(
                {"error": "Pickup not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Allow if user is owner or assigned vendor
        if pickup.user != request.user and pickup.assigned_to != request.user:
            return Response(
                {"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN
            )

        messages = ChatMessage.objects.filter(pickup_request=pickup).order_by(
            "created_at"
        )
        serializer = self.get_serializer(messages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, pickup_id):
        try:
            pickup = PickupRequest.objects.get(id=pickup_id)
        except PickupRequest.DoesNotExist:
            return Response(
                {"error": "Pickup not found"}, status=status.HTTP_404_NOT_FOUND
            )

        if pickup.user != request.user and pickup.assigned_to != request.user:
            return Response(
                {"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN
            )

        # Optional: strictly enforce status check if needed
        # if pickup.status not in ["vendor_accepted", "scheduled"]:
        #    return Response({"error": "Chat not enabled for this status"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save(sender=request.user, pickup_request=pickup)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
