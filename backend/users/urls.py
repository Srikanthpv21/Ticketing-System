from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView
from .auth import VersionedTokenRefreshView
from .views import (
    RegisterView,
    MeView,
    ChangePasswordView,
    SignOutEverywhereView,
    CloseAccountView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
)

urlpatterns = [
    path("register/", RegisterView.as_view()),
    path("login/", TokenObtainPairView.as_view()),
    path("refresh/", VersionedTokenRefreshView.as_view()),
    path("me/", MeView.as_view()),
    path("change-password/", ChangePasswordView.as_view()),
    path("sign-out-everywhere/", SignOutEverywhereView.as_view()),
    path("close-account/", CloseAccountView.as_view()),
    path("password-reset/", PasswordResetRequestView.as_view()),
    path("password-reset/confirm/", PasswordResetConfirmView.as_view()),
]
