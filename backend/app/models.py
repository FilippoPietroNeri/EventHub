import uuid
from datetime import datetime

from app.datetime_utils import ensure_utc, utc_now
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.types import CHAR, TypeDecorator

from app.extensions import db


class Role:
    USER = "user"
    ORGANIZER = "organizer"
    ADMIN = "admin"


class GUID(TypeDecorator):
    """UUID compatibile SQLite (test) e PostgreSQL (Supabase)."""

    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(UUID(as_uuid=True))
        return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if isinstance(value, uuid.UUID):
            return str(value)
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        return uuid.UUID(value) if not isinstance(value, uuid.UUID) else value


class User(db.Model):
    __tablename__ = "profiles"

    id = db.Column(GUID(), primary_key=True, default=uuid.uuid4)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    first_name = db.Column(db.String(80), nullable=False)
    last_name = db.Column(db.String(80), nullable=False)
    role = db.Column(db.String(20), default=Role.USER, nullable=False)
    is_banned = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    events_organized = db.relationship("Event", back_populates="organizer", lazy="dynamic")
    registrations = db.relationship("Registration", back_populates="user", lazy="dynamic")
    reviews = db.relationship("Review", back_populates="user", lazy="dynamic")

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"


class Event(db.Model):
    __tablename__ = "events"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(80), nullable=False, index=True)
    city = db.Column(db.String(100), nullable=False, index=True)
    venue = db.Column(db.String(200), nullable=False)
    start_at = db.Column(db.DateTime, nullable=False, index=True)
    price = db.Column(db.Numeric(10, 2), default=0)
    capacity = db.Column(db.Integer, nullable=False)
    cover_image = db.Column(db.String(512))
    featured = db.Column(db.Boolean, default=False)
    organizer_id = db.Column(GUID(), db.ForeignKey("profiles.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    organizer = db.relationship("User", back_populates="events_organized")
    registrations = db.relationship(
        "Registration", back_populates="event", lazy="dynamic", cascade="all, delete-orphan"
    )
    reviews = db.relationship(
        "Review", back_populates="event", lazy="dynamic", cascade="all, delete-orphan"
    )

    @property
    def spots_left(self) -> int:
        count = self.registrations.filter_by(status="active").count()
        return max(0, self.capacity - count)

    @property
    def is_past(self) -> bool:
        return ensure_utc(self.start_at) < utc_now()

    @property
    def average_rating(self) -> float | None:
        reviews = self.reviews.filter_by(is_hidden=False).all()
        if not reviews:
            return None
        return round(sum(r.rating for r in reviews) / len(reviews), 2)


class Registration(db.Model):
    __tablename__ = "registrations"
    __table_args__ = (db.UniqueConstraint("user_id", "event_id", name="uq_user_event"),)

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(GUID(), db.ForeignKey("profiles.id"), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey("events.id"), nullable=False)
    ticket_code = db.Column(db.String(36), unique=True, nullable=False, index=True)
    status = db.Column(db.String(20), default="active")
    registered_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", back_populates="registrations")
    event = db.relationship("Event", back_populates="registrations")


class Review(db.Model):
    __tablename__ = "reviews"
    __table_args__ = (db.UniqueConstraint("user_id", "event_id", name="uq_review_user_event"),)

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(GUID(), db.ForeignKey("profiles.id"), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey("events.id"), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text, nullable=False)
    is_reported = db.Column(db.Boolean, default=False)
    is_hidden = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", back_populates="reviews")
    event = db.relationship("Event", back_populates="reviews")
