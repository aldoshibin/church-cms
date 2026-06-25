from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta, date
import calendar

from .models import Donation, Pledge, Expense, Fund, FundType, ExpenseCategory
from .serializers import (
    DonationSerializer, PledgeSerializer, ExpenseSerializer, FundSerializer,
    FundTypeSerializer, ExpenseCategorySerializer,
)


class FundTypeViewSet(viewsets.ModelViewSet):
    queryset = FundType.objects.all()
    serializer_class = FundTypeSerializer
    permission_classes = [IsAuthenticated]


class ExpenseCategoryViewSet(viewsets.ModelViewSet):
    queryset = ExpenseCategory.objects.all()
    serializer_class = ExpenseCategorySerializer
    permission_classes = [IsAuthenticated]


class FundViewSet(viewsets.ModelViewSet):
    queryset = Fund.objects.all()
    serializer_class = FundSerializer
    permission_classes = [IsAuthenticated]


class DonationViewSet(viewsets.ModelViewSet):
    queryset = Donation.objects.select_related('member', 'fund').order_by('-date')
    serializer_class = DonationSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['payment_method', 'fund', 'receipt_sent']
    search_fields = ['member__first_name', 'member__last_name', 'transaction_id']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        now = timezone.now().date()
        month_start = now.replace(day=1)
        year_start = now.replace(month=1, day=1)

        return Response({
            'total_this_month': float(Donation.objects.filter(date__gte=month_start).aggregate(t=Sum('amount'))['t'] or 0),
            'total_this_year': float(Donation.objects.filter(date__gte=year_start).aggregate(t=Sum('amount'))['t'] or 0),
            'total_all_time': float(Donation.objects.aggregate(t=Sum('amount'))['t'] or 0),
            'count_this_month': Donation.objects.filter(date__gte=month_start).count(),
            'by_method': list(Donation.objects.values('payment_method').annotate(total=Sum('amount'), count=Count('id'))),
            'monthly_trend': get_monthly_trend(),
        })

    @action(detail=True, methods=['post'])
    def send_receipt(self, request, pk=None):
        donation = self.get_object()
        if donation.member and donation.member.email:
            from communication.tasks import send_donation_receipt
            send_donation_receipt(donation.id)
            donation.receipt_sent = True
            donation.save()
            return Response({'message': 'Receipt sent successfully'})
        return Response({'error': 'No email address found'}, status=400)


def get_monthly_trend():
    months = []
    now = timezone.now().date()
    for i in range(11, -1, -1):
        d = now.replace(day=1) - timedelta(days=i * 30)
        month_start = d.replace(day=1)
        _, last_day = calendar.monthrange(month_start.year, month_start.month)
        month_end = month_start.replace(day=last_day)
        total = Donation.objects.filter(date__gte=month_start, date__lte=month_end).aggregate(
            t=Sum('amount'))['t'] or 0
        months.append({'month': month_start.strftime('%b %Y'), 'amount': float(total)})
    return months


class PledgeViewSet(viewsets.ModelViewSet):
    queryset = Pledge.objects.select_related('member', 'fund')
    serializer_class = PledgeSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'frequency']
    search_fields = ['member__first_name', 'member__last_name']


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all().order_by('-date')
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['category', 'status']
    search_fields = ['title', 'vendor', 'description']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        expense = self.get_object()
        expense.status = 'approved'
        expense.approved_by = request.user
        expense.save()
        return Response({'message': 'Expense approved'})
