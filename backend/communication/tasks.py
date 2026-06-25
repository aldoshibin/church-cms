"""
Communication tasks - email and SMS sending
"""
import logging
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


def send_email(to_email, subject, html_body, text_body=None):
    """Send email using Django mail backend"""
    try:
        send_mail(
            subject=subject,
            message=text_body or html_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[to_email],
            html_message=html_body,
            fail_silently=False,
        )
        logger.info(f"Email sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Email send failed to {to_email}: {e}")
        return False


def send_sms(phone_number, message):
    """Send SMS using Twilio"""
    try:
        from twilio.rest import Client
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        msg = client.messages.create(
            body=message,
            from_=settings.TWILIO_PHONE_NUMBER,
            to=phone_number
        )
        logger.info(f"SMS sent to {phone_number}: {msg.sid}")
        return True
    except Exception as e:
        logger.error(f"SMS send failed to {phone_number}: {e}")
        return False


def send_donation_receipt(donation_id):
    """Send donation receipt email"""
    from finance.models import Donation
    try:
        donation = Donation.objects.get(id=donation_id)
        if not (donation.member and donation.member.email):
            return False

        subject = f"Donation Receipt - {settings.CHURCH_NAME}"
        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>{settings.CHURCH_NAME}</h2>
          <h3>Donation Receipt</h3>
          <p>Dear {donation.member.full_name},</p>
          <p>Thank you for your generous contribution.</p>
          <table style="width:100%; border-collapse:collapse;">
            <tr><td><strong>Amount:</strong></td><td>{settings.CHURCH_CURRENCY}{donation.amount}</td></tr>
            <tr><td><strong>Date:</strong></td><td>{donation.date}</td></tr>
            <tr><td><strong>Fund:</strong></td><td>{donation.fund.name if donation.fund else 'General'}</td></tr>
            <tr><td><strong>Payment Method:</strong></td><td>{donation.get_payment_method_display()}</td></tr>
          </table>
          <p>God bless you!</p>
          <p><em>{settings.CHURCH_NAME} Team</em></p>
        </div>
        """
        return send_email(donation.member.email, subject, html_body)
    except Exception as e:
        logger.error(f"Donation receipt failed: {e}")
        return False


def send_bulk_message(message_id):
    """Send bulk email/SMS to recipients"""
    from communication.models import Message, MessageLog
    from members.models import Member

    try:
        message = Message.objects.get(id=message_id)
        recipients = get_recipients(message.recipient_group)
        sent_count = 0

        for member in recipients:
            if message.message_type in ['email', 'both'] and member.email:
                success = send_email(member.email, message.subject, message.body)
                MessageLog.objects.create(
                    message=message,
                    recipient_email=member.email,
                    channel='email',
                    status='sent' if success else 'failed'
                )
                if success:
                    sent_count += 1

            if message.message_type in ['sms', 'both'] and member.phone:
                success = send_sms(member.phone, message.body[:160])
                MessageLog.objects.create(
                    message=message,
                    recipient_phone=member.phone,
                    channel='sms',
                    status='sent' if success else 'failed'
                )
                if success:
                    sent_count += 1

        from django.utils import timezone
        message.status = 'sent'
        message.sent_at = timezone.now()
        message.recipients_count = sent_count
        message.save()
        return sent_count
    except Exception as e:
        logger.error(f"Bulk message failed: {e}")
        return 0


def get_recipients(recipient_group):
    """Parse recipient group string and return queryset"""
    from members.models import Member
    if not recipient_group or recipient_group == 'all':
        return Member.objects.filter(status='active')
    if recipient_group.startswith('ministry:'):
        ministry_name = recipient_group.split(':', 1)[1]
        return Member.objects.filter(ministry_groups__name=ministry_name, status='active')
    return Member.objects.filter(status='active')
