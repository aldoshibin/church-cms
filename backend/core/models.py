from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class Role(models.Model):
    ALL_MENU_KEYS = [
        'dashboard', 'members', 'families', 'ministries', 'events',
        'attendance', 'donations', 'pledges', 'expenses',
        'communication', 'documents', 'users', 'reports',
    ]

    name             = models.CharField(max_length=100, unique=True)
    description      = models.CharField(max_length=255, blank=True)
    is_super_admin   = models.BooleanField(default=False)
    menu_permissions = models.JSONField(default=list, blank=True)
    created_at       = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'roles'
        ordering = ['name']

    def __str__(self):
        return self.name

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('pastor', 'Pastor'),
        ('deacon', 'Deacon'),
        ('treasurer', 'Treasurer'),
        ('secretary', 'Secretary'),
        ('member', 'Member'),
        ('volunteer', 'Volunteer'),
    ]

    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member')
    role_fk = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='users'
    )
    profile_picture = models.ImageField(upload_to='profiles/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(null=True, blank=True)

    can_manage_members = models.BooleanField(default=False)
    can_manage_finance = models.BooleanField(default=False)
    can_manage_events = models.BooleanField(default=False)
    can_send_communications = models.BooleanField(default=False)
    can_view_reports = models.BooleanField(default=False)
    


    objects = UserManager()
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    # def save(self, *args, **kwargs):
    #     if self.role == 'admin':
    #         self.is_staff = True
    #         self.can_manage_members = self.can_manage_finance = True
    #         self.can_manage_events = self.can_send_communications = True
    #         self.can_view_reports = True
    #     elif self.role == 'pastor':
    #         self.can_manage_members = self.can_manage_events = True
    #         self.can_send_communications = self.can_view_reports = True
    #     elif self.role == 'treasurer':
    #         self.can_manage_finance = self.can_view_reports = True
    #     elif self.role == 'secretary':
    #         self.can_manage_members = self.can_manage_events = True
    #         self.can_send_communications = True
    #     super().save(*args, **kwargs)
    def save(self, *args, **kwargs):
        # Sync legacy can_manage_* flags from the new Role system,
        # so any old permission checks elsewhere keep working.
        if self.role_fk:
            if self.role_fk.is_super_admin:
                self.is_staff = True
                self.can_manage_members = True
                self.can_manage_finance = True
                self.can_manage_events = True
                self.can_send_communications = True
                self.can_view_reports = True
            else:
                perms = self.role_fk.menu_permissions or []
                self.is_staff = True
                self.can_manage_members = any(k in perms for k in ('members', 'families'))
                self.can_manage_finance = any(k in perms for k in ('donations', 'pledges', 'expenses'))
                self.can_manage_events = any(k in perms for k in ('events', 'attendance', 'ministries'))
                self.can_send_communications = 'communication' in perms
                self.can_view_reports = 'reports' in perms
        else:
            # No role assigned (e.g. a Member-only account) — no admin flags
            self.is_staff = False
            self.can_manage_members = False
            self.can_manage_finance = False
            self.can_manage_events = False
            self.can_send_communications = False
            self.can_view_reports = False
        super().save(*args, **kwargs)

class AuditLog(models.Model):
    ACTION_CHOICES = [('create','Create'),('update','Update'),('delete','Delete'),('login','Login'),('logout','Logout')]
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=100, blank=True)
    description = models.TextField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_logs'
        ordering = ['-timestamp']
