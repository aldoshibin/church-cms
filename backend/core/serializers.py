from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, AuditLog, Role


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


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    role_name = serializers.SerializerMethodField()
    is_super_admin = serializers.SerializerMethodField()
    menu_permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'full_name', 'phone',
                  'role', 'role_fk', 'role_name', 'is_super_admin', 'menu_permissions',
                  'profile_picture', 'is_active', 'date_joined',
                  'can_manage_members', 'can_manage_finance', 'can_manage_events',
                  'can_send_communications', 'can_view_reports']
        read_only_fields = ['date_joined']

    def get_role_name(self, obj):
        return obj.role_fk.name if obj.role_fk else None

    def get_is_super_admin(self, obj):
        return obj.role_fk.is_super_admin if obj.role_fk else False

    def get_menu_permissions(self, obj):
        if not obj.role_fk:
            return []
        if obj.role_fk.is_super_admin:
            return Role.ALL_MENU_KEYS
        return obj.role_fk.menu_permissions


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['email', 'password', 'first_name', 'last_name', 'phone', 'role', 'role_fk']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone', 'role', 'role_fk', 'is_active',
                  'can_manage_members', 'can_manage_finance', 'can_manage_events',
                  'can_send_communications', 'can_view_reports']


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField()
    new_password = serializers.CharField(min_length=6)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect")
        return value


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        # --- Admin/Staff login is restricted to users with a Role assigned ---
        # Members (role_fk is None) must use the Member Login tab instead.
        if self.user.role_fk is None:
            raise serializers.ValidationError(
                'This login is for admin and staff accounts only. '
                'Please use the Member Login tab instead.'
            )

        data['user'] = UserSerializer(self.user).data
        return data


class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = ['id', 'user', 'user_name', 'action', 'model_name', 'object_id',
                  'description', 'ip_address', 'timestamp']

    def get_user_name(self, obj):
        return obj.user.full_name if obj.user else 'System'
