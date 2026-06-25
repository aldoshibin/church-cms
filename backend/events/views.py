from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from .models import Event, Attendance,ServiceType, SpecialEventType
from .serializers import EventSerializer, AttendanceSerializer,ServiceTypeSerializer, SpecialEventTypeSerializer



class EventViewSet(viewsets.ModelViewSet):
    queryset           = Event.objects.all()
    serializer_class   = EventSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['category', 'event_type', 'status']
    search_fields      = ['title', 'location', 'speaker']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        events = Event.objects.filter(
            start_datetime__gte=timezone.now(), status='scheduled'
        ).order_by('start_datetime')[:10]
        return Response(EventSerializer(events, many=True).data)

    @action(detail=True, methods=['post'])
    def mark_completed(self, request, pk=None):
        event = self.get_object()
        event.status = 'completed'
        event.save(update_fields=['status'])
        return Response(EventSerializer(event).data)

    @action(detail=True, methods=['post'])
    def mark_cancelled(self, request, pk=None):
        event = self.get_object()
        event.status = 'cancelled'
        event.save(update_fields=['status'])
        return Response(EventSerializer(event).data)

    @action(detail=True, methods=['post'])
    def reschedule(self, request, pk=None):
        """Reset to scheduled and optionally update date/time"""
        event = self.get_object()
        start = request.data.get('start_datetime')
        end   = request.data.get('end_datetime')
        if start:
            event.start_datetime = start
        if end is not None:
            event.end_datetime = end or None
        event.status = 'scheduled'
        event.save()
        return Response(EventSerializer(event).data)


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset           = Attendance.objects.select_related('event', 'member')
    serializer_class   = AttendanceSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields   = ['event']

    @action(detail=False, methods=['get'])
    def by_event(self, request):
        event_id = request.query_params.get('event_id')
        if not event_id:
            return Response({'error': 'event_id required'}, status=400)
        qs = Attendance.objects.filter(event_id=event_id).select_related('member')
        return Response(AttendanceSerializer(qs, many=True).data)


class ServiceTypeViewSet(viewsets.ModelViewSet):
    queryset = ServiceType.objects.all()
    serializer_class = ServiceTypeSerializer
    permission_classes = [IsAuthenticated]


class SpecialEventTypeViewSet(viewsets.ModelViewSet):
    queryset = SpecialEventType.objects.all()
    serializer_class = SpecialEventTypeSerializer
    permission_classes = [IsAuthenticated]