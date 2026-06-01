import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent


def _env(name: str, default: str = "") -> str:
    value = os.getenv(name, default) or default
    return value.strip().strip('"').strip("'")


def _database_uri() -> str:
    """Connection pooler Supabase (Session mode) per SQLAlchemy."""
    uri = os.getenv(
        "DATABASE_URL",
        os.getenv("SUPABASE_DB_URL", f"sqlite:///{BASE_DIR / 'eventhub.db'}"),
    )
    if uri.startswith("postgresql://") and "+psycopg" not in uri:
        uri = uri.replace("postgresql://", "postgresql+psycopg://", 1)
    return uri


def _sqlalchemy_engine_options() -> dict:
    uri = _database_uri()
    if not uri.startswith("postgresql"):
        return {}
    return {"pool_pre_ping": True, "pool_size": 5, "max_overflow": 10}


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
    SQLALCHEMY_DATABASE_URI = _database_uri()
    SQLALCHEMY_ENGINE_OPTIONS = _sqlalchemy_engine_options()
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Supabase
    SUPABASE_URL = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")
    SUPABASE_STORAGE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "event-covers")
    SUPABASE_AUTH_DISABLED = os.getenv("SUPABASE_AUTH_DISABLED", "false").lower() == "true"

    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", str(BASE_DIR / "uploads"))
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", 5 * 1024 * 1024))
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "gif"}
    CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
    CELERY_RESULT_BACKEND = os.getenv(
        "CELERY_RESULT_BACKEND", "redis://localhost:6379/0"
    )
    MAIL_FROM = os.getenv("MAIL_FROM", "noreply@eventhub.local")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:4200")

    # Stripe (solo test mode in questa fase)
    STRIPE_SECRET_KEY = _env("STRIPE_SECRET_KEY")
    STRIPE_PUBLISHABLE_KEY = _env("STRIPE_PUBLISHABLE_KEY")
    STRIPE_TEST_MODE_ONLY = _env("STRIPE_TEST_MODE_ONLY", "true").lower() == "true"


class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_ENGINE_OPTIONS = {}
    SUPABASE_AUTH_DISABLED = True
    CELERY_TASK_ALWAYS_EAGER = True
    CELERY_TASK_EAGER_PROPAGATES = True
