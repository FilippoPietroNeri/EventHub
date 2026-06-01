from app.api.admin import admin_bp
from app.api.auth import auth_bp
from app.api.events import events_bp
from app.api.organizer import organizer_bp
from app.api.registrations import registrations_bp
from app.api.reviews import reviews_bp
from app.api.uploads import uploads_bp
from app.api.users import users_bp


def register_blueprints(app):
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(events_bp, url_prefix="/api/events")
    app.register_blueprint(registrations_bp, url_prefix="/api/registrations")
    app.register_blueprint(reviews_bp, url_prefix="/api/reviews")
    app.register_blueprint(users_bp, url_prefix="/api/users")
    app.register_blueprint(organizer_bp, url_prefix="/api/organizer")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(uploads_bp, url_prefix="/api/uploads")