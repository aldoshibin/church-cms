from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('events', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='speaker',
            field=models.CharField(max_length=200, blank=True),
        ),
        migrations.AddField(
            model_name='event',
            name='speaker_note',
            field=models.CharField(max_length=300, blank=True),
        ),
        migrations.AlterField(
            model_name='event',
            name='status',
            field=models.CharField(
                max_length=20,
                choices=[
                    ('scheduled', 'Scheduled'),
                    ('ongoing', 'Ongoing'),
                    ('completed', 'Completed'),
                    ('cancelled', 'Cancelled'),
                ],
                default='scheduled',
            ),
        ),
    ]
