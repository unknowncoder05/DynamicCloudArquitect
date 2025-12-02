from django.db import models
from django.utils.translation import gettext_lazy as _


class PaymentsMethodsType(models.TextChoices):
    BANK = 'BK', _('BANK')
    PALOMMA = 'PM', _('PALOMMA')
    WOMPI = 'WP', _('WOMPI')
