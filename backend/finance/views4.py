from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta, date
import calendar
import django_filters

from .models import Donation, Pledge, Expense, Fund, FundType, ExpenseCategory, ExpenseApprovalLog
from .serializers import (
    DonationSerializer, PledgeSerializer, ExpenseSerializer, FundSerializer,
    FundTypeSerializer, ExpenseCategorySerializer, ExpenseApprovalLogSerializer,
)


class DonationFilter(django_filters.FilterSet):
    date__gte = django_filters.DateFilter(field_name='date', lookup_expr='gte')
    date__lte = django_filters.DateFilter(field_name='date', lookup_expr='lte')

    class Meta:
        model = Donation
        fields = ['payment_method', 'fund', 'receipt_sent']


class ExpenseFilter(django_filters.FilterSet):
    date__gte = django_filters.DateFilter(field_name='date', lookup_expr='gte')
    date__lte = django_filters.DateFilter(field_name='date', lookup_expr='lte')

    class Meta:
        model = Expense
        fields = ['category', 'status']


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
    filterset_fields = ['fund_type', 'is_active']
    search_fields = ['name', 'description']


class DonationViewSet(viewsets.ModelViewSet):
    queryset = Donation.objects.select_related('member', 'fund').order_by('-date')
    serializer_class = DonationSerializer
    permission_classes = [IsAuthenticated]
    filterset_class = DonationFilter
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
    filterset_class = ExpenseFilter
    search_fields = ['title', 'vendor', 'description']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        expense = self.get_object()
        expense.status = 'approved'
        expense.approved_by = request.user
        expense.approved_at = timezone.now()
        expense.rejected_reason = ''
        expense.save()

        ExpenseApprovalLog.objects.create(
            expense=expense, action='approved',
            performed_by=request.user, reason=request.data.get('reason', ''),
        )
        return Response(ExpenseSerializer(expense).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        reason = request.data.get('reason', '').strip()
        if not reason:
            return Response({'error': 'A reason is required to reject an expense.'}, status=400)

        expense = self.get_object()
        expense.status = 'rejected'
        expense.rejected_reason = reason
        expense.approved_by = request.user
        expense.approved_at = timezone.now()
        expense.save()

        ExpenseApprovalLog.objects.create(
            expense=expense, action='rejected',
            performed_by=request.user, reason=reason,
        )
        return Response(ExpenseSerializer(expense).data)

    @action(detail=True, methods=['post'])
    def revert(self, request, pk=None):
        """Undo a mistaken approval/rejection — sets status back to pending."""
        reason = request.data.get('reason', '').strip()
        expense = self.get_object()

        if expense.status not in ('approved', 'rejected'):
            return Response({'error': 'Only approved or rejected expenses can be reverted.'}, status=400)

        expense.status = 'pending'
        expense.approved_by = None
        expense.approved_at = None
        expense.rejected_reason = ''
        expense.save()

        ExpenseApprovalLog.objects.create(
            expense=expense, action='reverted',
            performed_by=request.user, reason=reason,
        )
        return Response(ExpenseSerializer(expense).data)

    @action(detail=True, methods=['get'])
    def approval_history(self, request, pk=None):
        """Full audit trail for one expense."""
        logs = ExpenseApprovalLog.objects.filter(expense_id=pk).select_related('performed_by').order_by('-timestamp')
        return Response(ExpenseApprovalLogSerializer(logs, many=True).data)

    @action(detail=False, methods=['get'])
    def approval_summary(self, request):
        """Dashboard for the Approval Summary page — pending queue + full log."""
        pending = Expense.objects.filter(status='pending').select_related('created_by').order_by('-created_at')
        recent_logs = ExpenseApprovalLog.objects.select_related('performed_by', 'expense').order_by('-timestamp')[:100]

        pending_data = [{
            'id': e.id, 'title': e.title, 'amount': float(e.amount), 'date': str(e.date),
            'category': e.category,
            'requested_by': e.created_by.full_name if e.created_by else 'Unknown',
            'created_at': e.created_at,
        } for e in pending]

        return Response({
            'pending_count': pending.count(),
            'pending': pending_data,
            'recent_activity': ExpenseApprovalLogSerializer(recent_logs, many=True).data,
        })
