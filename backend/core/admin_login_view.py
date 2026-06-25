"""
Drop-in admin login view. Add to backend/core/ as admin_login_view.py.

Replaces the previous role-string check with a check against role_fk:
only users with a Role assigned (role_fk is not null) can log in via
the Admin/Staff tab. Members (no role_fk) are rejected here and must
use the Member Login tab instead.

The response includes the user's menu_permissions (and is_super_admin
flag) so the frontend Sidebar can filter immediately after login
without a second API call.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate, get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class AdminLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email    = request.data.get('email', '').strip()
        password = request.data.get('password', '').strip()

        if not email or not password:
            return Response({'detail': 'Email and password are required'}, status=400)

        user = authenticate(request, username=email, password=password)

        if user is None:
            try:
                candidate = User.objects.select_related('role_fk').get(
                    email__iexact=email, is_active=True
                )
                if candidate.check_password(password):
                    user = candidate
            except User.DoesNotExist:
                user = None

        if user is None:
            return Response({'detail': 'Invalid email or password'}, status=400)

        # --- THE FIX: only users with an assigned Role can use Admin login ---
        role = getattr(user, 'role_fk', None)
        if role is None:
            return Response(
                {'detail': 'This login is for admin and staff accounts only. '
                            'Please use the Member Login tab instead.'},
                status=403
            )

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'full_name': getattr(user, 'full_name', f"{user.first_name} {user.last_name}".strip()),
                'phone': getattr(user, 'phone', ''),
                'role_id': role.id,
                'role_name': role.name,
                'is_super_admin': role.is_super_admin,
                'menu_permissions': role.menu_permissions if not role.is_super_admin else role.ALL_MENU_KEYS,
            }
        })
