import uuid

from app.extensions import db
from app.models import Role, User


def test_organizer_can_create_event_with_iso_datetime(client):
    organizer = User(
        id=uuid.uuid4(),
        email="organizer@test.it",
        first_name="Org",
        last_name="Test",
        role=Role.ORGANIZER,
    )
    db.session.add(organizer)
    db.session.commit()

    headers = {"Authorization": f"Bearer test-{organizer.id}"}
    res = client.post(
        "/api/organizer/events",
        headers=headers,
        data={
            "title": "Evento test",
            "description": "Descrizione test",
            "category": "concerto",
            "city": "Milano",
            "venue": "Sala Test",
            "start_at": "2026-06-01T10:00:00.000Z",
            "price": "0",
            "capacity": "50",
            "featured": "false",
        },
    )

    assert res.status_code == 201
    assert res.get_json()["event"]["title"] == "Evento test"