import os
import logging
import requests
from typing import Optional

class TelegramService:
    def __init__(self, bot_token: str):
        self.bot_token = bot_token
        self.base_url = f"https://api.telegram.org/bot{bot_token}"
    
    def set_webhook(self, webhook_url: str) -> bool:
        """
        Set webhook URL for the Telegram bot
        """
        try:
            url = f"{self.base_url}/setWebhook"
            data = {
                "url": webhook_url,
                "allowed_updates": ["message", "callback_query"]
            }
            
            response = requests.post(url, json=data, timeout=10)
            result = response.json()
            
            if result.get("ok"):
                logging.info(f"Webhook set successfully: {webhook_url}")
                return True
            else:
                logging.error(f"Failed to set webhook: {result.get('description')}")
                return False
                
        except Exception as e:
            logging.error(f"Telegram webhook error: {e}")
            return False
    
    def send_message(self, chat_id: int, text: str, parse_mode: str = "HTML") -> bool:
        """
        Send message to Telegram chat
        """
        try:
            url = f"{self.base_url}/sendMessage"
            data = {
                "chat_id": chat_id,
                "text": text,
                "parse_mode": parse_mode
            }
            
            response = requests.post(url, json=data, timeout=10)
            result = response.json()
            
            if result.get("ok"):
                return True
            else:
                logging.error(f"Failed to send message: {result.get('description')}")
                return False
                
        except Exception as e:
            logging.error(f"Telegram send message error: {e}")
            return False
    
    def send_broadcast_message(self, user_ids: list, message: str) -> dict:
        """
        Send broadcast message to multiple users
        """
        results = {"success": 0, "failed": 0, "errors": []}
        
        for user_id in user_ids:
            try:
                if self.send_message(user_id, message):
                    results["success"] += 1
                else:
                    results["failed"] += 1
                    results["errors"].append(f"Failed to send to {user_id}")
            except Exception as e:
                results["failed"] += 1
                results["errors"].append(f"Error sending to {user_id}: {e}")
        
        return results
    
    def get_bot_info(self) -> Optional[dict]:
        """
        Get information about the bot
        """
        try:
            url = f"{self.base_url}/getMe"
            response = requests.get(url, timeout=10)
            result = response.json()
            
            if result.get("ok"):
                return result.get("result")
            else:
                logging.error(f"Failed to get bot info: {result.get('description')}")
                return None
                
        except Exception as e:
            logging.error(f"Telegram get bot info error: {e}")
            return None
    
    def delete_webhook(self) -> bool:
        """
        Delete webhook for the bot
        """
        try:
            url = f"{self.base_url}/deleteWebhook"
            response = requests.post(url, timeout=10)
            result = response.json()
            
            if result.get("ok"):
                logging.info("Webhook deleted successfully")
                return True
            else:
                logging.error(f"Failed to delete webhook: {result.get('description')}")
                return False
                
        except Exception as e:
            logging.error(f"Telegram delete webhook error: {e}")
            return False
