import os
from datetime import datetime, timedelta
from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, session
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

from app import db
from models import User, Bot, KnowledgeBase, Conversation, Message, Analytics, Broadcast, BroadcastLog, SubscriptionType
from forms import LoginForm, RegistrationForm, BotCreateForm, KnowledgeBaseForm, BotSettingsForm, ProfileForm, BroadcastForm
from services.ai_service import AIService
from services.telegram_service import TelegramService
from services.broadcast_service import BroadcastService
from utils.helpers import get_user_language, format_date
from utils.i18n import get_translations

# Create blueprints
main_bp = Blueprint('main', __name__)
auth_bp = Blueprint('auth', __name__)
dashboard_bp = Blueprint('dashboard', __name__)
admin_bp = Blueprint('admin', __name__)

# Main routes
@main_bp.route('/')
def index():
    lang = get_user_language()
    translations = get_translations(lang)
    return render_template('index.html', lang=lang, t=translations)

@main_bp.route('/set_language/<language>')
def set_language(language):
    if language in ['en', 'ru', 'uz']:
        session['language'] = language
        if current_user.is_authenticated:
            current_user.language = language
            db.session.commit()
    return redirect(request.referrer or url_for('main.index'))

# Authentication routes
@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard.main'))
    
    form = LoginForm()
    lang = get_user_language()
    translations = get_translations(lang)
    
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if user and check_password_hash(user.password_hash, form.password.data):
            login_user(user, remember=form.remember_me.data)
            user.last_login = datetime.utcnow()
            db.session.commit()
            
            next_page = request.args.get('next')
            if not next_page:
                next_page = url_for('dashboard.main')
            return redirect(next_page)
        else:
            flash('Invalid email or password', 'error')
    
    return render_template('auth/login.html', form=form, lang=lang, t=translations)

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard.main'))
    
    form = RegistrationForm()
    lang = get_user_language()
    translations = get_translations(lang)
    
    if form.validate_on_submit():
        user = User()
        user.username = form.username.data
        user.email = form.email.data
        user.password_hash = generate_password_hash(form.password.data)
        user.language = form.language.data
        db.session.add(user)
        db.session.commit()
        
        flash('Registration successful! You have a 14-day free trial.', 'success')
        login_user(user)
        return redirect(url_for('dashboard.main'))
    
    return render_template('auth/register.html', form=form, lang=lang, t=translations)

@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('main.index'))

# Dashboard routes
@dashboard_bp.route('/')
@login_required
def main():
    lang = get_user_language()
    translations = get_translations(lang)
    
    # Check subscription status
    if not current_user.is_subscription_active():
        flash('Your subscription has expired. Please upgrade to continue using your bots.', 'warning')
    
    bots = current_user.bots
    total_conversations = sum(len(bot.conversations) for bot in bots)
    total_messages = db.session.query(Message).join(Conversation).join(Bot).filter(Bot.user_id == current_user.id).count()
    
    return render_template('dashboard/main.html', 
                         bots=bots, 
                         total_conversations=total_conversations,
                         total_messages=total_messages,
                         lang=lang, 
                         t=translations)

@dashboard_bp.route('/bot/create', methods=['GET', 'POST'])
@login_required
def bot_create():
    lang = get_user_language()
    translations = get_translations(lang)
    
    if not current_user.can_create_bot():
        flash('You have reached the bot limit for your subscription plan.', 'error')
        return redirect(url_for('dashboard.main'))
    
    form = BotCreateForm()
    
    if form.validate_on_submit():
        bot = Bot()
        bot.name = form.name.data
        bot.description = form.description.data
        bot.system_prompt = form.system_prompt.data
        bot.temperature = form.temperature.data
        bot.max_tokens = form.max_tokens.data
        bot.user_id = current_user.id
        db.session.add(bot)
        db.session.commit()
        
        flash('Bot created successfully!', 'success')
        return redirect(url_for('dashboard.bot_settings', bot_id=bot.id))
    
    return render_template('dashboard/bot_create.html', form=form, lang=lang, t=translations)

@dashboard_bp.route('/bot/<int:bot_id>/settings', methods=['GET', 'POST'])
@login_required
def bot_settings(bot_id):
    bot = Bot.query.filter_by(id=bot_id, user_id=current_user.id).first_or_404()
    lang = get_user_language()
    translations = get_translations(lang)
    
    form = BotSettingsForm(obj=bot)
    kb_form = KnowledgeBaseForm()
    
    if form.validate_on_submit() and form.submit.data:
        form.populate_obj(bot)
        bot.updated_at = datetime.utcnow()
        
        # Setup Telegram webhook if token provided
        if bot.telegram_token:
            telegram_service = TelegramService(bot.telegram_token)
            webhook_url = f"{request.host_url}telegram/webhook/{bot.id}"
            if telegram_service.set_webhook(webhook_url):
                bot.telegram_webhook_url = webhook_url
                flash('Telegram webhook configured successfully!', 'success')
            else:
                flash('Failed to configure Telegram webhook. Please check your bot token.', 'error')
        
        db.session.commit()
        flash('Bot settings updated successfully!', 'success')
        return redirect(url_for('dashboard.bot_settings', bot_id=bot.id))
    
    # Debug: Check form submission
    if request.method == 'POST':
        print(f"POST request received. Form data: {request.form}")
        print(f"kb_form.validate_on_submit(): {kb_form.validate_on_submit()}")
        print(f"kb_form.submit.data: {kb_form.submit.data}")
        print(f"kb_form.errors: {kb_form.errors}")
    
    if kb_form.validate_on_submit() and kb_form.submit.data:
        kb = KnowledgeBase()
        kb.title = kb_form.title.data
        kb.content = kb_form.content.data or ""
        kb.bot_id = bot.id
        
        # Handle file upload
        if kb_form.file_upload.data:
            file = kb_form.file_upload.data
            filename = file.filename
            
            # Process different file types
            if filename.lower().endswith('.txt'):
                try:
                    file_content = file.read().decode('utf-8')
                    if kb.content:
                        kb.content = kb.content + "\n\n" + file_content
                    else:
                        kb.content = file_content
                    kb.file_type = 'text'
                except UnicodeDecodeError:
                    flash('Error reading text file. Please ensure it is UTF-8 encoded.', 'error')
                    return redirect(url_for('dashboard.bot_settings', bot_id=bot.id))
            elif filename.lower().endswith('.pdf'):
                # For now, just save the filename and type
                kb.file_type = 'pdf'
                if not kb.content:
                    kb.content = f"PDF file: {filename}"
                flash('PDF file uploaded. Note: PDF text extraction is not yet implemented.', 'warning')
            elif filename.lower().endswith(('.doc', '.docx')):
                # For now, just save the filename and type  
                kb.file_type = 'document'
                if not kb.content:
                    kb.content = f"Document file: {filename}"
                flash('Document uploaded. Note: Document text extraction is not yet implemented.', 'warning')
        else:
            kb.file_type = 'text'
        
        # Ensure we have content
        if not kb.content:
            flash('Please provide either content text or upload a file.', 'error')
            return redirect(url_for('dashboard.bot_settings', bot_id=bot.id))
        
        db.session.add(kb)
        db.session.commit()
        flash('Knowledge base item added successfully!', 'success')
        return redirect(url_for('dashboard.bot_settings', bot_id=bot.id))
    
    return render_template('dashboard/bot_settings.html', 
                         bot=bot, 
                         form=form, 
                         kb_form=kb_form,
                         lang=lang, 
                         t=translations)

@dashboard_bp.route('/bot/<int:bot_id>/analytics')
@login_required
def analytics(bot_id):
    bot = Bot.query.filter_by(id=bot_id, user_id=current_user.id).first_or_404()
    lang = get_user_language()
    translations = get_translations(lang)
    
    # Get analytics data for the last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    analytics_data = Analytics.query.filter(
        Analytics.bot_id == bot.id,
        Analytics.date >= thirty_days_ago.date()
    ).order_by(Analytics.date).all()
    
    conversations = Conversation.query.filter_by(bot_id=bot.id).order_by(Conversation.started_at.desc()).limit(10).all()
    
    return render_template('dashboard/analytics.html', 
                         bot=bot, 
                         analytics_data=analytics_data,
                         conversations=conversations,
                         lang=lang, 
                         t=translations)

@dashboard_bp.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    lang = get_user_language()
    translations = get_translations(lang)
    
    form = ProfileForm(obj=current_user)
    
    if form.validate_on_submit():
        current_user.username = form.username.data
        current_user.email = form.email.data
        current_user.language = form.language.data
        db.session.commit()
        
        flash('Profile updated successfully!', 'success')
        return redirect(url_for('dashboard.profile'))
    
    return render_template('dashboard/profile.html', form=form, lang=lang, t=translations)

# Admin routes
@admin_bp.route('/')
@login_required
def main():
    if not current_user.is_admin:
        flash('Access denied. Admin privileges required.', 'error')
        return redirect(url_for('dashboard.main'))
    
    lang = get_user_language()
    translations = get_translations(lang)
    
    # Get admin statistics
    total_users = User.query.count()
    free_users = User.query.filter_by(subscription_type=SubscriptionType.FREE).count()
    business_users = User.query.filter_by(subscription_type=SubscriptionType.BUSINESS).count()
    enterprise_users = User.query.filter_by(subscription_type=SubscriptionType.ENTERPRISE).count()
    
    total_bots = Bot.query.count()
    active_bots = Bot.query.filter_by(is_active=True).count()
    
    return render_template('admin/analytics.html',
                         total_users=total_users,
                         free_users=free_users,
                         business_users=business_users,
                         enterprise_users=enterprise_users,
                         total_bots=total_bots,
                         active_bots=active_bots,
                         lang=lang,
                         t=translations)

@admin_bp.route('/broadcast', methods=['GET', 'POST'])
@login_required
def broadcast():
    if not current_user.is_admin:
        flash('Access denied. Admin privileges required.', 'error')
        return redirect(url_for('dashboard.main'))
    
    lang = get_user_language()
    translations = get_translations(lang)
    
    form = BroadcastForm()
    
    if form.validate_on_submit():
        broadcast = Broadcast()
        broadcast.title = form.title.data
        broadcast.content = form.content.data
        broadcast.html_content = form.html_content.data
        broadcast.target_subscription = SubscriptionType(form.target_subscription.data)
        broadcast.created_by = current_user.id
        db.session.add(broadcast)
        db.session.commit()
        
        # Send broadcast using service
        broadcast_service = BroadcastService()
        broadcast_service.send_broadcast(broadcast.id)
        
        flash('Broadcast sent successfully!', 'success')
        return redirect(url_for('admin.broadcast'))
    
    # Get recent broadcasts
    broadcasts = Broadcast.query.order_by(Broadcast.created_at.desc()).limit(10).all()
    
    return render_template('admin/broadcast.html', 
                         form=form, 
                         broadcasts=broadcasts,
                         lang=lang, 
                         t=translations)

@admin_bp.route('/users')
@login_required
def users():
    if not current_user.is_admin:
        flash('Access denied. Admin privileges required.', 'error')
        return redirect(url_for('dashboard.main'))
    
    lang = get_user_language()
    translations = get_translations(lang)
    
    page = request.args.get('page', 1, type=int)
    users = User.query.order_by(User.created_at.desc()).paginate(
        page=page, per_page=20, error_out=False)
    
    return render_template('admin/users.html', users=users, lang=lang, t=translations)

# Telegram webhook route
@main_bp.route('/telegram/webhook/<int:bot_id>', methods=['POST'])
def telegram_webhook(bot_id):
    bot = Bot.query.get_or_404(bot_id)
    
    if not bot.is_active or not bot.telegram_token:
        return '', 404
    
    # Get update from Telegram
    update_data = request.get_json()
    
    if 'message' in update_data:
        message = update_data['message']
        chat_id = message['chat']['id']
        user_id = message['from']['id']
        text = message.get('text', '')
        
        # Find or create conversation
        conversation = Conversation.query.filter_by(
            bot_id=bot.id,
            telegram_chat_id=str(chat_id)
        ).first()
        
        if not conversation:
            conversation = Conversation()
            conversation.bot_id = bot.id
            conversation.user_id = bot.user_id
            conversation.telegram_chat_id = str(chat_id)
            conversation.telegram_user_id = str(user_id)
            db.session.add(conversation)
        
        # Save user message
        user_message = Message()
        user_message.content = text
        user_message.is_from_user = True
        user_message.conversation_id = conversation.id
        db.session.add(user_message)
        
        # Generate AI response
        ai_service = AIService()
        context = "\n".join([kb.content for kb in bot.knowledge_base])
        response = ai_service.generate_response(text, context, bot.system_prompt)
        
        # Save bot response
        bot_message = Message()
        bot_message.content = response
        bot_message.is_from_user = False
        bot_message.conversation_id = conversation.id
        db.session.add(bot_message)
        
        # Update conversation timestamp
        conversation.last_message_at = datetime.utcnow()
        db.session.commit()
        
        # Send response back to Telegram
        telegram_service = TelegramService(bot.telegram_token)
        telegram_service.send_message(chat_id, response)
    
    return '', 200
