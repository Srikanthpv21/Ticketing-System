from django.contrib import admin
from django.urls import path, include
from rest_framework.permissions import AllowAny
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from users.views import CustomLoginView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("auth/login/", CustomLoginView.as_view(), name="login"),
    path("auth/", include("users.urls")),
    path("api/", include("tickets.urls")),
    # Interactive API documentation (public, read-only)
    path(
        "api/schema/",
        SpectacularAPIView.as_view(permission_classes=[AllowAny], authentication_classes=[]),
        name="schema",
    ),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(
            url_name="schema", permission_classes=[AllowAny], authentication_classes=[]
        ),
        name="swagger-ui",
    ),
]

