from rest_framework.pagination import PageNumberPagination


class OptionalPageNumberPagination(PageNumberPagination):
    """Page-number pagination that only applies when the client asks for it.

    ``GET /api/tickets/``                -> plain list (existing clients)
    ``GET /api/tickets/?page=2``         -> {count, next, previous, results}
    ``GET /api/tickets/?page_size=50``   -> page 1 with 50 items (max 100)
    """

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100

    def paginate_queryset(self, queryset, request, view=None):
        params = request.query_params
        if "page" not in params and "page_size" not in params:
            return None
        return super().paginate_queryset(queryset, request, view)
