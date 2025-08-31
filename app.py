import os
import logging
import sys
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_wtf.csrf import CSRFProtect
from sqlalchemy.orm import DeclarativeBase
from werkzeug.middleware.proxy_fix import ProxyFix

# Ensure UTF-8 encoding
os.environ['PYTHONIOENCODING'] = 'utf-8'

# Configure logging
logging.basicConfig(level=logging.DEBUG)

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

# Create the app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key-change-in-production")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Configure the database with UTF-8 support
database_url = os.environ.get("DATABASE_URL", "sqlite:///botfactory.db")

app.config["SQLALCHEMY_DATABASE_URI"] = database_url
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
    "echo": False,
}

# Configure SQLite for UTF-8 support
if database_url.startswith('sqlite'):
    from sqlalchemy import event
    from sqlalchemy.engine import Engine
    
    @event.listens_for(Engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        if 'sqlite' in str(type(dbapi_connection)):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA encoding = 'UTF-8'")
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize extensions
db.init_app(app)
csrf = CSRFProtect(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'auth.login'
login_manager.login_message = 'Please log in to access this page.'

@login_manager.user_loader
def load_user(user_id):
    from models import User
    return User.query.get(int(user_id))

# Import and register blueprints
from routes import main_bp, auth_bp, dashboard_bp, admin_bp

app.register_blueprint(main_bp)
app.register_blueprint(auth_bp, url_prefix='/auth')
app.register_blueprint(dashboard_bp, url_prefix='/dashboard')
app.register_blueprint(admin_bp, url_prefix='/admin')

with app.app_context():
    # Import models to ensure they're registered
    import models
    db.create_all()
    
    # Create admin user if doesn't exist
    from models import User, SubscriptionType
    from werkzeug.security import generate_password_hash
    
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@botfactory.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    
    admin_user = User.query.filter_by(email=admin_email).first()
    if not admin_user:
        admin_user = User()
        admin_user.username = "admin"
        admin_user.email = admin_email
        admin_user.password_hash = generate_password_hash(admin_password)
        admin_user.is_admin = True
        admin_user.subscription_type = SubscriptionType.ENTERPRISE
        db.session.add(admin_user)
        db.session.commit()
        logging.info(f"Admin user created with email: {admin_email}")
