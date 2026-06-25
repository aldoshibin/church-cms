# from rest_framework import serializers
# from .models import Event, Attendance,ServiceType, SpecialEventType


# class EventSerializer(serializers.ModelSerializer):
#     attendee_count = serializers.SerializerMethodField()

#     class Meta:
#         model  = Event
#         # fields = [
#         #     'id', 'title', 'event_type', 'description',
#         #     'speaker', 'speaker_note',                    # ← NEW
#         #     'start_datetime', 'end_datetime',
#         #     'location', 'is_recurring', 'recurrence_pattern',
#         #     'status', 'max_capacity', 'attendee_count',
#         #     'image', 'created_at',
#         # ]
#         fields = [
#             'id', 'title', 'category', 'event_type', 'description',
#             'speaker', 'speaker_note',
#             'start_datetime', 'end_datetime',
#             'location', 'is_recurring', 'recurrence_pattern',
#             'status', 'max_capacity', 'attendee_count',
#             'image', 'created_at',
#         ]

#     def get_attendee_count(self, obj):
#         return obj.attendances.count()
    
#     from rest_framework import serializers
# from .models import Event, Attendance,ServiceType, SpecialEventType


# class EventSerializer(serializers.ModelSerializer):
#     attendee_count = serializers.SerializerMethodField()

#     class Meta:
#         model  = Event
#         # fields = [
#         #     'id', 'title', 'event_type', 'description',
#         #     'speaker', 'speaker_note',                    # ← NEW
#         #     'start_datetime', 'end_datetime',
#         #     'location', 'is_recurring', 'recurrence_pattern',
#         #     'status', 'max_capacity', 'attendee_count',
#         #     'image', 'created_at',
#         # ]
#         fields = [
#             'id', 'title', 'category', 'event_type', 'description',
#             'speaker', 'speaker_note',
#             'start_datetime', 'end_datetime',
#             'location', 'is_recurring', 'recurrence_pattern',
#             'status', 'max_capacity', 'attendee_count',
#             'image', 'created_at',
#         ]

#     def get_attendee_count(self, obj):
#         return obj.attendances.count()


# class AttendanceSerializer(serializers.ModelSerializer):
#     member_name = serializers.SerializerMethodField()

#     class Meta:
#         model  = Attendance
#         fields = ['id', 'event', 'member', 'member_name',
#                   'visitor_name', 'visitor_phone', 'checked_in_at', 'notes']

#     def get_member_name(self, obj):
#         return obj.member.full_name if obj.member else obj.visitor_name


# class ServiceTypeSerializer(serializers.ModelSerializer):
#     event_count = serializers.SerializerMethodField()

#     class Meta:
#         model  = ServiceType
#         fields = ['id', 'name', 'key', 'is_active', 'event_count', 'created_at']
#         read_only_fields = ['key']  # key is auto-generated from name on create

#     def get_event_count(self, obj):
#         return Event.objects.filter(category='service', event_type=obj.key).count()

#     def create(self, validated_data):
#         from django.utils.text import slugify
#         validated_data['key'] = slugify(validated_data['name'])
#         return super().create(validated_data)


# class SpecialEventTypeSerializer(serializers.ModelSerializer):
#     event_count = serializers.SerializerMethodField()

#     class Meta:
#         model  = SpecialEventType
#         fields = ['id', 'name', 'key', 'is_active', 'event_count', 'created_at']
#         read_only_fields = ['key']

#     def get_event_count(self, obj):
#         return Event.objects.filter(category='special', event_type=obj.key).count()

#     def create(self, validated_data):
#         from django.utils.text import slugify
#         validated_data['key'] = slugify(validated_data['name'])
#         return super().create(validated_data)
    
#     def validate(self, attrs):
#             category = attrs.get('category', getattr(self.instance, 'category', 'service'))
#             event_type = attrs.get('event_type', getattr(self.instance, 'event_type', None))
#             if event_type:
#                 if category == 'service':
#                     if not ServiceType.objects.filter(key=event_type, is_active=True).exists():
#                         raise serializers.ValidationError(
#                             {'event_type': f'"{event_type}" is not a valid active Service Type.'}
#                         )
#                 elif category == 'special':
#                     if not SpecialEventType.objects.filter(key=event_type, is_active=True).exists():
#                         raise serializers.ValidationError(
#                             {'event_type': f'"{event_type}" is not a valid active Special Event Type.'}
#                         )
#             return attrs


# class AttendanceSerializer(serializers.ModelSerializer):
#     member_name = serializers.SerializerMethodField()

#     class Meta:
#         model  = Attendance
#         fields = ['id', 'event', 'member', 'member_name',
#                   'visitor_name', 'visitor_phone', 'checked_in_at', 'notes']

#     def get_member_name(self, obj):
#         return obj.member.full_name if obj.member else obj.visitor_name


# class ServiceTypeSerializer(serializers.ModelSerializer):
#     event_count = serializers.SerializerMethodField()

#     class Meta:
#         model  = ServiceType
#         fields = ['id', 'name', 'key', 'is_active', 'event_count', 'created_at']
#         read_only_fields = ['key']  # key is auto-generated from name on create

#     def get_event_count(self, obj):
#         return Event.objects.filter(category='service', event_type=obj.key).count()

#     def create(self, validated_data):
#         from django.utils.text import slugify
#         validated_data['key'] = slugify(validated_data['name'])
#         return super().create(validated_data)


# class SpecialEventTypeSerializer(serializers.ModelSerializer):
#     event_count = serializers.SerializerMethodField()

#     class Meta:
#         model  = SpecialEventType
#         fields = ['id', 'name', 'key', 'is_active', 'event_count', 'created_at']
#         read_only_fields = ['key']

#     def get_event_count(self, obj):
#         return Event.objects.filter(category='special', event_type=obj.key).count()

#     def create(self, validated_data):
#         from django.utils.text import slugify
#         validated_data['key'] = slugify(validated_data['name'])
#         return super().create(validated_data)
    
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
            'location', 'is_recurring', 'recurrence_pattern',
            'status', 'max_capacity', 'attendee_count',
            'image', 'created_at',
        ]

    def get_attendee_count(self, obj):
        return obj.attendances.count()

    def validate(self, attrs):
        category = attrs.get('category', getattr(self.instance, 'category', 'service'))
        event_type = attrs.get('event_type', getattr(self.instance, 'event_type', None))
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
        read_only_fields = ['key']  # key is auto-generated from name on create

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