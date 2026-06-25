from django.db import models
from core.models import User


class Message(models.Model):
    TYPE_CHOICES = [('email','Email'),('sms','SMS'),('both','Email & SMS')]
    STATUS_CHOICES = [('draft','Draft'),('sent','Sent'),('failed','Failed'),('scheduled','Scheduled')]

    title = models.CharField(max_length=300)
    message_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='email')
    subject = models.CharField(max_length=300, blank=True)
    body = models.TextField()
    recipient_group = models.CharField(max_length=100, blank=True, help_text='all, role:pastor, ministry:choir, etc.')
    recipients_count = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    scheduled_at = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'messages'
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class MessageLog(models.Model):
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='logs')
    recipient_email = models.EmailField(blank=True)
    recipient_phone = models.CharField(max_length=20, blank=True)
    channel = models.CharField(max_length=10)
    status = models.CharField(max_length=20)
    error = models.TextField(blank=True)
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'message_logs'


class Announcement(models.Model):
    title = models.CharField(max_length=300)
    content = models.TextField()
    is_active = models.BooleanField(default=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'announcements'
        ordering = ['-created_at']
