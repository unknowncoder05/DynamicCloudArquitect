# Django
from django.db import models
# README:
# when adding a new content type
# follow the steps
# 1. define the model in this app
# 2. register it in the CONTENT_MODELS list
# 3. define a model serializer
# 4. register the serializer in the CONTENT_MODELS_SERIALIZERS list
from djmoney.models.fields import MoneyField

from api.cms.status import PaymentsMethodsType


class ContentModel:
    def clean(self, *args, **kwargs):
        for model in CONTENT_MODELS:
            model.objects.filter(name=self.name)
        super().clean(*args, **kwargs)

    def __str__(self) -> str:
        return f'{self.name}'


class ContentGroup(ContentModel, models.Model):
    name = models.CharField(max_length=255, unique=True)


class ContentText(ContentModel, models.Model):
    """
    Content model
    """
    # name unique
    name = models.CharField(max_length=255, unique=True)
    value = models.TextField(null=True, blank=True)
    description = models.CharField(max_length=512, null=True, blank=True)
    group = models.ForeignKey(
        ContentGroup, related_name='texts', on_delete=models.CASCADE)

    def get_traduction(self, language):
        attr_name = f'content_text_{language}'
        if hasattr(self, attr_name):
            return self.content_text
        traduction = getattr(self, attr_name)
        return traduction


class ContentImage(ContentModel, models.Model):
    name = models.CharField(max_length=255, unique=True)
    value = models.ImageField(null=True, blank=True,
                              upload_to='content/%Y/%m/%d/')
    description = models.CharField(max_length=512, null=True, blank=True)
    group = models.ForeignKey(
        ContentGroup, related_name='images', on_delete=models.CASCADE, null=True, blank=True)


class ContentFile(ContentModel, models.Model):
    name = models.CharField(max_length=255, unique=True)
    value = models.FileField(null=True, blank=True, upload_to='content/%Y/%m/%d/')
    description = models.CharField(max_length=512, null=True, blank=True)
    group = models.ForeignKey(
        ContentGroup, related_name='files', on_delete=models.CASCADE, null=True, blank=True)


class ContentNumber(ContentModel, models.Model):
    name = models.CharField(max_length=255, unique=True)
    value = models.DecimalField(
        null=True, blank=True, max_digits=19, decimal_places=2)
    description = models.CharField(max_length=512, null=True, blank=True)
    group = models.ForeignKey(
        ContentGroup, related_name='numbers', on_delete=models.CASCADE)


class ContentObject(ContentModel, models.Model):
    name = models.CharField(max_length=255, unique=True)
    value = models.JSONField(null=True, blank=True)
    description = models.CharField(max_length=512, null=True, blank=True)
    group = models.ForeignKey(
        ContentGroup, related_name='objs', on_delete=models.CASCADE)


class ContentPlatformBenefit(ContentModel, models.Model):
    name = models.CharField(max_length=255, unique=True)
    image = models.ImageField(null=True, blank=True,
                              upload_to='content/platform-benefits/%Y/%m/%d/')
    description = models.CharField(max_length=512, null=True, blank=True)
    group = models.ForeignKey(
        ContentGroup, related_name='platform_benefits', on_delete=models.CASCADE)


class ContentProjectBenefit(ContentModel, models.Model):
    name = models.CharField(max_length=255, unique=True)
    image = models.ImageField(null=True, blank=True,
                              upload_to='content/project-benefits/%Y/%m/%d/')
    title = models.CharField(max_length=512, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    group = models.ForeignKey(
        ContentGroup, related_name='project_benefits', on_delete=models.CASCADE)


class ContentInvestor(ContentModel, models.Model):
    name = models.CharField(max_length=255, unique=True)
    opinion = models.CharField(max_length=512, null=True, blank=True)
    investor_name = models.CharField(max_length=512, null=True, blank=True)
    picture = models.ImageField(null=True, blank=True, upload_to='content/investors/%Y/%m/%d/')
    group = models.ForeignKey(ContentGroup, related_name='investors', on_delete=models.CASCADE)


class ContentFrequentlyAskedQuestion(ContentModel, models.Model):
    name = models.CharField(max_length=255, unique=True)
    title = models.TextField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    picture = models.ImageField(null=True, blank=True,
                                upload_to='content/questions/%Y/%m/%d/')
    groups = models.ManyToManyField(
        ContentGroup, related_name='questions')


class PlatformUserReview(ContentModel, models.Model):
    name = models.CharField(max_length=255, unique=True)
    opinion = models.CharField(max_length=512, null=True, blank=True)
    user_name = models.CharField(max_length=512, null=True, blank=True)
    picture = models.ImageField(null=True, blank=True,
                                upload_to='content/platform-users/%Y/%m/%d/')
    group = models.ForeignKey(
        ContentGroup, related_name='platform_user_reviews', on_delete=models.CASCADE)


class FooterSection(ContentModel, models.Model):
    name = models.CharField(max_length=255, unique=True)
    title = models.CharField(max_length=512, null=True, blank=True)
    group = models.ForeignKey(
        ContentGroup, related_name='footer_sections', on_delete=models.CASCADE, null=True)


class FooterItem(models.Model):
    text = models.CharField(max_length=512, null=True, blank=True)
    redirection = models.CharField(max_length=512, null=True, blank=True)
    section = models.ForeignKey(FooterSection, related_name='footer_items', on_delete=models.CASCADE, null=True)


class SocialMedia(models.Model):
    name = models.CharField(max_length=255, unique=True)
    social_media_name = models.CharField(max_length=512, null=True, blank=True)
    icon = models.ImageField(null=True, blank=True, upload_to='content/social-media/%Y/%m/%d/')

    def __str__(self) -> str:
        return self.name


class SocialMediaAccount(ContentModel, models.Model):
    name = models.CharField(max_length=255, unique=True)
    account_name = models.CharField(max_length=512, null=True, blank=True)
    social_media = models.ForeignKey(
        SocialMedia, related_name='social_media_account', on_delete=models.CASCADE)
    groups = models.ManyToManyField(
        ContentGroup, related_name='social_media_account')


class ContentLittleRobinLevels(ContentModel, models.Model):
    name = models.CharField(max_length=255, unique=True)
    target_title = models.CharField(max_length=512, null=True, blank=True)
    profit_percent = models.DecimalField(null=True, blank=True, max_digits=19, decimal_places=2)
    target_amount = MoneyField(max_digits=14, decimal_places=2, default_currency='COP', default=0)
    group = models.ForeignKey(ContentGroup, related_name='little_robin_level', on_delete=models.CASCADE)


class ContentLittleRobinSteps(ContentModel, models.Model):
    name = models.CharField(max_length=255, unique=True)
    text = models.CharField(max_length=512, null=True, blank=True)
    picture = models.ImageField(null=True, blank=True, upload_to='content/robins-steps/%Y/%m/%d/')
    group = models.ForeignKey(ContentGroup, related_name='little_robin_steps', on_delete=models.CASCADE)


class ContentRecommendationOptions(ContentModel, models.Model):
    name = models.CharField(max_length=255, unique=True)
    text = models.CharField(max_length=512, null=True, blank=True)
    extra_info = models.BooleanField(default=False)
    group = models.ForeignKey(ContentGroup, related_name='recommendation_options', on_delete=models.CASCADE)


class ContentPaymentsMethods(ContentModel, models.Model):
    name = models.CharField(max_length=255, unique=True)
    text = models.CharField(max_length=512, null=True, blank=True)
    type = models.CharField(max_length=20, null=True, blank=True, choices=PaymentsMethodsType.choices)
    bank_name = models.CharField(max_length=512, null=True, blank=True)
    account_name = models.CharField(max_length=512, null=True, blank=True)
    nit = models.CharField(max_length=512, null=True, blank=True)
    account_type = models.CharField(max_length=512, null=True, blank=True)
    account_number = models.CharField(max_length=512, null=True, blank=True)
    qr = models.ImageField(null=True, blank=True, upload_to='content/payments_methods_qr/%Y/%m/%d/')
    icon = models.ImageField(null=True, blank=True, upload_to='content/payments_methods/%Y/%m/%d/')
    is_active = models.BooleanField(default=True)
    group = models.ForeignKey(ContentGroup, related_name='payments_methods', on_delete=models.CASCADE)


# CMS CONTENT STEP 1-2: define a model and register it in this list
CONTENT_MODELS = [ContentObject, ContentNumber, ContentImage, ContentText,
                  ContentPlatformBenefit, ContentProjectBenefit, ContentInvestor, ContentFrequentlyAskedQuestion,
                  PlatformUserReview, FooterSection, SocialMediaAccount, ContentLittleRobinSteps, ContentFile,
                  ContentLittleRobinLevels, ContentPaymentsMethods, ContentRecommendationOptions]
