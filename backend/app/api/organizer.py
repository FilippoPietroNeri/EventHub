from datetime import datetime

from flask import Blueprint, jsonify, request
from marshmallow import ValidationError

from app.decorators import role_required
from app.extensions import db
from app.models import Event, Registration, Role
from app.schemas import EventSchema, load_schema
from app.utils import save_cover, serialize_event

organizer_bp = Blueprint("organizer", __name__)


@organizer_bp.get("/dashboard")
@role_required(Role.ORGANIZER, Role.ADMIN)
def dashboard(user):
    """
    Statistiche organizzatore
    ---
    tags:
      - Organizer
    security:
      - Bearer: []
    """
    query = Event.query
    if user.role == Role.ORGANIZER:
        query = query.filter_by(organizer_id=user.id)

    events = query.all()
    stats = []
    total_revenue = 0.0
    for event in events:
        active_regs = event.registrations.filter_by(status="active").count()
        revenue = float(event.price) * active_regs
        total_revenue += revenue
        stats.append(
            {
                "event_id": event.id,
                "title": event.title,
                "registrations": active_regs,
                "capacity": event.capacity,
                "estimated_revenue": revenue,
                "average_rating": event.average_rating,
                "start_at": event.start_at.isoformat(),
            }
        )

    return jsonify(
        {
            "events": stats,
            "summary": {
                "total_events": len(events),
                "total_registrations": sum(s["registrations"] for s in stats),
                "total_estimated_revenue": total_revenue,
            },
        }
    )


@organizer_bp.get("/events")
@role_required(Role.ORGANIZER, Role.ADMIN)
def my_events(user):
    query = Event.query
    if user.role == Role.ORGANIZER:
        query = query.filter_by(organizer_id=user.id)
    events = query.order_by(Event.start_at.desc()).all()
    return jsonify({"events": [serialize_event(e, detailed=True) for e in events]})


@organizer_bp.post("/events")
@role_required(Role.ORGANIZER, Role.ADMIN)
def create_event(user):
    try:
        data = _parse_event_form()
    except (ValidationError, ValueError) as e:
        if isinstance(e, ValidationError):
            return jsonify({"errors": e.messages}), 400
        return jsonify({"message": str(e)}), 400

    cover = None
    if "cover_image" in request.files:
        try:
            cover = save_cover(request.files["cover_image"])
        except ValueError as err:
            return jsonify({"message": str(err)}), 400

    event = Event(
        **data,
        cover_image=cover,
        organizer_id=user.id,
    )
    db.session.add(event)
    db.session.commit()
    return jsonify({"event": serialize_event(event, detailed=True)}), 201


@organizer_bp.put("/events/<int:event_id>")
@role_required(Role.ORGANIZER, Role.ADMIN)
def update_event(user, event_id):
    event = db.session.get(Event, event_id)
    if not event:
        return jsonify({"message": "Evento non trovato"}), 404
    if user.role == Role.ORGANIZER and event.organizer_id != user.id:
        return jsonify({"message": "Non autorizzato"}), 403

    try:
        data = _parse_event_form(partial=True)
    except (ValidationError, ValueError) as e:
        if isinstance(e, ValidationError):
            return jsonify({"errors": e.messages}), 400
        return jsonify({"message": str(e)}), 400

    for key, value in data.items():
        setattr(event, key, value)

    if "cover_image" in request.files and request.files["cover_image"].filename:
        try:
            event.cover_image = save_cover(request.files["cover_image"])
        except ValueError as err:
            return jsonify({"message": str(err)}), 400

    db.session.commit()
    return jsonify({"event": serialize_event(event, detailed=True)})


@organizer_bp.delete("/events/<int:event_id>")
@role_required(Role.ORGANIZER, Role.ADMIN)
def delete_event(user, event_id):
    event = db.session.get(Event, event_id)
    if not event:
        return jsonify({"message": "Evento non trovato"}), 404
    if user.role == Role.ORGANIZER and event.organizer_id != user.id:
        return jsonify({"message": "Non autorizzato"}), 403
    db.session.delete(event)
    db.session.commit()
    return jsonify({"message": "Evento eliminato"})


def _parse_event_form(partial=False):
    payload = request.form.to_dict()
    if "start_at" in payload:
        payload["start_at"] = datetime.fromisoformat(payload["start_at"].replace("Z", ""))
    if "price" in payload:
        payload["price"] = payload["price"]
    if "capacity" in payload:
        payload["capacity"] = int(payload["capacity"])
    if "featured" in payload:
        payload["featured"] = payload["featured"].lower() in ("true", "1", "yes")

    if partial:
        schema = EventSchema(partial=True)
        errors = schema.validate(payload)
        if errors:
            raise ValidationError(errors)
        return schema.load(payload)
    return load_schema(EventSchema, payload)

