from django.contrib import admin
from .models import Donation, Fund, Pledge, Expense

admin.site.register(Fund)
admin.site.register(Donation)
admin.site.register(Pledge)
admin.site.register(Expense)
