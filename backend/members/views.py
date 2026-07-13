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


def send_member_credentials(member, email, phone, password):
    """Send individual portal login credentials to a member"""
    church = getattr(settings, 'CHURCH_NAME', 'Grace Church')
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    subject = f"Welcome to {church} - Your Member Portal Access"
    text_body = (
        f"Email: {email}\n"
        f"Password: {password}\n"
        f"Login: {frontend_url}/login\n\n"
        f"Use these credentials to view your profile, donations, "
        f"attendance, and the family members linked to your account."
    )
    html_body = f"""
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:20px;border-radius:12px;">
  <div style="background:#4f46e5;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
    <h1 style="color:white;margin:0;font-size:22px;">{church}</h1>
    <p style="color:#c7d2fe;margin:6px 0 0;font-size:14px;">Member Portal Access</p>
  </div>
  <div style="background:white;padding:28px;border-radius:0 0 8px 8px;border:1px solid #e5e7eb;">
    <h2 style="color:#111827;font-size:18px;margin-top:0;">Welcome, {member.full_name}!</h2>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;">
      Your personal member portal account has been created. Log in to view your
      profile, donation history, attendance, and the family members linked to your account.
    </p>
    <div style="background:#f3f4f6;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #4f46e5;">
      <p style="margin:0 0 12px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;">Your Login Credentials</p>
      <p style="margin:6px 0;font-size:14px;color:#111827;"><strong>Email:</strong> {email}</p>
      <p style="margin:6px 0;font-size:14px;color:#111827;"><strong>Password:</strong> {password}</p>
      <p style="margin:6px 0;font-size:14px;color:#111827;"><strong>Portal:</strong> <a href="{frontend_url}/login">{frontend_url}/login</a></p>
    </div>
    <p style="color:#9ca3af;font-size:12px;">Please keep this password safe.</p>
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
            fail_silently=True 
            # insially as false
        )
        print(f"[CHURCH CMS] Member credentials email sent to {email}")
    except Exception as e:
        print(f"[CHURCH CMS] MEMBER EMAIL ERROR: {e}")

    if phone and getattr(settings, 'TWILIO_ACCOUNT_SID', ''):
        try:
            from twilio.rest import Client
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            sms = f"{church} Member Portal\nEmail: {email}\nPassword: {password}\nLogin: {frontend_url}/login"
            client.messages.create(body=sms, from_=settings.TWILIO_PHONE_NUMBER, to=phone)
            print(f"[CHURCH CMS] Member SMS sent to {phone}")
        except Exception as e:
            print(f"[CHURCH CMS] MEMBER SMS ERROR: {e}")


class MemberViewSet(viewsets.ModelViewSet):
    queryset = Member.objects.select_related('family').prefetch_related('ministry_groups')
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'gender', 'marital_status', 'family', 'city', 'state']
    search_fields = ['first_name', 'last_name', 'email', 'phone']
    ordering_fields = ['last_name', 'first_name', 'created_at', 'membership_date']

    @action(detail=False, methods=['get'])
    def locations(self, request):
        """Distinct cities/states currently in use — powers the area filter dropdowns."""
        cities = list(Member.objects.exclude(city='').exclude(city__isnull=True)
                      .values_list('city', flat=True).distinct().order_by('city'))
        states = list(Member.objects.exclude(state='').exclude(state__isnull=True)
                      .values_list('state', flat=True).distinct().order_by('state'))
        return Response({'cities': cities, 'states': states})

    def get_serializer_class(self):
        if self.action == 'list':
            return MemberListSerializer
        return MemberDetailSerializer

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    def perform_create(self, serializer):
        member = serializer.save()
        self._create_member_portal_user(member)

    def _create_member_portal_user(self, member):
        """Auto-create an individual portal login for every new member with an email"""
        if not member.email:
            print(f"[CHURCH CMS] No email for member {member.full_name} — skipping portal credentials")
            return
        password = get_random_string(10)
        user, created = User.objects.get_or_create(
            email=member.email,
            defaults={
                'first_name': member.first_name,
                'last_name': member.last_name,
                'role': 'member',
                'phone': member.phone or '',
            }
        )
        user.set_password(password)
        user.save()
        try:
            member.portal_user = user
            member.save(update_fields=['portal_user'])
        except Exception as e:
            print(f"[CHURCH CMS] Could not link member portal_user: {e}")
        print(f"[CHURCH CMS] Sending member credentials to {member.email} (user {'created' if created else 'updated'})")
        send_member_credentials(member, member.email, member.phone, password)
        return user

    @action(detail=True, methods=['post'])
    def resend_credentials(self, request, pk=None):
        member = self.get_object()
        if not member.email:
            return Response({'error': 'No email address for this member'}, status=400)
        password = get_random_string(10)
        try:
            user = User.objects.get(email=member.email)
            user.set_password(password)
            user.save()
        except User.DoesNotExist:
            user = User.objects.create(
                email=member.email,
                first_name=member.first_name,
                last_name=member.last_name,
                role='member',
                phone=member.phone or '',
            )
            user.set_password(password)
            user.save()
        try:
            member.portal_user = user
            member.save(update_fields=['portal_user'])
        except Exception:
            pass
        send_member_credentials(member, member.email, member.phone, password)
        return Response({'message': f'Credentials sent to {member.email}'})

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

    @action(detail=True, methods=['get'])
    def portal_dashboard(self, request, pk=None):
        """Personal dashboard data for an individual member's own portal login"""
        member = self.get_object()

        from finance.models import Donation
        from events.models import Event, Attendance
        from django.db.models import Sum, Count
        from datetime import timedelta
        import calendar

        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        my_donations = Donation.objects.filter(member=member).order_by('-date')
        monthly_giving = my_donations.filter(date__gte=month_start).aggregate(t=Sum('amount'))['t'] or 0
        total_giving = my_donations.aggregate(t=Sum('amount'))['t'] or 0

        recent_donations = [{
            'amount': float(d.amount), 'date': str(d.date),
            'method': d.payment_method, 'fund': d.fund.name if d.fund else 'General',
        } for d in my_donations[:10]]

        # "Fund Paid" — totals grouped by fund, e.g. "Aldo Fund: ₹5,000"
        fund_totals_qs = (
            my_donations
            .values('fund__id', 'fund__name')
            .annotate(total=Sum('amount'), count=Count('id'))
            .order_by('-total')
        )
        fund_totals = [{
            'fund_id': row['fund__id'],
            'fund_name': row['fund__name'] or 'General',
            'total': float(row['total'] or 0),
            'donation_count': row['count'],
        } for row in fund_totals_qs]

        recent_attendance = Attendance.objects.filter(member=member).select_related('event').order_by('-checked_in_at')[:15]
        attendance_data = [{
            'event': a.event.title,
            'date': a.event.start_datetime.strftime('%Y-%m-%d') if a.event.start_datetime else None,
        } for a in recent_attendance]

        upcoming = Event.objects.filter(start_datetime__gte=now, status='scheduled').order_by('start_datetime')[:6]
        upcoming_data = [{
            'id': e.id, 'title': e.title, 'type': e.event_type,
            'date': e.start_datetime.strftime('%Y-%m-%d') if e.start_datetime else None,
            'time': e.start_datetime.strftime('%H:%M') if e.start_datetime else None,
            'days_of_week': e.days_of_week if not e.start_datetime else [],
            'location': e.location
        } for e in upcoming]

        # Family this member belongs to (assigned by admin) — read-only view of who else is in it
        family_data = None
        family_members_data = []
        if member.family:
            fam = member.family
            family_data = {
                'id': fam.id, 'family_id': fam.family_id, 'name': fam.name,
            }
            others = fam.members.exclude(id=member.id)
            family_members_data = [{
                'id': fm.id, 'name': fm.full_name, 'email': fm.email or '',
                'phone': fm.phone or '', 'status': fm.status,
            } for fm in others]

        trend = []
        for i in range(5, -1, -1):
            d = (now.replace(day=1) - timedelta(days=i * 30)).replace(day=1)
            _, last = calendar.monthrange(d.year, d.month)
            month_end = d.replace(day=last)
            amt = my_donations.filter(date__gte=d.date(), date__lte=month_end.date()).aggregate(t=Sum('amount'))['t'] or 0
            trend.append({'month': d.strftime('%b %y'), 'amount': float(amt)})

        return Response({
            'member': {
                'id': member.id, 'name': member.full_name, 'email': member.email,
                'phone': member.phone, 'status': member.status,
                'membership_date': str(member.membership_date) if member.membership_date else None,
                'profile_picture': member.profile_picture.url if member.profile_picture else None,
            },
            'family': family_data,
            'family_members': family_members_data,
            'stats': {
                'monthly_giving': float(monthly_giving),
                'total_giving': float(total_giving),
                'total_donations': my_donations.count(),
                'events_attended': Attendance.objects.filter(member=member).count(),
            },
            'recent_donations': recent_donations,
            'fund_totals': fund_totals,
            'recent_attendance': attendance_data,
            'upcoming_events': upcoming_data,
            'giving_trend': trend,
        })


class FamilyViewSet(viewsets.ModelViewSet):
    """Admin-only family management. No portal login is created for Family —
    individual members each have their own login (see MemberViewSet)."""
    queryset = Family.objects.prefetch_related('members')
    serializer_class = FamilySerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['city', 'state']
    search_fields = ['name', 'phone', 'family_id']

    def get_queryset(self):
        qs = super().get_queryset()
        has_members = self.request.query_params.get('has_members')
        if has_members == 'true':
            qs = qs.filter(members__isnull=False).distinct()
        elif has_members == 'false':
            qs = qs.filter(members__isnull=True)
        return qs

    @action(detail=False, methods=['get'])
    def locations(self, request):
        """Distinct cities/states currently in use — powers the area filter dropdowns."""
        cities = list(Family.objects.exclude(city='').exclude(city__isnull=True)
                      .values_list('city', flat=True).distinct().order_by('city'))
        states = list(Family.objects.exclude(state='').exclude(state__isnull=True)
                      .values_list('state', flat=True).distinct().order_by('state'))
        return Response({'cities': cities, 'states': states})

    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        family = self.get_object()
        members = family.members.all()
        return Response(MemberListSerializer(members, many=True).data)

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
            'date': a.event.start_datetime.strftime('%Y-%m-%d') if a.event.start_datetime else None,
            'member': a.member.full_name if a.member else ''
        } for a in recent_attendance]

        upcoming = Event.objects.filter(start_datetime__gte=now, status='upcoming').order_by('start_datetime')[:6]
        upcoming_data = [{
            'id': e.id, 'title': e.title, 'type': e.event_type,
            'date': e.start_datetime.strftime('%Y-%m-%d') if e.start_datetime else None,
            'time': e.start_datetime.strftime('%H:%M') if e.start_datetime else None,
            'days_of_week': e.days_of_week if not e.start_datetime else [],
            'location': e.location
        } for e in upcoming]

        # members_data = [{
        #     'id': m.id, 'name': m.full_name, 'email': m.email or '',
        #     'phone': m.phone or '', 'status': m.status,
        #     'membership_date': str(m.membership_date) if m.membership_date else None,
        #     'gender': m.gender
        # } for m in members]

        members_data = [{
            'id': m.id, 'name': m.full_name, 'email': m.email or '',
            'phone': m.phone or '', 'status': m.status,
            'membership_date': str(m.membership_date) if m.membership_date else None,
            'gender': m.gender,
            'member_id': m.member_id or '',
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
                'phone': family.phone,
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
def member_portal_login(request):
    """Individual member login with email + password (admin creates the credentials)."""
    from rest_framework_simplejwt.tokens import RefreshToken

    email    = request.data.get('email', '').strip()
    password = request.data.get('password', '').strip()

    if not email or not password:
        return Response({'error': 'Email and password are required'}, status=400)

    try:
        user = User.objects.get(email__iexact=email, is_active=True)
    except User.DoesNotExist:
        return Response({'error': 'No account found with this email'}, status=400)

    if not user.check_password(password):
        return Response({'error': 'Incorrect password'}, status=400)

    member = Member.objects.filter(email__iexact=email).first()
    if not member:
        return Response({'error': 'No member profile linked to this account'}, status=400)

    refresh = RefreshToken.for_user(user)
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'member_id': member.id,
        'member_name': member.full_name,
        'user': {'email': user.email, 'full_name': user.full_name}
    })
