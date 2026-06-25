"""
Add this content into backend/core/views.py
"""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Role
from .serializers import RoleSerializer


class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated]

    def perform_destroy(self, instance):
        if instance.is_super_admin:
            from rest_framework.exceptions import ValidationError
            raise ValidationError('The Super Admin role cannot be deleted.')
        # Any users on this role lose it (role_fk -> NULL via on_delete=SET_NULL
        # already handles this at the DB level once the row is deleted)
        instance.delete()
