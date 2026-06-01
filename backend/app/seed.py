import uuid
from datetime import datetime, timedelta

from flask import current_app

from app.extensions import db
from app.models import Event, Role, User


def seed_database():
    """Seed solo in dev con SUPABASE_AUTH_DISABLED + SQLite."""
    if not current_app.config.get("SUPABASE_AUTH_DISABLED"):
        return
    if User.query.filter_by(email="admin@eventhub.it").first():
        return

    admin = User(
        id=uuid.UUID("00000000-0000-0000-0000-000000000001"),
        email="admin@eventhub.it",
        first_name="Admin",
        last_name="EventHub",
        role=Role.ADMIN,
    )
    organizer = User(
        id=uuid.UUID("00000000-0000-0000-0000-000000000002"),
        email="organizer@eventhub.it",
        first_name="Marco",
        last_name="Rossi",
        role=Role.ORGANIZER,
    )
    user = User(
        id=uuid.UUID("00000000-0000-0000-0000-000000000003"),
        email="user@eventhub.it",
        first_name="Giulia",
        last_name="Bianchi",
        role=Role.USER,
    )

    db.session.add_all([admin, organizer, user])
    db.session.flush()

    now = datetime.utcnow()
    events = [
        Event(
            title="Concerto Jazz al Tramonto",
            description="Serata di jazz con ensemble locale.",
            category="concerto",
            city="Milano",
            venue="Centro Culturale Lambrate",
            start_at=now + timedelta(days=14),
            price=25.00,
            capacity=120,
            featured=True,
            organizer_id=organizer.id,
        ),
        Event(
            title="Workshop di Scrittura Creativa",
            description="Laboratorio pratico di 4 ore.",
            category="workshop",
            city="Torino",
            venue="Biblioteca Civica",
            start_at=now + timedelta(days=21),
            price=15.00,
            capacity=30,
            featured=True,
            organizer_id=organizer.id,
        ),
    ]
    db.session.add_all(events)
    db.session.commit()
