from rest_framework import serializers
from .models import Donation, Pledge, Expense, Fund, FundType, ExpenseCategory, ExpenseApprovalLog


class FundTypeSerializer(serializers.ModelSerializer):
    fund_count = serializers.SerializerMethodField()

    class Meta:
        model  = FundType
        fields = ['id', 'name', 'key', 'is_active', 'fund_count', 'created_at']
        read_only_fields = ['key']

    def get_fund_count(self, obj):
        return Fund.objects.filter(fund_type=obj.key).count()

    def create(self, validated_data):
        from django.utils.text import slugify
        validated_data['key'] = slugify(validated_data['name'])
        return super().create(validated_data)


class ExpenseCategorySerializer(serializers.ModelSerializer):
    expense_count = serializers.SerializerMethodField()

    class Meta:
        model  = ExpenseCategory
        fields = ['id', 'name', 'key', 'is_active', 'expense_count', 'created_at']
        read_only_fields = ['key']

    def get_expense_count(self, obj):
        return Expense.objects.filter(category=obj.key).count()

    def create(self, validated_data):
        from django.utils.text import slugify
        validated_data['key'] = slugify(validated_data['name'])
        return super().create(validated_data)


class FundSerializer(serializers.ModelSerializer):
    progress_percent = serializers.SerializerMethodField()
    fund_type_name    = serializers.SerializerMethodField()

    class Meta:
        model = Fund
        fields = ['id', 'name', 'fund_type', 'fund_type_name', 'description', 'target_amount',
                  'current_amount', 'is_active', 'progress_percent', 'created_at']

    def get_progress_percent(self, obj):
        if obj.target_amount and obj.target_amount > 0:
            return round((float(obj.current_amount) / float(obj.target_amount)) * 100, 1)
        return 0

    def get_fund_type_name(self, obj):
        ft = FundType.objects.filter(key=obj.fund_type).first()
        return ft.name if ft else obj.fund_type

    def validate_fund_type(self, value):
        if value and not FundType.objects.filter(key=value, is_active=True).exists():
            raise serializers.ValidationError(f'"{value}" is not a valid active Fund Type.')
        return value


class DonationSerializer(serializers.ModelSerializer):
    member_name = serializers.SerializerMethodField()
    fund_name = serializers.SerializerMethodField()

    class Meta:
        model = Donation
        fields = ['id', 'member', 'member_name', 'fund', 'fund_name', 'amount', 'date',
                  'payment_method', 'transaction_id', 'receipt', 'notes', 'receipt_sent', 'created_at']

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


class ExpenseApprovalLogSerializer(serializers.ModelSerializer):
    performed_by_name = serializers.SerializerMethodField()
    expense_title = serializers.SerializerMethodField()
    expense_amount = serializers.SerializerMethodField()

    class Meta:
        model  = ExpenseApprovalLog
        fields = ['id', 'expense', 'expense_title', 'expense_amount', 'action',
                  'performed_by', 'performed_by_name', 'reason', 'timestamp']

    def get_performed_by_name(self, obj):
        return obj.performed_by.full_name if obj.performed_by else 'Unknown'

    def get_expense_title(self, obj):
        return obj.expense.title

    def get_expense_amount(self, obj):
        return float(obj.expense.amount)


class ExpenseSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()
    category_name = serializers.SerializerMethodField()

    class Meta:
        model = Expense
        fields = ['id', 'title', 'category', 'category_name', 'amount', 'date', 'vendor', 'description',
                  'receipt', 'status', 'approved_by', 'approved_by_name', 'approved_at',
                  'rejected_reason', 'created_by', 'created_by_name', 'created_at']

    def get_created_by_name(self, obj):
        return obj.created_by.full_name if obj.created_by else ''

    def get_approved_by_name(self, obj):
        return obj.approved_by.full_name if obj.approved_by else ''

    def get_category_name(self, obj):
        cat = ExpenseCategory.objects.filter(key=obj.category).first()
        return cat.name if cat else obj.category

    def validate_category(self, value):
        if value and not ExpenseCategory.objects.filter(key=value, is_active=True).exists():
            raise serializers.ValidationError(f'"{value}" is not a valid active Expense Category.')
        return value
