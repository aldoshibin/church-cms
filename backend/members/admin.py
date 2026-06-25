from django.contrib import admin
from .models import Member, Family, Ministry

@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'email', 'status', 'membership_date']
    list_filter = ['status', 'gender']
    search_fields = ['first_name', 'last_name', 'email']

@admin.register(Family)
class FamilyAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone']

@admin.register(Ministry)
class MinistryAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active']

from .models import MemberDocument

@admin.register(MemberDocument)
class MemberDocumentAdmin(admin.ModelAdmin):
    list_display = ['member', 'doc_type', 'title', 'uploaded_at']
    list_filter  = ['doc_type']
