from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileAllowed
from wtforms import StringField, PasswordField, SubmitField, TextAreaField, SelectField, BooleanField, FloatField, IntegerField, HiddenField
from wtforms.validators import DataRequired, Email, Length, EqualTo, Optional, NumberRange, ValidationError
from models import User, SubscriptionType

class LoginForm(FlaskForm):
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired()])
    remember_me = BooleanField('Remember Me')
    submit = SubmitField('Sign In')

class RegistrationForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired(), Length(min=4, max=20)])
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=6)])
    password2 = PasswordField('Repeat Password', validators=[DataRequired(), EqualTo('password')])
    language = SelectField('Language', choices=[('en', 'English'), ('ru', 'Русский'), ('uz', 'O\'zbek')], default='en')
    submit = SubmitField('Register')

    def validate_username(self, username):
        user = User.query.filter_by(username=username.data).first()
        if user:
            raise ValidationError('Please use a different username.')

    def validate_email(self, email):
        user = User.query.filter_by(email=email.data).first()
        if user:
            raise ValidationError('Please use a different email address.')

class BotCreateForm(FlaskForm):
    name = StringField('Bot Name', validators=[DataRequired(), Length(min=1, max=100)])
    description = TextAreaField('Description', validators=[Optional(), Length(max=500)])
    system_prompt = TextAreaField('System Prompt', validators=[Optional(), Length(max=2000)], 
                                 default="You are a helpful assistant.")
    temperature = FloatField('Temperature', validators=[Optional(), NumberRange(min=0, max=2)], default=0.7)
    max_tokens = IntegerField('Max Tokens', validators=[Optional(), NumberRange(min=1, max=4000)], default=1000)
    submit = SubmitField('Create Bot')

class KnowledgeBaseForm(FlaskForm):
    title = StringField('Title', validators=[DataRequired(), Length(min=1, max=200)])
    content = TextAreaField('Content', validators=[Optional()])
    file_upload = FileField('Upload File', validators=[FileAllowed(['txt', 'pdf', 'doc', 'docx'])])
    submit = SubmitField('Add to Knowledge Base')
    
    def validate(self):
        if not super().validate():
            return False
        
        # Either content or file must be provided
        if not self.content.data and not self.file_upload.data:
            self.content.errors.append('Either content or file upload is required.')
            return False
        
        return True

class BotSettingsForm(FlaskForm):
    name = StringField('Bot Name', validators=[DataRequired(), Length(min=1, max=100)])
    description = TextAreaField('Description', validators=[Optional(), Length(max=500)])
    telegram_token = StringField('Telegram Bot Token', validators=[Optional(), Length(max=255)])
    system_prompt = TextAreaField('System Prompt', validators=[Optional(), Length(max=2000)])
    temperature = FloatField('Temperature', validators=[Optional(), NumberRange(min=0, max=2)])
    max_tokens = IntegerField('Max Tokens', validators=[Optional(), NumberRange(min=1, max=4000)])
    is_active = BooleanField('Bot Active')
    submit = SubmitField('Update Bot')

class ProfileForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired(), Length(min=4, max=20)])
    email = StringField('Email', validators=[DataRequired(), Email()])
    language = SelectField('Language', choices=[('en', 'English'), ('ru', 'Русский'), ('uz', 'O\'zbek')])
    submit = SubmitField('Update Profile')

class BroadcastForm(FlaskForm):
    title = StringField('Broadcast Title', validators=[DataRequired(), Length(min=1, max=200)])
    content = TextAreaField('Content', validators=[DataRequired(), Length(min=1)])
    html_content = TextAreaField('HTML Content (Optional)', validators=[Optional()])
    target_subscription = SelectField('Target Users', 
                                    choices=[('free', 'Free Users'), ('business', 'Business Users'), ('enterprise', 'Enterprise Users')],
                                    default='free')
    submit = SubmitField('Send Broadcast')
