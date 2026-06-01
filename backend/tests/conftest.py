import uuid

import pytest

from app import create_app
from app.config import TestConfig
from app.extensions import db
from app.models import Role, User
from app.seed import seed_database


@pytest.fixture
def app():
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        seed_database()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def auth_headers(client):
    user = User(
        id=uuid.UUID("00000000-0000-0000-0000-000000000099"),
        email="test@eventhub.it",
        first_name="Test",
        last_name="User",
        role=Role.USER,
    )
    db.session.add(user)
    db.session.commit()

    return {"Authorization": f"Bearer test-{user.id}"}, user
