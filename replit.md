# BotFactory - Professional AI Chatbot Platform

## Overview

BotFactory is a professional SaaS platform that enables businesses to create AI-powered chatbots for multiple channels including Telegram, WhatsApp, and Instagram. The platform offers a freemium business model with subscription tiers (Free Trial, Business, Enterprise) and includes features like custom knowledge bases, analytics, team collaboration, and an admin broadcast system for marketing to free users.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Template Engine**: Jinja2 templates with Flask
- **UI Framework**: Bootstrap 5 with custom CSS styling
- **JavaScript**: Vanilla JavaScript with modular architecture (main.js, dashboard.js, admin.js)
- **Charts**: Chart.js for analytics and data visualization
- **Responsive Design**: Mobile-first responsive layout with custom SCSS

### Backend Architecture
- **Web Framework**: Flask with Blueprint-based modular routing
- **Database ORM**: SQLAlchemy with declarative base model
- **Authentication**: Flask-Login with session-based user management
- **Security**: Flask-WTF CSRF protection and form validation
- **Application Structure**: Service-oriented architecture with separate service modules

### Data Storage Solutions
- **Primary Database**: SQLite for development (DATABASE_URL configurable for production)
- **User Management**: Comprehensive user model with subscription tracking and role-based access
- **Bot Management**: Full bot lifecycle with settings, knowledge base, and conversation history
- **Analytics Storage**: Built-in analytics tracking for bot performance and user engagement

### Authentication and Authorization Mechanisms
- **User Authentication**: Email/password based with password hashing using Werkzeug
- **Session Management**: Flask session handling with configurable secret keys
- **Role-Based Access**: Admin users with special privileges for broadcast and user management
- **Subscription Control**: Tiered access control based on subscription levels (Free, Business, Enterprise)

### AI Integration Architecture
- **AI Service**: Google Gemini 2.5 integration for intelligent conversation handling
- **Context Management**: Knowledge base integration for contextual responses
- **Content Analysis**: Built-in sentiment and toxicity analysis capabilities
- **Flexible Prompting**: Customizable system prompts per bot with temperature and token controls

### Multi-Channel Bot Architecture
- **Telegram Integration**: Direct Bot API integration with webhook support
- **Extensible Design**: Service abstraction layer for adding WhatsApp and Instagram support
- **Message Processing**: Centralized message handling with channel-specific adapters
- **Broadcast System**: Admin-controlled messaging system for marketing to free tier users

## External Dependencies

### AI and Machine Learning
- **Google Gemini API**: Primary AI service for natural language processing and response generation
- **API Key Management**: Environment-based configuration for AI service authentication

### Payment Processing
- **Stripe Integration**: Subscription billing and payment processing for Business and Enterprise tiers
- **Webhook Handling**: Stripe webhook processing for subscription lifecycle management

### Communication Services
- **Telegram Bot API**: Direct integration for bot deployment and message handling
- **Future Integrations**: Planned WhatsApp Business API and Instagram Messaging API support

### Development and Deployment
- **Environment Configuration**: Environment variable based configuration for all external services
- **Logging**: Python logging framework for application monitoring and debugging
- **File Handling**: Support for document uploads (PDF, DOC, DOCX, TXT) for knowledge base content

### UI and Frontend Libraries
- **Bootstrap 5**: Primary CSS framework for responsive design
- **Font Awesome**: Icon library for consistent UI elements
- **Chart.js**: Data visualization for analytics dashboards

### Security and Validation
- **WTForms**: Form handling and validation framework
- **CSRF Protection**: Built-in cross-site request forgery protection
- **Input Validation**: Comprehensive validation for user inputs and file uploads