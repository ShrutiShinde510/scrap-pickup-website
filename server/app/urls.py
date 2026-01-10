from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    ClientRegistrationView,
    SellerRegistrationView,
    CustomTokenObtainPairView,
    CreatePickupView,
    ContactInfoView,
    VerifyOTPView,
    VerifyPickupOTPView,
    SendOTPView,
    VerifyAccountView,
    UserBookingsView,
    CancelPickupView,
    AvailablePickupsView,
    VendorPickupsView,
    AcceptPickupView,
    VendorCancelPickupView,
    ApproveVendorView,
    RejectVendorView,
    ChatView,
    AcceptOfferView,
    RejectOfferView,
)

urlpatterns = [
    path("register/client/", ClientRegistrationView.as_view(), name="register_client"),
    path("register/seller/", SellerRegistrationView.as_view(), name="register_seller"),
    path("otp/send/", SendOTPView.as_view(), name="otp_send"),
    path("otp/verify/", VerifyOTPView.as_view(), name="otp_verify"),
    path("account/verify/", VerifyAccountView.as_view(), name="account_verify"),
    path("login/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    
    # Pickup Flow (Client)
    path("pickup/create/", CreatePickupView.as_view(), name="pickup_create"),
    path("pickup/list/", UserBookingsView.as_view(), name="pickup_list"),
    path("pickup/cancel/<int:pk>/", CancelPickupView.as_view(), name="pickup_cancel"),
    path("pickup/contact/", ContactInfoView.as_view(), name="pickup_contact"),
    path("pickup/verify-otp/", VerifyPickupOTPView.as_view(), name="pickup_verify_otp"),
    
    # Pickup Flow (Vendor)
    path("pickup/available/", AvailablePickupsView.as_view(), name="pickup_available"),
    path("pickup/vendor-list/", VendorPickupsView.as_view(), name="pickup_vendor_list"),
    path("pickup/accept/<int:pk>/", AcceptPickupView.as_view(), name="pickup_accept"),
    path("pickup/vendor-cancel/<int:pk>/", VendorCancelPickupView.as_view(), name="pickup_vendor_cancel"),

    # Pickup Approval (Client)
    path("pickup/approve/<int:pk>/", ApproveVendorView.as_view(), name="pickup_approve"),
    path("pickup/reject/<int:pk>/", RejectVendorView.as_view(), name="pickup_reject"),
    path("pickup/chat/<int:pickup_id>/", ChatView.as_view(), name="pickup_chat"),
    path("pickup/offer/<int:msg_id>/accept/", AcceptOfferView.as_view(), name="offer_accept"),
    path("pickup/offer/<int:msg_id>/reject/", RejectOfferView.as_view(), name="offer_reject"),
]
