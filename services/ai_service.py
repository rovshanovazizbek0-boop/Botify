import os
import logging
from google import genai
from google.genai import types

class AIService:
    def __init__(self):
        self.client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY", "default-key"))
        self.model = "gemini-2.5-flash"
    
    def generate_response(self, user_message, context="", system_prompt="You are a helpful assistant."):
        """
        Generate AI response using Google Gemini
        """
        try:
            # Construct the prompt with context
            full_prompt = f"""
{system_prompt}

Context from knowledge base:
{context}

User message: {user_message}

Please provide a helpful response based on the context provided. If the user's question is not related to the context, still try to be helpful while staying within your role.
"""
            
            response = self.client.models.generate_content(
                model=self.model,
                contents=full_prompt
            )
            
            return response.text or "I apologize, but I couldn't generate a response at this time."
            
        except Exception as e:
            logging.error(f"AI Service error: {e}")
            return "I apologize, but I'm experiencing technical difficulties. Please try again later."
    
    def analyze_content(self, content, analysis_type="sentiment"):
        """
        Analyze content for various purposes (sentiment, toxicity, etc.)
        """
        try:
            if analysis_type == "sentiment":
                prompt = f"Analyze the sentiment of this text and respond with just 'positive', 'negative', or 'neutral': {content}"
            elif analysis_type == "toxicity":
                prompt = f"Is this text toxic, harmful, or inappropriate? Respond with just 'yes' or 'no': {content}"
            else:
                prompt = f"Analyze this text: {content}"
            
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt
            )
            
            return response.text.strip().lower() if response.text else "unknown"
            
        except Exception as e:
            logging.error(f"Content analysis error: {e}")
            return "unknown"
    
    def summarize_text(self, text, max_length=150):
        """
        Summarize long text content
        """
        try:
            prompt = f"Summarize this text in no more than {max_length} characters: {text}"
            
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt
            )
            
            return response.text or text[:max_length] + "..."
            
        except Exception as e:
            logging.error(f"Text summarization error: {e}")
            return text[:max_length] + "..."
