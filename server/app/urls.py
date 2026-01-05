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
    VerifyPickupOTPView,
    SendOTPView,
    VerifyAccountView,
    UserBookingsView,
    CancelPickupView,
)

urlpatterns = [
    path("register/client/", ClientRegistrationView.as_view(), name="register_client"),
    path("register/seller/", SellerRegistrationView.as_view(), name="register_seller"),
    path("otp/send/", SendOTPView.as_view(), name="otp_send"),
    path("otp/verify/", VerifyOTPView.as_view(), name="otp_verify"),
    path("account/verify/", VerifyAccountView.as_view(), name="account_verify"),
    path("login/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    
    # Pickup Flow
    path("pickup/create/", CreatePickupView.as_view(), name="pickup_create"),
    path("pickup/list/", UserBookingsView.as_view(), name="pickup_list"),
    path("pickup/cancel/<int:pk>/", CancelPickupView.as_view(), name="pickup_cancel"),
    path("pickup/contact/", ContactInfoView.as_view(), name="pickup_contact"),
    path("pickup/verify-otp/", VerifyPickupOTPView.as_view(), name="pickup_verify_otp"),
]
