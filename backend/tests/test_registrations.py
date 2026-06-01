import uuid
from datetime import datetime, timedelta

from app.extensions import db
from app.models import Event, Role, User


def _create_event(organizer_id):
    event = Event(
        title="Test Event",
        description="Descrizione test",
        category="concerto",
        city="Milano",
        venue="Sala Test",
        start_at=datetime.utcnow() + timedelta(days=10),
        price=0,
        capacity=2,
        organizer_id=organizer_id,
    )
    db.session.add(event)
    db.session.commit()
    return event


def test_register_full_capacity(client, auth_headers):
    headers, user = auth_headers
    org = User(
        id=uuid.uuid4(),
        email="org@test.it",
        first_name="Org",
        last_name="Test",
        role=Role.ORGANIZER,
    )
    db.session.add(org)
    db.session.commit()

    event = _create_event(org.id)

    for i in range(2):
        u = User(
            id=uuid.uuid4(),
            email=f"u{i}@test.it",
            first_name="A",
            last_name="B",
            role=Role.USER,
        )
        db.session.add(u)
        db.session.flush()
        fill_headers = {"Authorization": f"Bearer test-{u.id}"}
        client.post(f"/api/registrations/events/{event.id}", headers=fill_headers)

    res = client.post(f"/api/registrations/events/{event.id}", headers=headers)
    assert res.status_code in (409, 201)


def test_register_success(client, auth_headers):
    headers, user = auth_headers
    org = User(
        id=uuid.uuid4(),
        email="org2@test.it",
        first_name="Org",
        last_name="Test",
        role=Role.ORGANIZER,
    )
    db.session.add(org)
    db.session.commit()
    event = _create_event(org.id)

    res = client.post(f"/api/registrations/events/{event.id}", headers=headers)
    assert res.status_code == 201
    assert "ticket_code" in res.get_json()["registration"]


def test_register_paid_event_requires_checkout(client, auth_headers):
    headers, user = auth_headers
    org = User(
        id=uuid.uuid4(),
        email="org3@test.it",
        first_name="Org",
        last_name="Test",
        role=Role.ORGANIZER,
    )
    db.session.add(org)
    db.session.commit()
    event = _create_event(org.id)
    event.price = 25
    db.session.commit()

    res = client.post(f"/api/registrations/events/{event.id}", headers=headers)
    assert res.status_code == 402
    assert res.get_json()["requires_payment"] is True
