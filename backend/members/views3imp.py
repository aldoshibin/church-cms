from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.contrib.auth import get_user_model
from django.utils.crypto import get_random_string
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from .models import Member, Family, Ministry
from .serializers import (
    MemberListSerializer, MemberDetailSerializer,
    FamilySerializer, MinistrySerializer, MinistryMemberMiniSerializer,
)

User = get_user_model()


def send_family_credentials(family, email, phone, password):
    church = getattr(settings, 'CHURCH_NAME', 'Grace Church')
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    subject = f"Welcome to {church} - Family Portal Access"
    text_body = (
        f"Family ID: {family.family_id}\n"
        f"Email: {email}\n"
        f"Password: {password}\n"
        f"Login: {frontend_url}/login\n\n"
        f"You can login using your Family ID ({family.family_id}) or email."
    )
    html_body = f"""
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:20px;border-radius:12px;">
  <div style="background:#4f46e5;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
    <h1 style="color:white;margin:0;font-size:22px;">{church}</h1>
    <p style="color:#c7d2fe;margin:6px 0 0;font-size:14px;">Family Portal Access</p>
  </div>
  <div style="background:white;padding:28px;border-radius:0 0 8px 8px;border:1px solid #e5e7eb;">
    <h2 style="color:#111827;font-size:18px;margin-top:0;">Welcome, {family.name}!</h2>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;">Your family portal account has been created.</p>
    <div style="background:#f3f4f6;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #4f46e5;">
      <p style="margin:0 0 12px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;">Your Login Credentials</p>
      <p style="margin:6px 0;font-size:15px;color:#111827;"><strong>Family ID:</strong> <span style="background:#4f46e5;color:white;padding:2px 10px;border-radius:20px;font-weight:700;font-size:16px;letter-spacing:1px;">{family.family_id}</span></p>
      <p style="margin:6px 0;font-size:14px;color:#111827;"><strong>Email:</strong> {email}</p>
      <p style="margin:6px 0;font-size:14px;color:#111827;"><strong>Password:</strong> {password}</p>
      <p style="margin:6px 0;font-size:14px;color:#111827;"><strong>Portal:</strong> <a href="{frontend_url}/login">{frontend_url}/login</a></p>
    </div>
    <p style="color:#6b7280;font-size:14px;margin-bottom:0;">God bless you,<br><strong>{church} Team</strong></p>
  </div>
</div>
"""
    try:
        send_mail(
            subject, text_body,
            settings.EMAIL_HOST_USER,
            [email],
            html_message=html_body,
            fail_silently=False
        )
        print(f"[CHURCH CMS] Credentials email sent to {email}")
    except Exception as e:
        print(f"[CHURCH CMS] EMAIL ERROR: {e}")

    if phone and getattr(settings, 'TWILIO_ACCOUNT_SID', ''):
        try:
            from twilio.rest import Client
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            sms = f"{church} Family Portal\nFamily ID: {family.family_id}\nPassword: {password}\nLogin: {frontend_url}/login"
            client.messages.create(body=sms, from_=settings.TWILIO_PHONE_NUMBER, to=phone)
            print(f"[CHURCH CMS] SMS sent to {phone}")
        except Exception as e:
            print(f"[CHURCH CMS] SMS ERROR: {e}")


class MemberViewSet(viewsets.ModelViewSet):
    queryset = Member.objects.select_related('family').prefetch_related('ministry_groups')
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'gender', 'marital_status']
    search_fields = ['first_name', 'last_name', 'email', 'phone']
    ordering_fields = ['last_name', 'first_name', 'created_at', 'membership_date']

    def get_serializer_class(self):
        if self.action == 'list':
            return MemberListSerializer
        return MemberDetailSerializer

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    @action(detail=True, methods=['get'])
    def documents(self, request, pk=None):
        from .models import MemberDocument
        from .serializers import MemberDocumentSerializer
        member = self.get_object()
        docs = MemberDocument.objects.filter(member=member)
        return Response(MemberDocumentSerializer(docs, many=True).data)

    @action(detail=True, methods=['post'])
    def upload_document(self, request, pk=None):
        from .models import MemberDocument
        from .serializers import MemberDocumentSerializer
        import os
        member = self.get_object()
        file = request.FILES.get('file')
        title = request.data.get('title', '')
        doc_type = request.data.get('doc_type', 'other')
        if not file:
            return Response({'error': 'No file provided'}, status=400)
        if not title:
            title = file.name
        allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']
        ext = os.path.splitext(file.name)[1].lower()
        if ext not in allowed:
            return Response({'error': f'File type {ext} not allowed. Use: PDF, JPG, PNG, DOC, DOCX'}, status=400)
        doc = MemberDocument.objects.create(member=member, title=title, doc_type=doc_type, file=file)
        return Response(MemberDocumentSerializer(doc).data, status=201)

    @action(detail=True, methods=['delete'], url_path='delete_document/(?P<doc_id>[0-9]+)')
    def delete_document(self, request, pk=None, doc_id=None):
        from .models import MemberDocument
        try:
            doc = MemberDocument.objects.get(id=doc_id, member_id=pk)
            doc.file.delete(save=False)
            doc.delete()
            return Response({'message': 'Document deleted'})
        except MemberDocument.DoesNotExist:
            return Response({'error': 'Document not found'}, status=404)

    @action(detail=False, methods=['get'])
    def birthdays_this_month(self, request):
        month = timezone.now().month
        members = Member.objects.filter(date_of_birth__month=month, status='active')
        return Response(MemberListSerializer(members, many=True).data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        from django.db.models import Count
        status_counts = Member.objects.values('status').annotate(count=Count('id'))
        gender_counts = Member.objects.values('gender').annotate(count=Count('id'))
        return Response({'by_status': list(status_counts), 'by_gender': list(gender_counts)})


class FamilyViewSet(viewsets.ModelViewSet):
    queryset = Family.objects.prefetch_related('members')
    serializer_class = FamilySerializer
    permission_classes = [IsAuthenticated]
    search_fields = ['name', 'email', 'phone', 'family_id']

    def perform_create(self, serializer):
        family = serializer.save()
        self._create_family_portal_user(family)

    def _create_family_portal_user(self, family):
        if not family.email:
            print(f"[CHURCH CMS] No email for family {family.name} — skipping credentials")
            return
        password = get_random_string(10)
        user, created = User.objects.get_or_create(
            email=family.email,
            defaults={
                'first_name': family.name.split()[0] if family.name else 'Family',
                'last_name': family.name.split()[-1] if len(family.name.split()) > 1 else 'Account',
                'role': 'member',
                'phone': family.phone or '',
            }
        )
        user.set_password(password)
        user.save()
        try:
            family.portal_user = user
            family.save(update_fields=['portal_user'])
        except Exception as e:
            print(f"[CHURCH CMS] Could not link portal_user: {e}")
        print(f"[CHURCH CMS] Sending credentials to {family.email} (user {'created' if created else 'updated'})")
        send_family_credentials(family, family.email, family.phone, password)
        return user

    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        family = self.get_object()
        members = family.members.all()
        return Response(MemberListSerializer(members, many=True).data)

    @action(detail=True, methods=['post'])
    def resend_credentials(self, request, pk=None):
        family = self.get_object()
        if not family.email:
            return Response({'error': 'No email address for this family'}, status=400)
        password = get_random_string(10)
        try:
            user = User.objects.get(email=family.email)
            user.set_password(password)
            user.save()
        except User.DoesNotExist:
            pass
        send_family_credentials(family, family.email, family.phone, password)
        return Response({'message': f'Credentials sent to {family.email}', 'family_id': family.family_id})

    @action(detail=True, methods=['get'])
    def dashboard(self, request, pk=None):
        family = self.get_object()
        members = family.members.all()
        member_ids = list(members.values_list('id', flat=True))

        from finance.models import Donation
        from events.models import Event, Attendance
        from django.db.models import Sum
        from datetime import timedelta
        import calendar

        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        all_donations = Donation.objects.filter(member_id__in=member_ids).order_by('-date')
        monthly_giving = all_donations.filter(date__gte=month_start).aggregate(t=Sum('amount'))['t'] or 0
        total_giving = all_donations.aggregate(t=Sum('amount'))['t'] or 0

        recent_donations = []
        for d in all_donations[:10]:
            recent_donations.append({
                'member': d.member.full_name if d.member else 'Unknown',
                'amount': float(d.amount),
                'date': str(d.date),
                'method': d.payment_method,
                'fund': d.fund.name if d.fund else 'General',
            })

        recent_attendance = Attendance.objects.filter(member_id__in=member_ids).select_related('event', 'member').order_by('-checked_in_at')[:15]
        attendance_data = [{
            'event': a.event.title,
            'date': a.event.start_datetime.strftime('%Y-%m-%d'),
            'member': a.member.full_name if a.member else ''
        } for a in recent_attendance]

        upcoming = Event.objects.filter(start_datetime__gte=now, status='scheduled').order_by('start_datetime')[:6]
        upcoming_data = [{
            'id': e.id, 'title': e.title, 'type': e.event_type,
            'date': e.start_datetime.strftime('%Y-%m-%d'),
            'time': e.start_datetime.strftime('%H:%M'),
            'location': e.location
        } for e in upcoming]

        members_data = [{
            'id': m.id, 'name': m.full_name, 'email': m.email or '',
            'phone': m.phone or '', 'status': m.status,
            'membership_date': str(m.membership_date) if m.membership_date else None,
            'gender': m.gender
        } for m in members]

        trend = []
        for i in range(5, -1, -1):
            d = (now.replace(day=1) - timedelta(days=i * 30)).replace(day=1)
            _, last = calendar.monthrange(d.year, d.month)
            month_end = d.replace(day=last)
            amt = all_donations.filter(date__gte=d.date(), date__lte=month_end.date()).aggregate(t=Sum('amount'))['t'] or 0
            trend.append({'month': d.strftime('%b %y'), 'amount': float(amt)})

        return Response({
            'family': {
                'id': family.id, 'family_id': family.family_id, 'name': family.name,
                'email': family.email, 'phone': family.phone,
                'address': family.address, 'city': family.city,
            },
            'members': members_data,
            'stats': {
                'total_members': len(members_data),
                'monthly_giving': float(monthly_giving),
                'total_giving': float(total_giving),
                'total_donations': all_donations.count(),
                'events_attended': Attendance.objects.filter(member_id__in=member_ids).count(),
            },
            'recent_donations': recent_donations,
            'recent_attendance': attendance_data,
            'upcoming_events': upcoming_data,
            'giving_trend': trend,
        })


class MinistryViewSet(viewsets.ModelViewSet):
    queryset = Ministry.objects.prefetch_related('members')
    serializer_class = MinistrySerializer
    permission_classes = [IsAuthenticated]
    search_fields = ['name']

    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        ministry = self.get_object()
        members = ministry.members.all()
        return Response(MinistryMemberMiniSerializer(members, many=True).data)


@api_view(['POST'])
@permission_classes([AllowAny])
def family_portal_login(request):
    """Login with Family ID (FAM-XXX) or email + password"""
    from rest_framework_simplejwt.tokens import RefreshToken

    identifier = request.data.get('identifier', '').strip()
    password   = request.data.get('password', '').strip()

    if not identifier or not password:
        return Response({'error': 'Family ID / Email and password are required'}, status=400)

    family = None
    if identifier.upper().startswith('FAM-'):
        try:
            family = Family.objects.get(family_id=identifier.upper())
        except Family.DoesNotExist:
            return Response({'error': f'No family found with ID {identifier.upper()}'}, status=400)
    else:
        family = Family.objects.filter(email__iexact=identifier).first()
        if not family:
            return Response({'error': 'No family found with this email address'}, status=400)

    try:
        user = User.objects.get(email=family.email, is_active=True)
    except User.DoesNotExist:
        return Response({'error': 'Portal account not set up. Contact church office.'}, status=400)

    if not user.check_password(password):
        return Response({'error': 'Incorrect password. Check the credentials sent to your email.'}, status=400)

    refresh = RefreshToken.for_user(user)
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'family_id': family.id,
        'family_code': family.family_id,
        'family_name': family.name,
        'user': {'email': user.email, 'full_name': user.full_name}
    })
