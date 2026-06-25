"""
Data migration: seed ServiceType / SpecialEventType from the old
hardcoded TYPE_CHOICES, and backfill Event.category based on each
row's existing event_type value.

This REPLACES the earlier 9999_seed_event_types.py — that file ran
too early (before ServiceType/SpecialEventType existed) because
"9999" sorts before "10000" and its dependency didn't explicitly
point at the migration that creates those models. Delete
9999_seed_event_types.py and use this one instead.
"""
from django.db import migrations


SERVICE_TYPES = [
    ('Worship Service', 'service'),
    ('Bible Study',      'bible_study'),
    ('Choir',            'choir'),
    ('Meeting',          'meeting'),
]

SPECIAL_TYPES = [
    ('Fellowship', 'fellowship'),
    ('Outreach',   'outreach'),
    ('Youth',      'youth'),
    ('Other',      'other'),
]

SERVICE_KEYS = {k for _, k in SERVICE_TYPES}
SPECIAL_KEYS = {k for _, k in SPECIAL_TYPES}


def seed_types(apps, schema_editor):
    ServiceType = apps.get_model('events', 'ServiceType')
    SpecialEventType = apps.get_model('events', 'SpecialEventType')
    Event = apps.get_model('events', 'Event')

    for name, key in SERVICE_TYPES:
        ServiceType.objects.get_or_create(key=key, defaults={'name': name, 'is_active': True})

    for name, key in SPECIAL_TYPES:
        SpecialEventType.objects.get_or_create(key=key, defaults={'name': name, 'is_active': True})

    # Backfill category on existing events based on their current event_type
    Event.objects.filter(event_type__in=SERVICE_KEYS).update(category='service')
    Event.objects.filter(event_type__in=SPECIAL_KEYS).update(category='special')


def reverse_func(apps, schema_editor):
    ServiceType = apps.get_model('events', 'ServiceType')
    SpecialEventType = apps.get_model('events', 'SpecialEventType')
    ServiceType.objects.filter(key__in=SERVICE_KEYS).delete()
    SpecialEventType.objects.filter(key__in=SPECIAL_KEYS).delete()


class Migration(migrations.Migration):

    dependencies = [
        # Must run AFTER ServiceType/SpecialEventType/category exist
        ('events', '10000_servicetype_specialeventtype_event_category_and_more'),
    ]

    operations = [
        migrations.RunPython(seed_types, reverse_func),
    ]
