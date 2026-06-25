from rest_framework import serializers
from .models import Donation, Pledge, Expense, Fund


class FundSerializer(serializers.ModelSerializer):
    progress_percent = serializers.SerializerMethodField()

    class Meta:
        model = Fund
        fields = ['id', 'name', 'fund_type', 'description', 'target_amount', 'current_amount', 'is_active', 'progress_percent', 'created_at']

    def get_progress_percent(self, obj):
        if obj.target_amount and obj.target_amount > 0:
            return round((float(obj.current_amount) / float(obj.target_amount)) * 100, 1)
        return 0


class DonationSerializer(serializers.ModelSerializer):
    member_name = serializers.SerializerMethodField()
    fund_name = serializers.SerializerMethodField()

    class Meta:
        model = Donation
        fields = ['id', 'member', 'member_name', 'fund', 'fund_name', 'amount', 'date',
                  'payment_method', 'transaction_id', 'notes', 'receipt_sent', 'created_at']

    def get_member_name(self, obj):
        return obj.member.full_name if obj.member else 'Anonymous'

    def get_fund_name(self, obj):
        return obj.fund.name if obj.fund else 'General'


class PledgeSerializer(serializers.ModelSerializer):
    member_name = serializers.SerializerMethodField()
    total_donated = serializers.ReadOnlyField()
    fulfillment_percent = serializers.SerializerMethodField()

    class Meta:
        model = Pledge
        fields = ['id', 'member', 'member_name', 'fund', 'amount', 'frequency',
                  'start_date', 'end_date', 'status', 'notes', 'total_donated', 'fulfillment_percent']

    def get_member_name(self, obj):
        return obj.member.full_name

    def get_fulfillment_percent(self, obj):
        if obj.amount > 0:
            return round((float(obj.total_donated) / float(obj.amount)) * 100, 1)
        return 0


class ExpenseSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Expense
        fields = ['id', 'title', 'category', 'amount', 'date', 'vendor', 'description',
                  'receipt', 'status', 'approved_by', 'approved_by_name', 'created_by',
                  'created_by_name', 'created_at']

    def get_created_by_name(self, obj):
        return obj.created_by.full_name if obj.created_by else ''

    def get_approved_by_name(self, obj):
        return obj.approved_by.full_name if obj.approved_by else ''
