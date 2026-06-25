"""
Optional demo data seeder — only run manually if you want sample data.
Run: python manage.py seed_demo
"""
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Seed database with demo data (optional)'

    def add_arguments(self, parser):
        parser.add_argument('--yes', action='store_true', help='Confirm seeding without prompt')

    def handle(self, *args, **options):
        if not options['yes']:
            confirm = input('This will add demo data. Continue? (yes/no): ')
            if confirm.lower() != 'yes':
                self.stdout.write('Cancelled.')
                return

        from core.models import User
        self.stdout.write('Creating admin user...')
        admin, created = User.objects.get_or_create(
            email='admin@church.com',
            defaults={'first_name':'Admin','last_name':'User','role':'admin','is_staff':True,'is_superuser':True}
        )
        if created:
            admin.set_password('admin123')
            admin.save()
            self.stdout.write(self.style.SUCCESS('Admin created: admin@church.com / admin123'))
        else:
            self.stdout.write('Admin already exists.')

        self.stdout.write(self.style.SUCCESS('Done. Login with admin@church.com / admin123'))
