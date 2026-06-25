from django.db import models
from members.models import Member


class Event(models.Model):
    TYPE_CHOICES = [
        ('service',    'Worship Service'),
        ('fellowship', 'Fellowship'),
        ('outreach',   'Outreach'),
        ('meeting',    'Meeting'),
        ('youth',      'Youth'),
        ('choir',      'Choir'),
        ('bible_study','Bible Study'),
        ('other',      'Other'),
    ]
    STATUS_CHOICES = [
        ('scheduled',  'Scheduled'),
        ('ongoing',    'Ongoing'),
        ('completed',  'Completed'),
        ('cancelled',  'Cancelled'),
    ]
    CATEGORY_CHOICES = [
        ('service', 'Church Service'),
        ('special',  'Special Event'),
    ]


    title              = models.CharField(max_length=200)
    event_type         = models.CharField(max_length=20, choices=TYPE_CHOICES, default='service')
    description        = models.TextField(blank=True)
    speaker            = models.CharField(max_length=200, blank=True)   # ← NEW
    speaker_note       = models.CharField(max_length=300, blank=True)   # ← NEW (short bio/role)
    # start_datetime     = models.DateTimeField()
    start_datetime     = models.DateTimeField(null=True, blank=True)
    end_datetime       = models.DateTimeField(null=True, blank=True)
    location           = models.CharField(max_length=300, blank=True)
    is_recurring       = models.BooleanField(default=False)
    recurrence_pattern = models.CharField(max_length=50, blank=True)
    # recurrence_pattern = models.CharField(max_length=50, blank=True)
    days_of_week       = models.JSONField(default=list, blank=True)
    status             = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    max_capacity       = models.IntegerField(null=True, blank=True)
    image              = models.ImageField(upload_to='events/', blank=True, null=True)
    created_by         = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True)
    created_at         = models.DateTimeField(auto_now_add=True)
    category           = models.CharField(max_length=10, choices=CATEGORY_CHOICES, default='service')
    event_type         = models.CharField(max_length=50, default='service')

    class Meta:
        db_table = 'events'
        ordering = ['start_datetime']

    def __str__(self):
        return self.title


class Attendance(models.Model):
    event        = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='attendances')
    member       = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='attendances', null=True, blank=True)
    visitor_name = models.CharField(max_length=200, blank=True)
    visitor_phone= models.CharField(max_length=20, blank=True)
    checked_in_at= models.DateTimeField(auto_now_add=True)
    notes        = models.CharField(max_length=300, blank=True)

    class Meta:
        db_table      = 'attendance'
        unique_together = [['event', 'member']]

    def __str__(self):
        name = self.member.full_name if self.member else self.visitor_name
        return f"{name} @ {self.event.title}"
    
class ServiceType(models.Model):
    """Admin-managed types for Church Services (e.g. Worship Service,
    Bible Study, Choir, Meeting). Shown in the Event Type dropdown on
    the Add/Edit Church Service form."""
    name      = models.CharField(max_length=100, unique=True)
    key       = models.SlugField(max_length=50, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'service_types'
        ordering = ['name']

    def __str__(self):
        return self.name


class SpecialEventType(models.Model):
    """Admin-managed types for Special Events (e.g. Fellowship,
    Outreach, Youth). Shown in the Event Type dropdown on the
    Add/Edit Special Event form."""
    name      = models.CharField(max_length=100, unique=True)
    key       = models.SlugField(max_length=50, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'special_event_types'
        ordering = ['name']

    def __str__(self):
        return self.name

