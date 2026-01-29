from rest_framework.permissions import BasePermission

class IsCustomer(BasePermission):
    def has_permission(self, request, view):
        return request.user.groups.filter(name="customer").exists()


class IsAgent(BasePermission):
    def has_permission(self, request, view):
        return request.user.groups.filter(name="agent").exists()


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_superuser
