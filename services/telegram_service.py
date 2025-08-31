import os
import logging
import asyncio
import aiohttp
from typing import Optional, Dict, List, Any
from datetime import datetime
import json
from urllib.parse import urljoin

class TelegramService:
    """
    Enhanced Telegram service with async support, knowledge base integration,
    and comprehensive error handling for BotFactory platform.
    """
    
    def __init__(self, bot_token: str):
        self.bot_token = bot_token
        self.base_url = f"https://api.telegram.org/bot{bot_token}"
        self.session = None
        self.webhook_url = None
        
        # Initialize logging
        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(logging.INFO)
        
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            connector=aiohttp.TCPConnector(limit=100)
        )
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    async def _make_request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Optional[Dict]:
        """
        Make async HTTP request to Telegram API with error handling
        """
        url = f"{self.base_url}/{endpoint}"
        
        try:
            if not self.session:
                self.session = aiohttp.ClientSession(
                    timeout=aiohttp.ClientTimeout(total=30)
                )
            
            if method.upper() == 'GET':
                async with self.session.get(url, params=data) as response:
                    result = await response.json()
            else:
                async with self.session.post(url, json=data) as response:
                    result = await response.json()
            
            if result.get("ok"):
                self.logger.info(f"Telegram API {endpoint} successful")
                return result.get("result")
            else:
                error_msg = result.get('description', 'Unknown error')
                self.logger.error(f"Telegram API error for {endpoint}: {error_msg}")
                return None
                
        except asyncio.TimeoutError:
            self.logger.error(f"Timeout error for Telegram API {endpoint}")
            return None
        except aiohttp.ClientError as e:
            self.logger.error(f"HTTP client error for {endpoint}: {e}")
            return None
        except Exception as e:
            self.logger.error(f"Unexpected error for {endpoint}: {e}")
            return None
    
    async def set_webhook(self, webhook_url: str, secret_token: Optional[str] = None) -> bool:
        """
        Set webhook URL with enhanced security and error handling
        """
        self.webhook_url = webhook_url
        
        data = {
            "url": webhook_url,
            "allowed_updates": [
                "message", 
                "callback_query", 
                "inline_query",
                "edited_message"
            ],
            "drop_pending_updates": True,
            "max_connections": 40
        }
        
        if secret_token:
            data["secret_token"] = secret_token
        
        result = await self._make_request("POST", "setWebhook", data)
        
        if result is not None:
            self.logger.info(f"Webhook set successfully: {webhook_url}")
            return True
        else:
            self.logger.error("Failed to set webhook")
            return False
    
    async def delete_webhook(self, drop_pending_updates: bool = True) -> bool:
        """
        Delete webhook with option to drop pending updates
        """
        data = {"drop_pending_updates": drop_pending_updates}
        result = await self._make_request("POST", "deleteWebhook", data)
        
        if result is not None:
            self.logger.info("Webhook deleted successfully")
            return True
        else:
            self.logger.error("Failed to delete webhook")
            return False
    
    async def get_webhook_info(self) -> Optional[Dict]:
        """
        Get current webhook information
        """
        return await self._make_request("GET", "getWebhookInfo")
    
    async def get_bot_info(self) -> Optional[Dict]:
        """
        Get bot information and validate token
        """
        return await self._make_request("GET", "getMe")
    
    async def send_message(
        self, 
        chat_id: int, 
        text: str, 
        parse_mode: str = "HTML",
        reply_markup: Optional[Dict] = None,
        disable_web_page_preview: bool = False
    ) -> Optional[Dict]:
        """
        Send enhanced message with formatting and keyboard support
        """
        data = {
            "chat_id": chat_id,
            "text": text[:4096],  # Telegram message limit
            "parse_mode": parse_mode,
            "disable_web_page_preview": disable_web_page_preview
        }
        
        if reply_markup:
            data["reply_markup"] = reply_markup
        
        return await self._make_request("POST", "sendMessage", data)
    
    async def send_typing_action(self, chat_id: int) -> bool:
        """
        Send typing indicator to show bot is processing
        """
        data = {
            "chat_id": chat_id,
            "action": "typing"
        }
        
        result = await self._make_request("POST", "sendChatAction", data)
        return result is not None
    
    async def send_document(
        self, 
        chat_id: int, 
        document_url: str, 
        caption: str = "",
        parse_mode: str = "HTML"
    ) -> Optional[Dict]:
        """
        Send document by URL with caption
        """
        data = {
            "chat_id": chat_id,
            "document": document_url,
            "caption": caption[:1024],  # Caption limit
            "parse_mode": parse_mode
        }
        
        return await self._make_request("POST", "sendDocument", data)
    
    async def process_message_with_ai(
        self, 
        message: Dict, 
        bot_config: Dict,
        ai_service,
        knowledge_base: Optional[List[str]] = None
    ) -> Optional[str]:
        """
        Process incoming message with AI integration and knowledge base
        """
        try:
            user_message = message.get('text', '')
            chat_id = message.get('chat', {}).get('id')
            user_id = message.get('from', {}).get('id')
            
            if not user_message or not chat_id:
                return None
            
            # Send typing indicator
            await self.send_typing_action(chat_id)
            
            # Prepare AI context with knowledge base
            context = self._build_ai_context(bot_config, knowledge_base, user_message)
            
            # Get AI response
            ai_response = await ai_service.generate_response(
                prompt=user_message,
                context=context,
                max_tokens=bot_config.get('max_tokens', 1000),
                temperature=bot_config.get('temperature', 0.7)
            )
            
            if ai_response:
                # Log conversation for analytics
                await self._log_conversation(chat_id, user_id, user_message, ai_response)
                return ai_response
            else:
                return bot_config.get('fallback_message', 'Sorry, I cannot process your request right now.')
                
        except Exception as e:
            self.logger.error(f"Error processing message with AI: {e}")
            return bot_config.get('error_message', 'An error occurred while processing your message.')
    
    def _build_ai_context(
        self, 
        bot_config: Dict, 
        knowledge_base: Optional[List[str]], 
        user_message: str
    ) -> str:
        """
        Build context for AI with system prompt and knowledge base
        """
        context_parts = []
        
        # Add system prompt
        if bot_config.get('system_prompt'):
            context_parts.append(f"System: {bot_config['system_prompt']}")
        
        # Add relevant knowledge base content
        if knowledge_base:
            relevant_knowledge = self._find_relevant_knowledge(user_message, knowledge_base)
            if relevant_knowledge:
                context_parts.append(f"Knowledge Base: {relevant_knowledge}")
        
        # Add bot personality
        if bot_config.get('personality'):
            context_parts.append(f"Personality: {bot_config['personality']}")
        
        return "\n\n".join(context_parts)
    
    def _find_relevant_knowledge(self, user_message: str, knowledge_base: List[str]) -> str:
        """
        Simple keyword-based knowledge base search
        TODO: Implement semantic search for better relevance
        """
        user_words = set(user_message.lower().split())
        relevant_docs = []
        
        for doc in knowledge_base[:5]:  # Limit to avoid token overflow
            doc_words = set(doc.lower().split())
            overlap = len(user_words.intersection(doc_words))
            
            if overlap > 0:
                relevant_docs.append((doc, overlap))
        
        # Sort by relevance and return top matches
        relevant_docs.sort(key=lambda x: x[1], reverse=True)
        return " ".join([doc[0] for doc in relevant_docs[:3]])
    
    async def _log_conversation(
        self, 
        chat_id: int, 
        user_id: int, 
        user_message: str, 
        bot_response: str
    ) -> None:
        """
        Log conversation for analytics (implement database logging)
        """
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "chat_id": chat_id,
            "user_id": user_id,
            "user_message": user_message,
            "bot_response": bot_response,
            "message_length": len(user_message),
            "response_length": len(bot_response)
        }
        
        self.logger.info(f"Conversation logged: {json.dumps(log_data)}")
    
    async def handle_webhook_update(
        self, 
        update: Dict, 
        bot_config: Dict,
        ai_service,
        knowledge_base: Optional[List[str]] = None
    ) -> bool:
        """
        Main webhook update handler with comprehensive message processing
        """
        try:
            # Handle regular messages
            if 'message' in update:
                message = update['message']
                chat_id = message.get('chat', {}).get('id')
                
                if not chat_id:
                    return False
                
                # Process with AI
                response = await self.process_message_with_ai(
                    message, bot_config, ai_service, knowledge_base
                )
                
                if response:
                    await self.send_message(chat_id, response)
                    return True
            
            # Handle callback queries (inline keyboard buttons)
            elif 'callback_query' in update:
                callback = update['callback_query']
                chat_id = callback.get('message', {}).get('chat', {}).get('id')
                callback_data = callback.get('data')
                
                if chat_id and callback_data:
                    response = await self._handle_callback_query(callback_data, bot_config)
                    if response:
                        await self.send_message(chat_id, response)
                        return True
            
            # Handle inline queries
            elif 'inline_query' in update:
                inline_query = update['inline_query']
                query_id = inline_query.get('id')
                query_text = inline_query.get('query', '')
                
                if query_id:
                    await self._handle_inline_query(query_id, query_text, bot_config)
                    return True
            
            return False
            
        except Exception as e:
            self.logger.error(f"Error handling webhook update: {e}")
            return False
    
    async def _handle_callback_query(self, callback_data: str, bot_config: Dict) -> Optional[str]:
        """
        Handle callback query from inline keyboards
        """
        try:
            # Parse callback data and generate appropriate response
            if callback_data.startswith("help_"):
                topic = callback_data.replace("help_", "")
                return bot_config.get('help_responses', {}).get(topic, "Help topic not found.")
            
            elif callback_data == "contact_support":
                return "Please contact our support team at support@botfactory.com"
            
            else:
                return "Unknown command."
                
        except Exception as e:
            self.logger.error(f"Error handling callback query: {e}")
            return None
    
    async def _handle_inline_query(self, query_id: str, query_text: str, bot_config: Dict) -> bool:
        """
        Handle inline query for bot mentions in other chats
        """
        try:
            results = []
            
            # Simple inline query handler
            if query_text:
                results = [{
                    "type": "article",
                    "id": "1",
                    "title": f"Ask {bot_config.get('name', 'Bot')}",
                    "description": f"Get an answer about: {query_text}",
                    "input_message_content": {
                        "message_text": f"Please answer: {query_text}"
                    }
                }]
            
            data = {
                "inline_query_id": query_id,
                "results": results[:10],  # Limit results
                "cache_time": 300
            }
            
            result = await self._make_request("POST", "answerInlineQuery", data)
            return result is not None
            
        except Exception as e:
            self.logger.error(f"Error handling inline query: {e}")
            return False
    
    async def send_broadcast_message(
        self, 
        user_ids: List[int], 
        message: str, 
        parse_mode: str = "HTML"
    ) -> Dict[str, Any]:
        """
        Send broadcast message to multiple users with rate limiting
        """
        results = {
            "success": 0,
            "failed": 0,
            "errors": [],
            "total": len(user_ids)
        }
        
        # Rate limiting: max 30 messages per second
        semaphore = asyncio.Semaphore(30)
        
        async def send_to_user(user_id: int):
            async with semaphore:
                try:
                    result = await self.send_message(user_id, message, parse_mode)
                    if result:
                        results["success"] += 1
                    else:
                        results["failed"] += 1
                        results["errors"].append(f"Failed to send to user {user_id}")
                        
                    # Small delay to respect rate limits
                    await asyncio.sleep(0.05)
                    
                except Exception as e:
                    results["failed"] += 1
                    results["errors"].append(f"Error sending to user {user_id}: {str(e)}")
        
        # Execute broadcasts concurrently with rate limiting
        tasks = [send_to_user(user_id) for user_id in user_ids]
        await asyncio.gather(*tasks, return_exceptions=True)
        
        self.logger.info(f"Broadcast completed: {results['success']} successful, {results['failed']} failed")
        return results
    
    async def validate_bot_token(self) -> Dict[str, Any]:
        """
        Validate bot token and return bot information
        """
        bot_info = await self.get_bot_info()
        
        if bot_info:
            return {
                "valid": True,
                "bot_info": bot_info,
                "bot_name": bot_info.get("first_name", "Unknown"),
                "username": bot_info.get("username", ""),
                "can_join_groups": bot_info.get("can_join_groups", False),
                "can_read_all_group_messages": bot_info.get("can_read_all_group_messages", False)
            }
        else:
            return {
                "valid": False,
                "error": "Invalid bot token or API error"
            }
    
    def create_inline_keyboard(self, buttons: List[List[Dict]]) -> Dict:
        """
        Create inline keyboard markup for enhanced user interaction
        """
        return {
            "inline_keyboard": buttons
        }
    
    def create_reply_keyboard(self, buttons: List[List[str]], resize: bool = True) -> Dict:
        """
        Create reply keyboard markup
        """
        keyboard = []
        for row in buttons:
            keyboard.append([{"text": button} for button in row])
        
        return {
            "keyboard": keyboard,
            "resize_keyboard": resize,
            "one_time_keyboard": True
        }

# Utility function for easy service initialization
async def create_telegram_service(bot_token: str) -> TelegramService:
    """
    Factory function to create and initialize Telegram service
    """
    service = TelegramService(bot_token)
    
    # Validate token on initialization
    validation = await service.validate_bot_token()
    if not validation["valid"]:
        raise ValueError(f"Invalid Telegram bot token: {validation.get('error', 'Unknown error')}")
    
    return service