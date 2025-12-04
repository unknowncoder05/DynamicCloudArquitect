"""Terraform app configuration."""
from django.apps import AppConfig


class TerraformAppConfig(AppConfig):
    name = 'api.terraform'
    verbose_name = 'Terraform Infrastructure'

    def ready(self):
        """Import signals when app is ready."""
        pass
