from django.contrib import admin
from django.urls import path, include
from users.views import CustomLoginView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("auth/login/", CustomLoginView.as_view(), name="login"),
    path("auth/", include("users.urls")),
    path("api/", include("tickets.urls")),
]

