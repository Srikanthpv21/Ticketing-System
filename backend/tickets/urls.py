from rest_framework.routers import DefaultRouter
from .views import TicketViewSet, CommentViewSet

router = DefaultRouter()
router.register("tickets", TicketViewSet, basename="ticket")
router.register("comments", CommentViewSet, basename="comment")

urlpatterns = router.urls
