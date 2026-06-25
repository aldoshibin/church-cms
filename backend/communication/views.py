from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Message, Announcement
from .serializers import MessageSerializer, AnnouncementSerializer
from .tasks import send_bulk_message


class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        message = self.get_object()
        if message.status == 'sent':
            return Response({'error': 'Message already sent'}, status=400)
        count = send_bulk_message(message.id)
        return Response({'message': f'Message sent to {count} recipients'})

    @action(detail=False, methods=['post'])
    def send_quick(self, request):
        """Send a quick message without saving as draft first"""
        serializer = MessageSerializer(data=request.data)
        if serializer.is_valid():
            message = serializer.save(created_by=request.user)
            count = send_bulk_message(message.id)
            return Response({'message': f'Message sent to {count} recipients', 'id': message.id})
        return Response(serializer.errors, status=400)


class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.filter(is_active=True)
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
