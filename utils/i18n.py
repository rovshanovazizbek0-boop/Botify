from translations.messages import TRANSLATIONS

def get_translations(language='en'):
    """
    Get translations for specified language
    """
    return TRANSLATIONS.get(language, TRANSLATIONS['en'])

def translate(key, language='en', **kwargs):
    """
    Translate a key with optional formatting
    """
    translations = get_translations(language)
    text = translations.get(key, key)
    
    if kwargs:
        try:
            return text.format(**kwargs)
        except (KeyError, ValueError):
            return text
    
    return text

def get_available_languages():
    """
    Get list of available languages
    """
    return list(TRANSLATIONS.keys())

def get_language_name(lang_code):
    """
    Get human-readable language name
    """
    names = {
        'en': 'English',
        'ru': 'Русский',
        'uz': 'O\'zbek'
    }
    return names.get(lang_code, lang_code)
