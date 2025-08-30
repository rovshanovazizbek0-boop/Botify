import os
import logging
import stripe
from datetime import datetime, timedelta
from models import User, SubscriptionType
from app import db

# Configure Stripe only if API key is available
stripe_key = os.environ.get('STRIPE_SECRET_KEY')
if stripe_key:
    stripe.api_key = stripe_key

class PaymentService:
    def __init__(self):
        self.stripe_api_key = os.environ.get('STRIPE_SECRET_KEY')
        self.domain = os.environ.get('DOMAIN_URL', 'http://localhost:5000')
    
    def create_checkout_session(self, user: User, subscription_type: str) -> str | None:
        """
        Create Stripe checkout session for subscription
        """
        if not self.stripe_api_key:
            logging.warning("Stripe API key not configured")
            return None
        
        try:
            # Define pricing based on subscription type
            prices = {
                'business': os.environ.get('STRIPE_BUSINESS_PRICE_ID', 'price_business'),
                'enterprise': os.environ.get('STRIPE_ENTERPRISE_PRICE_ID', 'price_enterprise')
            }
            
            if subscription_type not in prices:
                raise ValueError(f"Invalid subscription type: {subscription_type}")
            
            checkout_session = stripe.checkout.Session.create(
                customer_email=user.email,
                line_items=[{
                    'price': prices[subscription_type],
                    'quantity': 1,
                }],
                mode='subscription',
                success_url=f'{self.domain}/dashboard?payment=success',
                cancel_url=f'{self.domain}/dashboard?payment=canceled',
                metadata={
                    'user_id': user.id,
                    'subscription_type': subscription_type
                }
            )
            
            return checkout_session.url
            
        except Exception as e:
            logging.error(f"Stripe checkout session error: {e}")
            return None
    
    def handle_successful_payment(self, session_data: dict) -> bool:
        """
        Handle successful payment webhook from Stripe
        """
        try:
            user_id = session_data['metadata']['user_id']
            subscription_type = session_data['metadata']['subscription_type']
            
            user = User.query.get(user_id)
            if not user:
                logging.error(f"User not found for payment: {user_id}")
                return False
            
            # Update user subscription
            user.subscription_type = SubscriptionType(subscription_type)
            user.is_trial = False
            user.subscription_end = datetime.utcnow() + timedelta(days=30)
            
            db.session.commit()
            
            logging.info(f"Payment processed successfully for user {user.email}")
            return True
            
        except Exception as e:
            logging.error(f"Payment processing error: {e}")
            db.session.rollback()
            return False
    
    def create_payme_payment(self, user: User, subscription_type: str, amount: float) -> dict:
        """
        Create Payme payment (placeholder for Uzbekistan payment system)
        """
        try:
            # This would integrate with actual Payme API
            payme_data = {
                'amount': amount * 100,  # Convert to tiyin
                'account': {
                    'user_id': user.id,
                    'subscription_type': subscription_type
                },
                'return_url': f'{self.domain}/dashboard?payment=success'
            }
            
            # In real implementation, you would call Payme API here
            logging.info(f"Payme payment created for user {user.email}")
            
            return {
                'success': True,
                'payment_url': f'{self.domain}/payment/payme?session_id=placeholder',
                'payment_id': 'payme_placeholder_id'
            }
            
        except Exception as e:
            logging.error(f"Payme payment error: {e}")
            return {'success': False, 'error': str(e)}
    
    def create_payoneer_payment(self, user: User, subscription_type: str, amount: float) -> dict:
        """
        Create Payoneer payment (placeholder for freelancer payment system)
        """
        try:
            # This would integrate with actual Payoneer API
            payoneer_data = {
                'amount': amount,
                'currency': 'USD',
                'user_id': user.id,
                'subscription_type': subscription_type,
                'return_url': f'{self.domain}/dashboard?payment=success'
            }
            
            # In real implementation, you would call Payoneer API here
            logging.info(f"Payoneer payment created for user {user.email}")
            
            return {
                'success': True,
                'payment_url': f'{self.domain}/payment/payoneer?session_id=placeholder',
                'payment_id': 'payoneer_placeholder_id'
            }
            
        except Exception as e:
            logging.error(f"Payoneer payment error: {e}")
            return {'success': False, 'error': str(e)}
    
    def get_subscription_prices(self) -> dict:
        """
        Get current subscription prices
        """
        return {
            'business': {
                'monthly': 49.0,
                'currency': 'USD',
                'features': [
                    '20 bots',
                    'Unlimited messages',
                    'Analytics dashboard',
                    'Team collaboration',
                    'All channel integrations'
                ]
            },
            'enterprise': {
                'monthly': 99.0,
                'currency': 'USD',
                'features': [
                    'Unlimited bots',
                    'Unlimited messages',
                    'Advanced analytics',
                    'Priority support',
                    'API access',
                    'Custom integrations',
                    'Gemini 2.5 Pro model'
                ]
            }
        }
    
    def cancel_subscription(self, user: User) -> bool:
        """
        Cancel user subscription
        """
        try:
            # In real implementation, you would cancel the subscription in Stripe
            # For now, we'll just mark it as expired
            user.subscription_end = datetime.utcnow()
            db.session.commit()
            
            logging.info(f"Subscription canceled for user {user.email}")
            return True
            
        except Exception as e:
            logging.error(f"Subscription cancellation error: {e}")
            db.session.rollback()
            return False
