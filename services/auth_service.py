import os
import jwt
import logging
from datetime import datetime, timedelta
from flask import current_app
from werkzeug.security import generate_password_hash, check_password_hash
from models import User, SubscriptionType
from app import db

class AuthService:
    @staticmethod
    def create_user(username: str, email: str, password: str, language: str = 'en') -> User:
        """
        Create a new user with encrypted password
        """
        try:
            user = User()
            user.username = username
            user.email = email
            user.password_hash = generate_password_hash(password)
            user.language = language
            user.subscription_type = SubscriptionType.FREE
            user.is_trial = True
            user.subscription_end = datetime.utcnow() + timedelta(days=14)
            
            db.session.add(user)
            db.session.commit()
            
            logging.info(f"New user created: {email}")
            return user
            
        except Exception as e:
            logging.error(f"Error creating user: {e}")
            db.session.rollback()
            raise
    
    @staticmethod
    def authenticate_user(email: str, password: str) -> User:
        """
        Authenticate user with email and password
        """
        user = User.query.filter_by(email=email).first()
        
        if user and check_password_hash(user.password_hash, password):
            # Update last login
            user.last_login = datetime.utcnow()
            db.session.commit()
            return user
        
        return None
    
    @staticmethod
    def generate_jwt_token(user: User) -> str:
        """
        Generate JWT token for user
        """
        try:
            payload = {
                'user_id': user.id,
                'email': user.email,
                'exp': datetime.utcnow() + timedelta(hours=24)
            }
            
            token = jwt.encode(
                payload,
                current_app.secret_key,
                algorithm='HS256'
            )
            
            return token
            
        except Exception as e:
            logging.error(f"Error generating JWT token: {e}")
            return None
    
    @staticmethod
    def verify_jwt_token(token: str) -> User:
        """
        Verify JWT token and return user
        """
        try:
            payload = jwt.decode(
                token,
                current_app.secret_key,
                algorithms=['HS256']
            )
            
            user = User.query.get(payload['user_id'])
            return user
            
        except jwt.ExpiredSignatureError:
            logging.warning("JWT token expired")
            return None
        except jwt.InvalidTokenError:
            logging.warning("Invalid JWT token")
            return None
        except Exception as e:
            logging.error(f"Error verifying JWT token: {e}")
            return None
    
    @staticmethod
    def change_password(user: User, old_password: str, new_password: str) -> bool:
        """
        Change user password after verifying old password
        """
        try:
            if not check_password_hash(user.password_hash, old_password):
                return False
            
            user.password_hash = generate_password_hash(new_password)
            db.session.commit()
            
            logging.info(f"Password changed for user: {user.email}")
            return True
            
        except Exception as e:
            logging.error(f"Error changing password: {e}")
            db.session.rollback()
            return False
    
    @staticmethod
    def reset_password(email: str, new_password: str) -> bool:
        """
        Reset user password (for admin use or after email verification)
        """
        try:
            user = User.query.filter_by(email=email).first()
            if not user:
                return False
            
            user.password_hash = generate_password_hash(new_password)
            db.session.commit()
            
            logging.info(f"Password reset for user: {email}")
            return True
            
        except Exception as e:
            logging.error(f"Error resetting password: {e}")
            db.session.rollback()
            return False
    
    @staticmethod
    def check_subscription_status(user: User) -> dict:
        """
        Check user subscription status and return details
        """
        now = datetime.utcnow()
        is_active = user.subscription_end > now
        days_remaining = (user.subscription_end - now).days if is_active else 0
        
        return {
            'is_active': is_active,
            'days_remaining': days_remaining,
            'subscription_type': user.subscription_type.value,
            'is_trial': user.is_trial,
            'expires_at': user.subscription_end
        }
    
    @staticmethod
    def upgrade_subscription(user: User, subscription_type: str, duration_days: int = 30) -> bool:
        """
        Upgrade user subscription
        """
        try:
            user.subscription_type = SubscriptionType(subscription_type)
            user.is_trial = False
            user.subscription_end = datetime.utcnow() + timedelta(days=duration_days)
            
            db.session.commit()
            
            logging.info(f"Subscription upgraded for user {user.email} to {subscription_type}")
            return True
            
        except Exception as e:
            logging.error(f"Error upgrading subscription: {e}")
            db.session.rollback()
            return False
