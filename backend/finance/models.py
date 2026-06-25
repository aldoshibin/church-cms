from django.db import models
from members.models import Member




class FundType(models.Model):
    name      = models.CharField(max_length=100, unique=True)
    key       = models.SlugField(max_length=50, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'fund_types'
        ordering = ['name']

    def __str__(self):
        return self.name


class ExpenseCategory(models.Model):
    name      = models.CharField(max_length=100, unique=True)
    key       = models.SlugField(max_length=50, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'expense_categories'
        ordering = ['name']

    def __str__(self):
        return self.name



class Fund(models.Model):
    # FUND_TYPE_CHOICES = [
    #     ('general',     'General Fund'),
    #     ('building',    'Building Fund'),
    #     ('mission',     'Mission Fund'),
    #     ('benevolence', 'Benevolence Fund'),
    #     ('youth',       'Youth Fund'),
    #     ('worship',     'Worship Fund'),
    #     ('education',   'Education Fund'),
    #     ('emergency',   'Emergency Fund'),
    #     ('other',       'Other'),
    # ]
    # FUND_TYPE_CHOICES = [
    #             ('general',     'General Fund'),
    #             ('building',    'Building Fund'),
    #             ('mission',     'Mission Fund'),
    #             ('benevolence', 'Benevolence Fund'),
    #             ('youth',       'Youth Fund'),
    #             ('worship',     'Worship Fund'),
    #             ('education',   'Education Fund'),
    #             ('emergency',   'Emergency Fund'),
    #             ('other',       'Other'),
    #         ]
    # name = models.CharField(max_length=200)
    # fund_type = models.CharField(max_length=20, choices=FUND_TYPE_CHOICES, default='general')
    name = models.CharField(max_length=200)
    fund_type = models.CharField(max_length=50, default='general')
    description = models.TextField(blank=True)
    target_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    current_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'funds'

    def __str__(self):
        return self.name


class Donation(models.Model):
    METHOD_CHOICES = [('cash','Cash'),('check','Check'),('online','Online'),('bank_transfer','Bank Transfer'),('upi','UPI')]

    member = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, blank=True, related_name='donations')
    fund = models.ForeignKey(Fund, on_delete=models.SET_NULL, null=True, blank=True, related_name='donations')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField()
    payment_method = models.CharField(max_length=20, choices=METHOD_CHOICES, default='cash')
    # transaction_id = models.CharField(max_length=200, blank=True)
    transaction_id = models.CharField(max_length=200, blank=True)
    receipt = models.FileField(upload_to='donation_receipts/', blank=True, null=True)

    notes = models.TextField(blank=True)
    receipt_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True, related_name='recorded_donations')

    class Meta:
        db_table = 'donations'
        ordering = ['-date']

    def __str__(self):
        return f"{self.member} - ₹{self.amount} on {self.date}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.fund:
            total = Donation.objects.filter(fund=self.fund).aggregate(
                total=models.Sum('amount'))['total'] or 0
            Fund.objects.filter(id=self.fund_id).update(current_amount=total)


class Pledge(models.Model):
    STATUS_CHOICES = [('active','Active'),('fulfilled','Fulfilled'),('cancelled','Cancelled')]
    FREQUENCY_CHOICES = [('one_time','One Time'),('weekly','Weekly'),('monthly','Monthly'),('yearly','Yearly')]

    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='pledges')
    fund = models.ForeignKey(Fund, on_delete=models.SET_NULL, null=True, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='monthly')
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pledges'

    def __str__(self):
        return f"{self.member} - ₹{self.amount} {self.frequency}"

    @property
    def total_donated(self):
        return self.member.donations.filter(fund=self.fund).aggregate(
            total=models.Sum('amount'))['total'] or 0


class Expense(models.Model):
    # CATEGORY_CHOICES = [
    #     ('utilities','Utilities'),('salaries','Salaries'),('maintenance','Maintenance'),
    #     ('ministry','Ministry'),('outreach','Outreach'),('equipment','Equipment'),
    #     ('office','Office'),('events','Events'),('other','Other'),
    # ]
    # STATUS_CHOICES = [('pending','Pending'),('approved','Approved'),('rejected','Rejected'),('paid','Paid')]

    # title = models.CharField(max_length=200)
    # category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    STATUS_CHOICES = [('pending','Pending'),('approved','Approved'),('rejected','Rejected'),('paid','Paid')]

    title = models.CharField(max_length=200)
    category = models.CharField(max_length=50)

    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField()
    vendor = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    receipt = models.FileField(upload_to='receipts/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    approved_by = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    rejected_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True, related_name='created_expenses')

    class Meta:
        db_table = 'expenses'
        ordering = ['-date']

    def __str__(self):
        return f"{self.title} - ₹{self.amount}"

class ExpenseApprovalLog(models.Model):
    ACTION_CHOICES = [
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('reverted', 'Reverted to Pending'),
    ]

    expense      = models.ForeignKey(Expense, on_delete=models.CASCADE, related_name='approval_logs')
    action       = models.CharField(max_length=20, choices=ACTION_CHOICES)
    performed_by = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True, related_name='approval_actions')
    reason       = models.TextField(blank=True)
    timestamp    = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'expense_approval_logs'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.expense.title} — {self.action} by {self.performed_by}"