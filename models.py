from datetime import datetime, timedelta
from app import db
from flask_login import UserMixin
from sqlalchemy import Text, JSON
import enum

class SubscriptionType(enum.Enum):
    FREE = "free"
    BUSINESS = "business" 
    ENTERPRISE = "enterprise"

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    
    # Subscription fields
    subscription_type = db.Column(db.Enum(SubscriptionType), default=SubscriptionType.FREE)
    subscription_start = db.Column(db.DateTime, default=datetime.utcnow)
    subscription_end = db.Column(db.DateTime, default=lambda: datetime.utcnow() + timedelta(days=14))
    is_trial = db.Column(db.Boolean, default=True)
    
    # User preferences
    language = db.Column(db.String(2), default='en')  # 'en', 'ru', 'uz'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    # Relationships
    bots = db.relationship('Bot', backref='owner', lazy=True, cascade='all, delete-orphan')
    conversations = db.relationship('Conversation', backref='user', lazy=True)
    broadcasts_received = db.relationship('BroadcastLog', backref='user', lazy=True)
    
    def is_subscription_active(self):
        return self.subscription_end > datetime.utcnow()
    
    def days_until_expiry(self):
        if self.subscription_end > datetime.utcnow():
            return (self.subscription_end - datetime.utcnow()).days
        return 0
    
    def can_create_bot(self):
        if not self.is_subscription_active():
            return False
        bot_count = len(self.bots.all())
        if self.subscription_type == SubscriptionType.FREE:
            return bot_count < 1
        elif self.subscription_type == SubscriptionType.BUSINESS:
            return bot_count < 20
        else:  # ENTERPRISE
            return True

class Bot(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(Text)
    avatar_url = db.Column(db.String(255))
    
    # Bot configuration
    telegram_token = db.Column(db.String(255))
    telegram_webhook_url = db.Column(db.String(255))
    is_active = db.Column(db.Boolean, default=True)
    
    # AI configuration
    system_prompt = db.Column(Text, default="You are a helpful assistant.")
    temperature = db.Column(db.Float, default=0.7)
    max_tokens = db.Column(db.Integer, default=1000)
    
    # Owner reference
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    knowledge_base = db.relationship('KnowledgeBase', backref='bot', lazy=True, cascade='all, delete-orphan')
    conversations = db.relationship('Conversation', backref='bot', lazy=True)
    analytics = db.relationship('Analytics', backref='bot', lazy=True)

class KnowledgeBase(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(Text, nullable=False)
    file_type = db.Column(db.String(50))  # 'text', 'pdf', 'url', etc.
    
    # Bot reference
    bot_id = db.Column(db.Integer, db.ForeignKey('bot.id'), nullable=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Conversation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    telegram_chat_id = db.Column(db.String(100))
    telegram_user_id = db.Column(db.String(100))
    
    # References
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    bot_id = db.Column(db.Integer, db.ForeignKey('bot.id'), nullable=False)
    
    # Timestamps
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_message_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    messages = db.relationship('Message', backref='conversation', lazy=True, cascade='all, delete-orphan')

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(Text, nullable=False)
    is_from_user = db.Column(db.Boolean, nullable=False)  # True if from user, False if from bot
    telegram_message_id = db.Column(db.String(100))
    
    # Conversation reference
    conversation_id = db.Column(db.Integer, db.ForeignKey('conversation.id'), nullable=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Analytics(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, default=datetime.utcnow().date)
    
    # Metrics
    messages_sent = db.Column(db.Integer, default=0)
    messages_received = db.Column(db.Integer, default=0)
    unique_users = db.Column(db.Integer, default=0)
    active_conversations = db.Column(db.Integer, default=0)
    
    # Bot reference
    bot_id = db.Column(db.Integer, db.ForeignKey('bot.id'), nullable=False)

class Broadcast(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(Text, nullable=False)
    html_content = db.Column(Text)  # HTML formatted content
    
    # Targeting
    target_subscription = db.Column(db.Enum(SubscriptionType), default=SubscriptionType.FREE)
    
    # Status
    is_sent = db.Column(db.Boolean, default=False)
    scheduled_at = db.Column(db.DateTime)
    sent_at = db.Column(db.DateTime)
    
    # Admin who created it
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    logs = db.relationship('BroadcastLog', backref='broadcast', lazy=True)

class BroadcastLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    
    # References
    broadcast_id = db.Column(db.Integer, db.ForeignKey('broadcast.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Status
    is_delivered = db.Column(db.Boolean, default=False)
    delivery_error = db.Column(Text)
    delivered_at = db.Column(db.DateTime)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
