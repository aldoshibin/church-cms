from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('members', '0007_remove_family_email_remove_family_portal_user'),
    ]

    operations = [
        migrations.AddField(
            model_name='member',
            name='member_id',
            field=models.CharField(
                max_length=20, unique=True, blank=True, null=True,
                db_index=True,
                help_text='Auto-generated member ID e.g. MEM-001',
            ),
        ),
    ]
