from sys import path
from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import TicketViewSet, CommentViewSet
from .views import AdminStatsView

router = DefaultRouter()
router.register("tickets", TicketViewSet, basename="ticket")
router.register("comments", CommentViewSet, basename="comment")

urlpatterns = router.urls
urlpatterns += [
    path("admin/stats/", AdminStatsView.as_view()),
]
