from datetime import datetime

from flask import Blueprint, jsonify, request
from sqlalchemy import or_

from app.datetime_utils import utc_now
from app.decorators import get_current_user
from app.extensions import db
from app.models import Event, Registration
from app.utils import serialize_event

events_bp = Blueprint("events", __name__)


@events_bp.get("")
def list_events():
    """
    Lista eventi con filtri
    ---
    tags:
      - Events
    parameters:
      - name: q
        in: query
        type: string
      - name: category
        in: query
        type: string
      - name: city
        in: query
        type: string
      - name: date_from
        in: query
        type: string
      - name: date_to
        in: query
        type: string
      - name: max_price
        in: query
        type: number
      - name: featured
        in: query
        type: boolean
      - name: upcoming
        in: query
        type: boolean
    """
    query = Event.query

    q = request.args.get("q")
    if q:
        like = f"%{q}%"
        query = query.filter(
            or_(Event.title.ilike(like), Event.description.ilike(like), Event.city.ilike(like))
        )

    if category := request.args.get("category"):
        query = query.filter(Event.category == category)

    if city := request.args.get("city"):
        query = query.filter(Event.city.ilike(f"%{city}%"))

    if date_from := request.args.get("date_from"):
        query = query.filter(Event.start_at >= datetime.fromisoformat(date_from))

    if date_to := request.args.get("date_to"):
        query = query.filter(Event.start_at <= datetime.fromisoformat(date_to))

    if max_price := request.args.get("max_price"):
        query = query.filter(Event.price <= float(max_price))

    if request.args.get("featured") == "true":
        query = query.filter(Event.featured.is_(True))

    if request.args.get("upcoming") == "true":
        query = query.filter(Event.start_at >= utc_now())

    events = query.order_by(Event.start_at.asc()).all()
    return jsonify({"events": [serialize_event(e) for e in events]})


@events_bp.get("/home")
def home():
    now = utc_now()
    featured = (
        Event.query.filter(Event.featured.is_(True), Event.start_at >= now)
        .order_by(Event.start_at.asc())
        .limit(6)
        .all()
    )
    upcoming = (
        Event.query.filter(Event.start_at >= now)
        .order_by(Event.start_at.asc())
        .limit(12)
        .all()
    )
    return jsonify(
        {
            "featured": [serialize_event(e) for e in featured],
            "upcoming": [serialize_event(e) for e in upcoming],
        }
    )


@events_bp.get("/<int:event_id>")
def get_event(event_id):
    event = db.session.get(Event, event_id)
    if not event:
        return jsonify({"message": "Evento non trovato"}), 404
    data = serialize_event(event, detailed=True)
    user = None
    try:
        user = get_current_user()
    except Exception:
        pass
    if user:
        reg = Registration.query.filter_by(
            user_id=user.id, event_id=event.id, status="active"
        ).first()
        data["is_registered"] = reg is not None
    return jsonify({"event": data})


@events_bp.get("/categories")
def categories():
    rows = db.session.query(Event.category).distinct().all()
    return jsonify({"categories": [r[0] for r in rows]})
