"""
Data migration: auto-create a 'Super Admin' role with full access,
and assign it to every existing user whose legacy role is admin/staff.

This REPLACES the earlier 0099_create_super_admin_role.py — that file
ran too early (before the Role model existed) because its dependency
pointed at the wrong migration. Delete 0099_create_super_admin_role.py
and use this one instead, numbered to run AFTER 0100_role_user_role_fk.
"""
from django.db import migrations


ALL_MENU_KEYS = [
    'dashboard', 'members', 'families', 'ministries', 'events',
    'attendance', 'donations', 'pledges', 'expenses',
    'communication', 'documents', 'users', 'reports',
]


def create_super_admin(apps, schema_editor):
    Role = apps.get_model('core', 'Role')
    User = apps.get_model('core', 'User')

    super_admin, created = Role.objects.get_or_create(
        name='Super Admin',
        defaults={
            'description': 'Full access to all modules and settings.',
            'is_super_admin': True,
            'menu_permissions': ALL_MENU_KEYS,
        }
    )

    # Assign to every existing user with the legacy admin/staff role
    User.objects.filter(role__in=['admin', 'staff']).update(role_fk=super_admin)


def reverse_func(apps, schema_editor):
    Role = apps.get_model('core', 'Role')
    Role.objects.filter(name='Super Admin').delete()


class Migration(migrations.Migration):

    dependencies = [
        # Must run AFTER the Role model and role_fk field exist
        ('core', '0100_role_user_role_fk'),
    ]

    operations = [
        migrations.RunPython(create_super_admin, reverse_func),
    ]
