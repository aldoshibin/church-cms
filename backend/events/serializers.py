from rest_framework import serializers
from .models import Event, Attendance, ServiceType, SpecialEventType


class EventSerializer(serializers.ModelSerializer):
    attendee_count = serializers.SerializerMethodField()

    class Meta:
        model  = Event
        fields = [
            'id', 'title', 'category', 'event_type', 'description',
            'speaker', 'speaker_note',
            'start_datetime', 'end_datetime',
            'location', 'is_recurring', 'recurrence_pattern', 'days_of_week',
            'status', 'max_capacity', 'attendee_count',
            'image', 'created_at',
        ]

    def get_attendee_count(self, obj):
        return obj.attendances.count()

    def validate_days_of_week(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError('days_of_week must be a list.')
        valid_days = {'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'}
        invalid = [d for d in value if d not in valid_days]
        if invalid:
            raise serializers.ValidationError(f'Invalid day(s): {invalid}. Use mon/tue/wed/thu/fri/sat/sun.')
        return value

    def validate(self, attrs):
        # Determine effective values, falling back to the existing instance on update
        category = attrs.get('category', getattr(self.instance, 'category', 'service'))
        event_type = attrs.get('event_type', getattr(self.instance, 'event_type', None))
        is_recurring = attrs.get('is_recurring', getattr(self.instance, 'is_recurring', False))
        start_datetime = attrs.get('start_datetime', getattr(self.instance, 'start_datetime', None))
        days_of_week = attrs.get('days_of_week', getattr(self.instance, 'days_of_week', []))

        # Event type validation against the right lookup table
        if event_type:
            if category == 'service':
                if not ServiceType.objects.filter(key=event_type, is_active=True).exists():
                    raise serializers.ValidationError(
                        {'event_type': f'"{event_type}" is not a valid active Service Type.'}
                    )
            elif category == 'special':
                if not SpecialEventType.objects.filter(key=event_type, is_active=True).exists():
                    raise serializers.ValidationError(
                        {'event_type': f'"{event_type}" is not a valid active Special Event Type.'}
                    )

        # A recurring event must specify at least a start date OR days of week.
        # A one-time (non-recurring) event still requires a start date.
        if not start_datetime and not (is_recurring and days_of_week):
            raise serializers.ValidationError(
                {'start_datetime': 'Provide a start date, or mark this as recurring and select at least one day of the week.'}
            )

        return attrs


class AttendanceSerializer(serializers.ModelSerializer):
    member_name = serializers.SerializerMethodField()

    class Meta:
        model  = Attendance
        fields = ['id', 'event', 'member', 'member_name',
                  'visitor_name', 'visitor_phone', 'checked_in_at', 'notes']

    def get_member_name(self, obj):
        return obj.member.full_name if obj.member else obj.visitor_name


class ServiceTypeSerializer(serializers.ModelSerializer):
    event_count = serializers.SerializerMethodField()

    class Meta:
        model  = ServiceType
        fields = ['id', 'name', 'key', 'is_active', 'event_count', 'created_at']
        read_only_fields = ['key']

    def get_event_count(self, obj):
        return Event.objects.filter(category='service', event_type=obj.key).count()

    def create(self, validated_data):
        from django.utils.text import slugify
        validated_data['key'] = slugify(validated_data['name'])
        return super().create(validated_data)


class SpecialEventTypeSerializer(serializers.ModelSerializer):
    event_count = serializers.SerializerMethodField()

    class Meta:
        model  = SpecialEventType
        fields = ['id', 'name', 'key', 'is_active', 'event_count', 'created_at']
        read_only_fields = ['key']

    def get_event_count(self, obj):
        return Event.objects.filter(category='special', event_type=obj.key).count()

    def create(self, validated_data):
        from django.utils.text import slugify
        validated_data['key'] = slugify(validated_data['name'])
        return super().create(validated_data)
