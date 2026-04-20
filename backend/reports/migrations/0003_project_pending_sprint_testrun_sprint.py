from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reports', '0002_project_jenkins_url'),
    ]

    operations = [
        migrations.AddField(
            model_name='project',
            name='pending_sprint',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='testrun',
            name='sprint',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
    ]
