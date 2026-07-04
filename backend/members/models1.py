from django.db import models
from core.models import User


class Family(models.Model):
    family_id = models.CharField(max_length=20, unique=True, blank=True, db_index=True)
    name = models.CharField(max_length=200)
    head_of_family = models.ForeignKey('Member', on_delete=models.SET_NULL, null=True, blank=True, related_name='family_head')
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    zip_code = models.CharField(max_length=20, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    # email = models.EmailField(blank=True)
    # portal_user = models.OneToOneField('core.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='family_portal')
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.family_id:
            # Auto-increment: FAM-001, FAM-002, FAM-003...
            last = Family.objects.order_by('-id').first()
            if last and last.family_id and last.family_id.startswith('FAM-'):
                try:
                    num = int(last.family_id.split('-')[1]) + 1
                except ValueError:
                    num = Family.objects.count() + 1
            else:
                num = Family.objects.count() + 1
            self.family_id = f'FAM-{num:03d}'
            # Ensure uniqueness
            while Family.objects.filter(family_id=self.family_id).exists():
                num += 1
                self.family_id = f'FAM-{num:03d}'
        super().save(*args, **kwargs)

    class Meta:
        db_table = 'families'
        verbose_name_plural = 'families'

    def __str__(self):
        return self.name


class Member(models.Model):
    STATUS_CHOICES = [('active','Active'),('inactive','Inactive'),('visitor','Visitor'),('transferred','Transferred'),('deceased','Deceased')]
    GENDER_CHOICES = [('M','Male'),('F','Female'),('O','Other')]
    MARITAL_CHOICES = [('single','Single'),('married','Married'),('widowed','Widowed'),('divorced','Divorced')]

    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True)
    family = models.ForeignKey(Family, on_delete=models.SET_NULL, null=True, blank=True, related_name='members')
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    alternate_phone = models.CharField(max_length=20, blank=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    marital_status = models.CharField(max_length=20, choices=MARITAL_CHOICES, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    zip_code = models.CharField(max_length=20, blank=True)
    membership_date = models.DateField(null=True, blank=True)
    baptism_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    # ministry_groups = models.ManyToManyField('Ministry', blank=True)
    ministry_groups = models.ManyToManyField('Ministry', related_name='members', blank=True)
    occupation = models.CharField(max_length=200, blank=True)
    emergency_contact_name = models.CharField(max_length=200, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)
    notes = models.TextField(blank=True)
    profile_picture = models.ImageField(upload_to='members/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    portal_user = models.OneToOneField(
        'core.User', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='member_portal'
    )
    # portal_user added on 18/6

    class Meta:
        db_table = 'members'
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


class MemberDocument(models.Model):
    DOC_TYPE_CHOICES = [
        ('certificate',   'Membership Certificate'),
        ('baptism',       'Baptism Certificate'),
        ('photo',         'Photo / ID'),
        ('transfer',      'Transfer Letter'),
        ('other',         'Other Document'),
    ]
    member      = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='documents')
    doc_type    = models.CharField(max_length=20, choices=DOC_TYPE_CHOICES, default='other')
    title       = models.CharField(max_length=200)
    file        = models.FileField(upload_to='member_documents/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'member_documents'
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.member.full_name} — {self.title}"


class Ministry(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    leader = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, blank=True, related_name='led_ministries')
    meeting_day = models.CharField(max_length=50, blank=True)
    meeting_time = models.TimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ministries'
        verbose_name_plural = 'ministries'

    def __str__(self):
        return self.name

# class Ministry(models.Model):
#     name         = models.CharField(max_length=200)
#     description  = models.TextField(blank=True)
#     leader       = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, blank=True, related_name='led_ministries')
#     members      = models.ManyToManyField(Member, related_name='ministry_groups', blank=True)
#     meeting_day  = models.CharField(max_length=20, blank=True)
#     meeting_time = models.TimeField(null=True, blank=True)
#     is_active    = models.BooleanField(default=True)

#     class Meta:
#         db_table = 'ministries'

#     def __str__(self):
#         return self.name