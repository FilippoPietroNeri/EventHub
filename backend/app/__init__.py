from flask import Flask
from flask_cors import CORS

from app.config import Config
from app.extensions import db, swagger
from app.api import register_blueprints
from app.tasks import init_celery


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    init_celery(app)

    CORS(
        app,
        resources={r"/api/*": {"origins": app.config.get("FRONTEND_URL", "*")}},
        supports_credentials=True,
    )

    db.init_app(app)
    swagger.init_app(app)

    register_blueprints(app)

    @app.route("/api/health")
    def health():
        return {
            "status": "ok",
            "supabase": bool(app.config.get("SUPABASE_URL")),
        }

    return app
