# User serializers

# Utilities
from django.conf import settings
# Rest Framework
from rest_framework import serializers

# Models
from api.cms.models import *


def validate_language(value):
    if value in [x[0] for x in settings.LANGUAGES]:
        return True
    return False


class ContentTextSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentText
        fields = [
            'name', 'value', 'description'
        ]
        # type string to be returned
        type = 'text'


class ContentImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentImage
        fields = [
            'name', 'value', 'description'
        ]
        # type string to be returned
        type = 'image'


class ContentFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentFile
        fields = [
            'name', 'value', 'description'
        ]
        # type string to be returned
        type = 'image'


class ContentNumberSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentNumber
        fields = [
            'name', 'value', 'description'
        ]
        # type string to be returned
        type = 'number'


class ContentObjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentObject
        fields = [
            'name', 'value', 'description'
        ]
        # type string to be returned
        type = 'object'


class ContentPlatformBenefitSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentPlatformBenefit
        fields = [
            'name', 'image', 'description'
        ]
        # type string to be returned
        type = 'platform_benefit'


class ContentProjectBenefitSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentProjectBenefit
        fields = [
            'name', 'image', 'title', 'description'
        ]
        # type string to be returned
        type = 'project_benefit'


class ContentInvestorSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentInvestor
        fields = [
            'name', 'opinion', 'investor_name', 'picture'
        ]
        # type string to be returned
        type = 'investor'


class ContentFaqSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentFrequentlyAskedQuestion
        fields = [
            'name', 'title', 'description', 'picture'
        ]
        # type string to be returned
        type = 'faq'


class PlatformUserReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformUserReview
        fields = [
            'name', 'opinion', 'user_name', 'picture'
        ]
        # type string to be returned
        type = 'platform_user_review'


class FooterItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = FooterItem
        fields = [
            'text', 'redirection', 'section'
        ]
        # type string to be returned


class FooterSectionSerializer(serializers.ModelSerializer):
    footer_items = FooterItemSerializer(many=True)

    class Meta:
        model = FooterSection
        fields = [
            'name', 'title', 'footer_items'
        ]
        type = 'footer_section'


class SocialMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialMedia
        fields = [
            'name', 'social_media_name', 'icon',
        ]
        # type string to be returned
        type = 'social_media'


class SocialMediaAccountSerializer(serializers.ModelSerializer):
    social_media = SocialMediaSerializer()

    class Meta:
        model = SocialMediaAccount
        fields = [
            'name', 'account_name', 'social_media',
        ]
        # type string to be returned
        type = 'social_media_account'


class ContentLittleRobinStepsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentLittleRobinSteps
        fields = ['name', 'text', 'picture']
        # type string to be returned
        type = 'little_robin_step'


class ContentLittleRobinLevelsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentLittleRobinLevels
        fields = ['name', 'target_title', 'profit_percent', 'target_amount', 'id']
        # type string to be returned
        type = 'little_robin_level'


class ContentRecommendationOptionsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentRecommendationOptions
        fields = ['name', 'extra_info', 'text']
        # type string to be returned
        type = 'recommendation_options'


class ContentPaymentsMethodsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentPaymentsMethods
        fields = ['name', 'text', 'is_active', 'type', 'bank_name', 'account_name', 'nit', 'account_type',
                  'account_number', 'qr', 'icon']
        # type string to be returned
        type = 'payments_methods'


# CMS CONTENT STEP 3-4: define a serializer and register it in this list
CONTENT_MODELS_SERIALIZERS = [
    ContentObjectSerializer, ContentNumberSerializer, ContentImageSerializer, ContentLittleRobinStepsSerializer,
    ContentTextSerializer, ContentPlatformBenefitSerializer, ContentProjectBenefitSerializer,
    ContentInvestorSerializer, ContentFaqSerializer, ContentLittleRobinLevelsSerializer,
    PlatformUserReviewSerializer, FooterSectionSerializer, SocialMediaAccountSerializer,
    ContentPaymentsMethodsSerializer, ContentRecommendationOptionsSerializer, ContentFileSerializer
]


def get_content_model_group_related_name(model):
    for field in model._meta.get_fields():
        if (field.many_to_one or field.many_to_many) and field.remote_field.model == ContentGroup:
            # return since models only have one foreign key to content group
            return field.remote_field.related_name


CONTENT_MODELS_RELATED_NAME_TO_SERIALIZERS = dict()
for serializer in CONTENT_MODELS_SERIALIZERS:
    # link serializers with related name
    related_name = get_content_model_group_related_name(serializer.Meta.model)
    if related_name:
        if related_name in CONTENT_MODELS_RELATED_NAME_TO_SERIALIZERS:
            print(
                f"WARNING: content type {related_name} has two serializers, using {serializer}")
        CONTENT_MODELS_RELATED_NAME_TO_SERIALIZERS[related_name] = serializer

    # validate serializers are well defined
    if not hasattr(serializer.Meta, "type"):
        raise Exception(
            f"CMD: serializer '{serializer.__name__}' has not 'type' field")

# get all content related names
CONTENT_MODELS_RELATED_FIELDS = list()
for model in CONTENT_MODELS:
    related_name = get_content_model_group_related_name(model)
    if related_name not in CONTENT_MODELS_RELATED_NAME_TO_SERIALIZERS:
        raise Exception(f"CMS: content type {related_name} has no serializer")
    if related_name not in CONTENT_MODELS_RELATED_FIELDS:
        CONTENT_MODELS_RELATED_FIELDS.append(related_name)


def get_content_model_related_name_serializer(related_name):
    if related_name in CONTENT_MODELS_RELATED_NAME_TO_SERIALIZERS:
        return CONTENT_MODELS_RELATED_NAME_TO_SERIALIZERS[related_name]
    print(f"ERROR: content type '{related_name}' has no serializer")


class ContentGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentGroup
        fields = [
            'name'
        ]

    def to_representation(self, instance):
        data = dict(content_name=instance.name)

        for related_name in CONTENT_MODELS_RELATED_FIELDS:
            serializer = get_content_model_related_name_serializer(
                related_name)
            if not serializer:
                continue
            contents_repr = serializer(
                getattr(instance, related_name).all(), many=True).data
            for content in contents_repr:
                name = content.get('name', None)
                value = content['value'] if 'value' in content else content
                data[name] = dict(type=serializer.Meta.type,
                                  value=value, name=name)
            # values.update()

        return data
