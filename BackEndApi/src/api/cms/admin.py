"""User models admin."""
from typing import List

# Django
from django.contrib import admin

# Models
from api.cms.models import *


# Admin Site


class CMSAdminSite(admin.AdminSite):
    site_header = "CMS admin"
    site_title = "CMS Admin Portal"
    index_title = "Welcome to The CMS"


post_admin_site = CMSAdminSite(name='cms_admin')


class ContentTextInline(admin.StackedInline):
    model = ContentText
    extra = 0


class ContentLittleRobinStepsInline(admin.StackedInline):
    model = ContentLittleRobinSteps
    extra = 0


class ContentLittleRobinLevelsInline(admin.StackedInline):
    model = ContentLittleRobinLevels
    extra = 0


class ContentImageInline(admin.StackedInline):
    model = ContentImage
    extra = 0


class ContentFileInline(admin.StackedInline):
    model = ContentFile
    extra = 0


class ContentNumberInline(admin.StackedInline):
    model = ContentNumber
    extra = 0


class ContentObjectInline(admin.StackedInline):
    model = ContentObject
    extra = 0


# Model Admin

class PlatformUserReviewAdmin(admin.ModelAdmin):
    list_display = ['id', 'opinion', 'user_name', 'picture']


class FooterItemAdmin(admin.ModelAdmin):
    list_display = ['id', 'text', 'redirection', 'section']


class FooterSectionAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'title']


class SocialMediaAdmin(admin.ModelAdmin):
    list_display = ['id', 'social_media_name', 'icon']


class SocialMediaAccountAdmin(admin.ModelAdmin):
    list_display = ['id', 'account_name', 'social_media']


class ContentPlatformBenefitAdmin(admin.ModelAdmin):
    list_display = ['id', 'image', 'description']


class ContentProjectBenefitAdmin(admin.ModelAdmin):
    list_display = ['id', 'image', 'title', 'description']


class ContentLittleRobinLevelsAdmin(admin.ModelAdmin):
    list_display = ['id', 'target_title', 'profit_percent', 'target_amount']


class ContentRecommendationOptionsAdmin(admin.ModelAdmin):
    list_display = ['id', 'extra_info', 'name', 'text']


class ContentLittleRobinStepsAdmin(admin.ModelAdmin):
    list_display = ['id', 'text', 'picture']


class ContentPaymentsMethodsAdmin(admin.ModelAdmin):
    list_display = ['id', 'type']


class ContentInvestorAdmin(admin.ModelAdmin):
    list_display = ['id', 'opinion', 'investor_name', 'picture']


class ContentGroupAdmin(admin.ModelAdmin):
    inlines = [
        ContentTextInline, ContentImageInline, ContentObjectInline, ContentNumberInline, ContentFileInline
    ]
    search_fields = ['^name', '=id']
    list_display = ['id', 'name', ]


class ContentFrequentlyAskedQuestionAdmin(admin.ModelAdmin):
    search_fields = ['^name', '=id']
    list_display = ['id', 'name', 'title', 'description', 'picture']


class ContentTextAdmin(admin.ModelAdmin):
    list_display: List[str] = ['name', 'value', 'description']
    list_filter: List[str] = ['group', ]
    search_fields: List[str] = ['name', ]


admin.site.register(ContentText, ContentTextAdmin)
admin.site.register(ContentFrequentlyAskedQuestion, ContentFrequentlyAskedQuestionAdmin)
admin.site.register(PlatformUserReview, PlatformUserReviewAdmin)
admin.site.register(FooterItem, FooterItemAdmin)
admin.site.register(FooterSection, FooterSectionAdmin)
admin.site.register(SocialMedia, SocialMediaAdmin)
admin.site.register(SocialMediaAccount, SocialMediaAccountAdmin)
admin.site.register(ContentPlatformBenefit, ContentPlatformBenefitAdmin)
admin.site.register(ContentProjectBenefit, ContentProjectBenefitAdmin)
admin.site.register(ContentInvestor, ContentInvestorAdmin)
admin.site.register(ContentGroup, ContentGroupAdmin)
admin.site.register(ContentLittleRobinLevels, ContentLittleRobinLevelsAdmin)
admin.site.register(ContentRecommendationOptions, ContentRecommendationOptionsAdmin)
admin.site.register(ContentLittleRobinSteps, ContentLittleRobinStepsAdmin)
admin.site.register(ContentPaymentsMethods, ContentPaymentsMethodsAdmin)
post_admin_site.register(ContentGroup, ContentGroupAdmin)
