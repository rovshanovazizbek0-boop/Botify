import re
from wtforms import ValidationError

def validate_username(form, field):
    """
    Validate username format
    """
    username = field.data
    
    if not re.match(r'^[a-zA-Z0-9_-]+$', username):
        raise ValidationError('Username can only contain letters, numbers, underscores, and hyphens.')
    
    if len(username) < 3:
        raise ValidationError('Username must be at least 3 characters long.')
    
    if len(username) > 20:
        raise ValidationError('Username must be no more than 20 characters long.')

def validate_password_strength(form, field):
    """
    Validate password strength
    """
    password = field.data
    
    if len(password) < 6:
        raise ValidationError('Password must be at least 6 characters long.')
    
    if not re.search(r'[A-Za-z]', password):
        raise ValidationError('Password must contain at least one letter.')
    
    if not re.search(r'\d', password):
        raise ValidationError('Password must contain at least one number.')

def validate_telegram_token_format(form, field):
    """
    Validate Telegram bot token format
    """
    if not field.data:
        return  # Allow empty for optional field
    
    token = field.data.strip()
    
    # Telegram bot token format: 123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghi
    if not re.match(r'^\d{8,10}:[A-Za-z0-9_-]{35}$', token):
        raise ValidationError('Invalid Telegram bot token format.')

def validate_bot_name(form, field):
    """
    Validate bot name
    """
    name = field.data.strip()
    
    if not name:
        raise ValidationError('Bot name is required.')
    
    if len(name) < 2:
        raise ValidationError('Bot name must be at least 2 characters long.')
    
    if len(name) > 50:
        raise ValidationError('Bot name must be no more than 50 characters long.')
    
    # Allow letters, numbers, spaces, and basic punctuation
    if not re.match(r'^[a-zA-Z0-9\s\-_.,!?]+$', name):
        raise ValidationError('Bot name contains invalid characters.')

def validate_knowledge_base_content(form, field):
    """
    Validate knowledge base content
    """
    content = field.data.strip()
    
    if not content:
        raise ValidationError('Content is required.')
    
    if len(content) < 10:
        raise ValidationError('Content must be at least 10 characters long.')
    
    if len(content) > 10000:
        raise ValidationError('Content must be no more than 10,000 characters long.')

def validate_temperature(form, field):
    """
    Validate AI temperature parameter
    """
    if field.data is None:
        return
    
    temperature = field.data
    
    if temperature < 0 or temperature > 2:
        raise ValidationError('Temperature must be between 0 and 2.')

def validate_max_tokens(form, field):
    """
    Validate AI max tokens parameter
    """
    if field.data is None:
        return
    
    max_tokens = field.data
    
    if max_tokens < 1 or max_tokens > 4000:
        raise ValidationError('Max tokens must be between 1 and 4000.')

def validate_html_content(form, field):
    """
    Basic validation for HTML content (prevent dangerous tags)
    """
    if not field.data:
        return
    
    content = field.data.lower()
    
    # List of dangerous HTML tags to prevent
    dangerous_tags = ['<script', '<iframe', '<object', '<embed', '<form', '<input']
    
    for tag in dangerous_tags:
        if tag in content:
            raise ValidationError(f'HTML content contains forbidden tag: {tag}')

def validate_email_format(form, field):
    """
    Enhanced email validation
    """
    email = field.data.lower()
    
    # Basic regex for email validation
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    if not re.match(email_pattern, email):
        raise ValidationError('Invalid email format.')
    
    # Check for common disposable email domains
    disposable_domains = [
        '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
        'mailinator.com', 'throwaway.email'
    ]
    
    domain = email.split('@')[1]
    if domain in disposable_domains:
        raise ValidationError('Disposable email addresses are not allowed.')
