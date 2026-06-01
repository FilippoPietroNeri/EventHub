from flask import Blueprint, jsonify, request
from app.decorators import jwt_required
from marshmallow import ValidationError

from app.decorators import get_current_user, role_required
from app.extensions import db
from app.models import Event, Registration, Review, Role
from app.schemas import ReviewSchema, load_schema

reviews_bp = Blueprint("reviews", __name__)


@reviews_bp.get("/events/<int:event_id>")
def list_reviews(event_id):
    reviews = (
        Review.query.filter_by(event_id=event_id, is_hidden=False)
        .order_by(Review.created_at.desc())
        .all()
    )
    return jsonify({"reviews": [_serialize_review(r) for r in reviews]})


@reviews_bp.post("/events/<int:event_id>")
@jwt_required()
def create_review(event_id):
    user = get_current_user()
    event = db.session.get(Event, event_id)
    if not event:
        return jsonify({"message": "Evento non trovato"}), 404
    if not event.is_past:
        return jsonify({"message": "Puoi recensire solo eventi conclusi"}), 400

    attended = Registration.query.filter_by(
        user_id=user.id, event_id=event_id, status="active"
    ).first()
    if not attended:
        return jsonify({"message": "Devi essere stato iscritto all'evento"}), 403

    if Review.query.filter_by(user_id=user.id, event_id=event_id).first():
        return jsonify({"message": "Recensione già pubblicata"}), 409

    try:
        data = load_schema(ReviewSchema, request.get_json() or {})
    except ValidationError as e:
        return jsonify({"errors": e.messages}), 400

    review = Review(
        user_id=user.id,
        event_id=event_id,
        rating=data["rating"],
        comment=data["comment"],
    )
    db.session.add(review)
    db.session.commit()
    return jsonify({"review": _serialize_review(review)}), 201


@reviews_bp.post("/<int:review_id>/report")
@jwt_required()
def report_review(review_id):
    review = db.session.get(Review, review_id)
    if not review:
        return jsonify({"message": "Recensione non trovata"}), 404
    review.is_reported = True
    db.session.commit()
    return jsonify({"message": "Recensione segnalata"})


def _serialize_review(review: Review):
    return {
        "id": review.id,
        "rating": review.rating,
        "comment": review.comment,
        "created_at": review.created_at.isoformat(),
        "is_reported": review.is_reported,
        "user": {
            "id": review.user.id,
            "full_name": review.user.full_name,
        },
    }
