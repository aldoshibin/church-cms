"""
Data migration: seed FundType / ExpenseCategory from the old hardcoded
choices on Fund.fund_type and Expense.category.
"""
from django.db import migrations


FUND_TYPES = [
    ('General Fund',     'general'),
    ('Building Fund',    'building'),
    ('Mission Fund',     'mission'),
    ('Benevolence Fund', 'benevolence'),
    ('Youth Fund',       'youth'),
    ('Worship Fund',     'worship'),
    ('Education Fund',   'education'),
    ('Emergency Fund',   'emergency'),
    ('Other',            'other'),
]

EXPENSE_CATEGORIES = [
    ('Utilities',    'utilities'),
    ('Salaries',     'salaries'),
    ('Maintenance',  'maintenance'),
    ('Ministry',     'ministry'),
    ('Outreach',     'outreach'),
    ('Equipment',    'equipment'),
    ('Office',       'office'),
    ('Events',       'events'),
    ('Other',        'other'),
]


def seed_types(apps, schema_editor):
    FundType = apps.get_model('finance', 'FundType')
    ExpenseCategory = apps.get_model('finance', 'ExpenseCategory')

    for name, key in FUND_TYPES:
        FundType.objects.get_or_create(key=key, defaults={'name': name, 'is_active': True})

    for name, key in EXPENSE_CATEGORIES:
        ExpenseCategory.objects.get_or_create(key=key, defaults={'name': name, 'is_active': True})


def reverse_func(apps, schema_editor):
    FundType = apps.get_model('finance', 'FundType')
    ExpenseCategory = apps.get_model('finance', 'ExpenseCategory')
    FundType.objects.filter(key__in=[k for _, k in FUND_TYPES]).delete()
    ExpenseCategory.objects.filter(key__in=[k for _, k in EXPENSE_CATEGORIES]).delete()


class Migration(migrations.Migration):

    dependencies = [
        # Must run AFTER FundType/ExpenseCategory exist —
        # 0003 is the migration that actually creates them.
        ('finance', '0003_expensecategory_fundtype_donation_receipt_and_more'),
    ]

    operations = [
        migrations.RunPython(seed_types, reverse_func),
    ]
