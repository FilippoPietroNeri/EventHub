import uuid
from datetime import datetime, timedelta

from app.extensions import db
from app.models import Event, Role, User


def test_list_upcoming_events(client):
    org = User(
        id=uuid.uuid4(),
        email="org@events.it",
        first_name="Org",
        last_name="E",
        role=Role.ORGANIZER,
    )
    db.session.add(org)
    db.session.flush()

    past = Event(
        title="Passato",
        description="x",
        category="teatro",
        city="Roma",
        venue="Teatro",
        start_at=datetime.utcnow() - timedelta(days=1),
        price=0,
        capacity=10,
        organizer_id=org.id,
    )
    future = Event(
        title="Futuro",
        description="y",
        category="concerto",
        city="Milano",
        venue="Arena",
        start_at=datetime.utcnow() + timedelta(days=5),
        price=20,
        capacity=50,
        featured=True,
        organizer_id=org.id,
    )
    db.session.add_all([past, future])
    db.session.commit()

    res = client.get("/api/events?upcoming=true")
    assert res.status_code == 200
    titles = [e["title"] for e in res.get_json()["events"]]
    assert "Futuro" in titles
    assert "Passato" not in titles
