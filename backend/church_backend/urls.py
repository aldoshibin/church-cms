from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from core.views import (CustomTokenObtainPairView, UserViewSet, MeView,
                         ChangePasswordView, dashboard_stats, AuditLogListView)
# from members.views import MemberViewSet, FamilyViewSet, MinistryViewSet, family_portal_login
from members.views import MemberViewSet, FamilyViewSet, MinistryViewSet, member_portal_login
from finance.views import DonationViewSet, PledgeViewSet, ExpenseViewSet, FundViewSet
from events.views import EventViewSet, AttendanceViewSet
from communication.views import MessageViewSet, AnnouncementViewSet
# from members.views import (
#        MemberViewSet, FamilyViewSet, MinistryViewSet,
#        family_portal_login, member_portal_login,
#    )
# from members.views import (
#     MemberViewSet, FamilyViewSet, MinistryViewSet,
#     member_portal_login,
# )
from core.views import (CustomTokenObtainPairView, UserViewSet, MeView,
                            ChangePasswordView, dashboard_stats, AuditLogListView,
                            RoleViewSet)
from events.views import (
       EventViewSet, AttendanceViewSet,
       ServiceTypeViewSet, SpecialEventTypeViewSet,
   )
from finance.views import (
       DonationViewSet, PledgeViewSet, ExpenseViewSet, FundViewSet,
       FundTypeViewSet, ExpenseCategoryViewSet,
   )



router = DefaultRouter()
router.register('users', UserViewSet)
router.register('members', MemberViewSet)
router.register('families', FamilyViewSet)
router.register('ministries', MinistryViewSet)
router.register('funds', FundViewSet)
router.register('donations', DonationViewSet)
router.register('pledges', PledgeViewSet)
router.register('expenses', ExpenseViewSet)
router.register('events', EventViewSet)
router.register('service-types', ServiceTypeViewSet)
router.register('special-event-types', SpecialEventTypeViewSet)
router.register('attendance', AttendanceViewSet)
router.register('messages', MessageViewSet)
router.register('announcements', AnnouncementViewSet)
router.register('roles', RoleViewSet)
router.register('fund-types', FundTypeViewSet)
router.register('expense-categories', ExpenseCategoryViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/me/', MeView.as_view(), name='me'),
    path('api/auth/change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('api/dashboard/', dashboard_stats, name='dashboard'),
    path('api/audit-logs/', AuditLogListView.as_view(), name='audit_logs'),
    # path('api/family-portal/login/', family_portal_login, name='family_portal_login'),
    path('api/', include(router.urls)),
    # path('api/family-portal/login/', family_portal_login, name='family_portal_login'),
    path('api/member-portal/login/', member_portal_login, name='member_portal_login'),
    # path('api/member-portal/login/', member_portal_login, name='member_portal_login'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
