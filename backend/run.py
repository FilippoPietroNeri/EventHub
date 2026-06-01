import os

from app import create_app
from app.extensions import db
from app.seed import seed_database
from app.tasks import init_celery

app = create_app()
init_celery(app)

with app.app_context():
    from app import models  # noqa: F401

    # Solo dev locale senza Supabase: crea schema SQLite e seed
    if (
        os.getenv("AUTO_CREATE_DB", "false").lower() == "true"
        and app.config.get("SUPABASE_AUTH_DISABLED")
    ):
        db.create_all()
        seed_database()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)), debug=True)
