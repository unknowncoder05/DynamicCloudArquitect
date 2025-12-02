from modeltranslation.translator import translator, TranslationOptions
from api.cms.models import ContentText

class ContentTranslationOptions(TranslationOptions):
    fields = ('value',)

translator.register(ContentText, ContentTranslationOptions)
