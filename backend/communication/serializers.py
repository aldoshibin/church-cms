from rest_framework import serializers
from .models import Message, MessageLog, Announcement


class MessageSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'title', 'message_type', 'subject', 'body', 'recipient_group',
                  'recipients_count', 'status', 'scheduled_at', 'sent_at', 'created_by',
                  'created_by_name', 'created_at']

    def get_created_by_name(self, obj):
        return obj.created_by.full_name if obj.created_by else ''


class AnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = '__all__'
