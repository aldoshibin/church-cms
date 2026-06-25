"""
Add this content into backend/core/serializers.py
"""
from rest_framework import serializers
from .models import Role


class RoleSerializer(serializers.ModelSerializer):
    user_count = serializers.SerializerMethodField()

    class Meta:
        model  = Role
        fields = ['id', 'name', 'description', 'is_super_admin',
                  'menu_permissions', 'user_count', 'created_at']

    def get_user_count(self, obj):
        return obj.users.count()

    def validate_menu_permissions(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError('menu_permissions must be a list of menu keys.')
        valid_keys = set(Role.ALL_MENU_KEYS)
        invalid = [k for k in value if k not in valid_keys]
        if invalid:
            raise serializers.ValidationError(f'Invalid menu keys: {invalid}')
        return value
