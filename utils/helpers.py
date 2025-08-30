import os
from datetime import datetime, date
from flask import session, request
from flask_login import current_user

def get_user_language():
    """
    Get user's preferred language
    """
    # Check if user is logged in and has language preference
    if current_user.is_authenticated and current_user.language:
        return current_user.language
    
    # Check session
    if 'language' in session:
        return session['language']
    
    # Check browser language
    accept_lang = request.headers.get('Accept-Language')
    if accept_lang:
        browser_lang = accept_lang.split(',')[0].split('-')[0]
        if browser_lang in ['en', 'ru', 'uz']:
            return browser_lang
    
    # Default to English
    return 'en'

def format_date(date_obj, lang='en'):
    """
    Format date according to language preference
    """
    if not date_obj:
        return ""
    
    if isinstance(date_obj, datetime):
        date_obj = date_obj.date()
    
    formats = {
        'en': '%B %d, %Y',
        'ru': '%d %B %Y г.',
        'uz': '%Y yil %d %B'
    }
    
    try:
        return date_obj.strftime(formats.get(lang, formats['en']))
    except:
        return str(date_obj)

def format_datetime(datetime_obj, lang='en'):
    """
    Format datetime according to language preference
    """
    if not datetime_obj:
        return ""
    
    formats = {
        'en': '%B %d, %Y at %I:%M %p',
        'ru': '%d %B %Y г. в %H:%M',
        'uz': '%Y yil %d %B, %H:%M'
    }
    
    try:
        return datetime_obj.strftime(formats.get(lang, formats['en']))
    except:
        return str(datetime_obj)

def truncate_text(text, max_length=100):
    """
    Truncate text to specified length
    """
    if not text:
        return ""
    
    if len(text) <= max_length:
        return text
    
    return text[:max_length-3] + "..."

def get_subscription_status_text(user, lang='en'):
    """
    Get user subscription status text
    """
    if not user.is_subscription_active():
        texts = {
            'en': 'Expired',
            'ru': 'Истекла',
            'uz': 'Tugagan'
        }
        return texts.get(lang, texts['en'])
    
    days_left = user.days_until_expiry()
    
    if user.is_trial:
        texts = {
            'en': f'Trial ({days_left} days left)',
            'ru': f'Пробный ({days_left} дней осталось)',
            'uz': f'Sinov ({days_left} kun qoldi)'
        }
    else:
        texts = {
            'en': f'{user.subscription_type.value.title()} ({days_left} days left)',
            'ru': f'{user.subscription_type.value.title()} ({days_left} дней осталось)',
            'uz': f'{user.subscription_type.value.title()} ({days_left} kun qoldi)'
        }
    
    return texts.get(lang, texts['en'])

def get_bot_status_text(bot, lang='en'):
    """
    Get bot status text
    """
    if not bot.is_active:
        texts = {
            'en': 'Inactive',
            'ru': 'Неактивен',
            'uz': 'Nofaol'
        }
        return texts.get(lang, texts['en'])
    
    if not bot.telegram_token:
        texts = {
            'en': 'Not configured',
            'ru': 'Не настроен',
            'uz': 'Sozlanmagan'
        }
        return texts.get(lang, texts['en'])
    
    texts = {
        'en': 'Active',
        'ru': 'Активен',
        'uz': 'Faol'
    }
    return texts.get(lang, texts['en'])

def validate_telegram_token(token):
    """
    Basic validation for Telegram bot token format
    """
    if not token:
        return False
    
    # Telegram bot tokens have format: 123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghi
    parts = token.split(':')
    if len(parts) != 2:
        return False
    
    try:
        int(parts[0])  # First part should be numeric
        return len(parts[1]) >= 30  # Second part should be long enough
    except ValueError:
        return False

def get_environment_config():
    """
    Get environment configuration for deployment
    """
    return {
        'DATABASE_URL': os.environ.get('DATABASE_URL', 'sqlite:///botfactory.db'),
        'GEMINI_API_KEY': os.environ.get('GEMINI_API_KEY', 'default-key'),
        'STRIPE_SECRET_KEY': os.environ.get('STRIPE_SECRET_KEY', 'sk_test_default'),
        'SESSION_SECRET': os.environ.get('SESSION_SECRET', 'dev-secret'),
        'ADMIN_EMAIL': os.environ.get('ADMIN_EMAIL', 'admin@botfactory.com'),
        'ADMIN_PASSWORD': os.environ.get('ADMIN_PASSWORD', 'admin123'),
        'DOMAIN_URL': os.environ.get('DOMAIN_URL', 'http://localhost:5000')
    }

def calculate_message_limit(subscription_type):
    """
    Calculate daily message limit based on subscription
    """
    limits = {
        'free': 100,
        'business': -1,  # Unlimited
        'enterprise': -1  # Unlimited
    }
    return limits.get(subscription_type, 100)

def can_send_message(user):
    """
    Check if user can send messages based on subscription and limits
    """
    if not user.is_subscription_active():
        return False
    
    if user.subscription_type.value in ['business', 'enterprise']:
        return True  # Unlimited for paid plans
    
    # For free users, check daily limit
    # This would need to be implemented with daily message tracking
    return True  # Simplified for now
