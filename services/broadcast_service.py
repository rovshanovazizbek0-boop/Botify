import logging
from datetime import datetime
from typing import List
from models import User, Bot, Broadcast, BroadcastLog, SubscriptionType
from services.telegram_service import TelegramService
from app import db

class BroadcastService:
    def __init__(self):
        pass
    
    def send_broadcast(self, broadcast_id: int) -> dict:
        """
        Send broadcast message to targeted users
        """
        try:
            broadcast = Broadcast.query.get(broadcast_id)
            if not broadcast:
                raise ValueError(f"Broadcast {broadcast_id} not found")
            
            if broadcast.is_sent:
                raise ValueError(f"Broadcast {broadcast_id} already sent")
            
            # Get target users based on subscription type
            target_users = self._get_target_users(broadcast.target_subscription)
            
            results = {
                'total_targeted': len(target_users),
                'successful': 0,
                'failed': 0,
                'errors': []
            }
            
            # Send to each user's bots
            for user in target_users:
                user_result = self._send_to_user_bots(user, broadcast)
                
                # Create broadcast log
                log = BroadcastLog()
                log.broadcast_id = broadcast.id
                log.user_id = user.id
                log.is_delivered = user_result['success']
                log.delivery_error = user_result.get('error')
                log.delivered_at = datetime.utcnow() if user_result['success'] else None
                db.session.add(log)
                
                if user_result['success']:
                    results['successful'] += 1
                else:
                    results['failed'] += 1
                    results['errors'].append(f"User {user.id}: {user_result.get('error')}")
            
            # Mark broadcast as sent
            broadcast.is_sent = True
            broadcast.sent_at = datetime.utcnow()
            
            db.session.commit()
            
            logging.info(f"Broadcast {broadcast_id} sent to {results['successful']}/{results['total_targeted']} users")
            return results
            
        except Exception as e:
            logging.error(f"Broadcast service error: {e}")
            db.session.rollback()
            return {
                'total_targeted': 0,
                'successful': 0,
                'failed': 0,
                'errors': [str(e)]
            }
    
    def _get_target_users(self, target_subscription: SubscriptionType) -> List[User]:
        """
        Get users based on subscription type
        """
        if target_subscription == SubscriptionType.FREE:
            # Target free users and trial users
            return User.query.filter(
                (User.subscription_type == SubscriptionType.FREE) |
                (User.is_trial == True)
            ).all()
        else:
            return User.query.filter_by(subscription_type=target_subscription).all()
    
    def _send_to_user_bots(self, user: User, broadcast: Broadcast) -> dict:
        """
        Send broadcast message to all user's Telegram bots
        """
        try:
            message_sent = False
            errors = []
            
            # Get user's active bots with Telegram integration
            active_bots = Bot.query.filter_by(
                user_id=user.id,
                is_active=True
            ).filter(Bot.telegram_token.isnot(None)).all()
            
            if not active_bots:
                return {'success': False, 'error': 'No active Telegram bots found'}
            
            # Send via the first available bot
            for bot in active_bots:
                try:
                    telegram_service = TelegramService(bot.telegram_token)
                    
                    # Get recent conversations to send message to active users
                    recent_conversations = bot.conversations[-10:]  # Last 10 conversations
                    
                    for conversation in recent_conversations:
                        if conversation.telegram_chat_id:
                            # Use HTML content if available, otherwise plain text
                            message_content = broadcast.html_content or broadcast.content
                            
                            success = telegram_service.send_message(
                                int(conversation.telegram_chat_id),
                                message_content,
                                parse_mode="HTML" if broadcast.html_content else "Markdown"
                            )
                            
                            if success:
                                message_sent = True
                                break  # Success, no need to try other conversations
                    
                    if message_sent:
                        break  # Success with this bot, no need to try others
                        
                except Exception as e:
                    errors.append(f"Bot {bot.id}: {str(e)}")
                    continue
            
            if message_sent:
                return {'success': True}
            else:
                return {'success': False, 'error': f"Failed to send via any bot: {'; '.join(errors)}"}
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def schedule_broadcast(self, broadcast_id: int, scheduled_time: datetime) -> bool:
        """
        Schedule broadcast for later sending
        """
        try:
            broadcast = Broadcast.query.get(broadcast_id)
            if not broadcast:
                return False
            
            broadcast.scheduled_at = scheduled_time
            db.session.commit()
            
            logging.info(f"Broadcast {broadcast_id} scheduled for {scheduled_time}")
            return True
            
        except Exception as e:
            logging.error(f"Broadcast scheduling error: {e}")
            db.session.rollback()
            return False
    
    def get_broadcast_statistics(self, broadcast_id: int) -> dict:
        """
        Get statistics for a specific broadcast
        """
        try:
            broadcast = Broadcast.query.get(broadcast_id)
            if not broadcast:
                return {}
            
            logs = BroadcastLog.query.filter_by(broadcast_id=broadcast_id).all()
            
            total_sent = len(logs)
            delivered = len([log for log in logs if log.is_delivered])
            failed = total_sent - delivered
            
            return {
                'broadcast_id': broadcast_id,
                'title': broadcast.title,
                'total_targeted': total_sent,
                'delivered': delivered,
                'failed': failed,
                'delivery_rate': (delivered / total_sent * 100) if total_sent > 0 else 0,
                'sent_at': broadcast.sent_at,
                'created_at': broadcast.created_at
            }
            
        except Exception as e:
            logging.error(f"Error getting broadcast statistics: {e}")
            return {}
    
    def send_subscription_reminder(self, user: User, reminder_type: str) -> bool:
        """
        Send subscription reminder to user
        """
        try:
            messages = {
                'trial_ending_3_days': {
                    'en': 'Your free trial expires in 3 days. Upgrade to continue using your bots!',
                    'ru': 'Ваш бесплатный период истекает через 3 дня. Обновите подписку, чтобы продолжить использовать ботов!',
                    'uz': 'Sizning bepul sinov muddatingiz 3 kun ichida tugaydi. Botlaringizni ishlatishni davom ettirish uchun obuna oling!'
                },
                'trial_expired': {
                    'en': 'Your free trial has expired. Subscribe to continue using your bots!',
                    'ru': 'Ваш бесплатный период истек. Оформите подписку, чтобы продолжить использовать ботов!',
                    'uz': 'Sizning bepul sinov muddatingiz tugadi. Botlaringizni ishlatishni davom ettirish uchun obuna oling!'
                },
                'subscription_ending_1_day': {
                    'en': 'Your subscription expires tomorrow. Renew to continue service!',
                    'ru': 'Ваша подписка истекает завтра. Продлите для продолжения работы!',
                    'uz': 'Sizning obunangiz ertaga tugaydi. Xizmatni davom ettirish uchun yangilang!'
                },
                'subscription_expired': {
                    'en': 'Your subscription has expired. Your bots have been temporarily disabled.',
                    'ru': 'Ваша подписка истекла. Ваши боты временно отключены.',
                    'uz': 'Sizning obunangiz tugadi. Botlaringiz vaqtincha o\'chirildi.'
                }
            }
            
            if reminder_type not in messages:
                return False
            
            message = messages[reminder_type].get(user.language, messages[reminder_type]['en'])
            
            # Send via user's first active bot
            active_bot = Bot.query.filter_by(
                user_id=user.id,
                is_active=True
            ).filter(Bot.telegram_token.isnot(None)).first()
            
            if not active_bot:
                return False
            
            # Get the most recent conversation
            recent_conversation = active_bot.conversations.order_by(
                active_bot.conversations.c.last_message_at.desc()
            ).first()
            
            if recent_conversation and recent_conversation.telegram_chat_id:
                telegram_service = TelegramService(active_bot.telegram_token)
                return telegram_service.send_message(
                    int(recent_conversation.telegram_chat_id),
                    message
                )
            
            return False
            
        except Exception as e:
            logging.error(f"Error sending subscription reminder: {e}")
            return False
