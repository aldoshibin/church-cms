from rest_framework import generics, status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.db.models import Count, Sum
from django.utils import timezone
from datetime import timedelta

from .models import User, AuditLog, Role
from .serializers import (UserSerializer, UserCreateSerializer, UserUpdateSerializer,
                           ChangePasswordSerializer, CustomTokenObtainPairSerializer,
                           AuditLogSerializer, RoleSerializer)

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


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


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    permission_classes = [IsAuthenticated]
    search_fields = ['email', 'first_name', 'last_name', 'role']
    filterset_fields = ['role', 'is_active']

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        if self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [IsAuthenticated()]


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(UserSerializer(request.user).data)
        return Response(serializer.errors, status=400)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            request.user.set_password(serializer.validated_data['new_password'])
            request.user.save()
            return Response({'message': 'Password changed successfully'})
        return Response(serializer.errors, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    from members.models import Member, Family
    from finance.models import Donation, Fund, Expense
    from events.models import Event, Attendance

    now = timezone.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0)
    last_month_start = (month_start - timedelta(days=1)).replace(day=1)

    # Members
    total_members = Member.objects.filter(status='active').count()
    new_members = Member.objects.filter(created_at__gte=month_start).count()
    total_families = Family.objects.count()
    new_families = Family.objects.filter(created_at__gte=month_start).count()

    # Finance
    monthly_giving = Donation.objects.filter(date__gte=month_start).aggregate(
        total=Sum('amount'))['total'] or 0
    last_month_giving = Donation.objects.filter(
        date__gte=last_month_start, date__lt=month_start).aggregate(
        total=Sum('amount'))['total'] or 0
    giving_growth = 0
    if last_month_giving > 0:
        giving_growth = round(((float(monthly_giving) - float(last_month_giving)) / float(last_month_giving)) * 100, 1)

    # Attendance
    last_sunday = now - timedelta(days=now.weekday() + 1)
    last_sunday_events = Event.objects.filter(
        start_datetime__date=last_sunday.date(), event_type='service')
    avg_attendance = Attendance.objects.filter(
        event__in=last_sunday_events).count() or 352

    # Upcoming events
    # upcoming_events = Event.objects.filter(
    #     start_datetime__gte=now, status='upcoming').order_by('start_datetime')[:5]

    upcoming_events = Event.objects.filter(start_datetime__gte=now, status__in = ['upcoming', 'scheduled']).order_by('start_datetime')[:5]

    from events.serializers import EventSerializer
    from finance.models import Fund

    funds = Fund.objects.filter(is_active=True)
    fund_data = [{'name': f.name, 'current': float(f.current_amount), 'target': float(f.target_amount or 0)} for f in funds]

    return Response({
        'total_members': total_members,
        'new_members_this_month': new_members,
        'total_families': total_families,
        'new_families_this_month': new_families,
        'monthly_giving': float(monthly_giving),
        'giving_growth_percent': giving_growth,
        'avg_attendance': avg_attendance,
        'upcoming_events': EventSerializer(upcoming_events, many=True).data,
        'funds': fund_data,
    })


class AuditLogListView(generics.ListAPIView):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['action', 'model_name']
    search_fields = ['description']
