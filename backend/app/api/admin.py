from flask import Blueprint, jsonify, request
from marshmallow import ValidationError

from app.decorators import role_required
from app.extensions import db
from app.models import Review, Role, User
from app.schemas import UserAdminSchema, load_schema
from app.utils import serialize_user

admin_bp = Blueprint("admin", __name__)


@admin_bp.get("/users")
@role_required(Role.ADMIN)
def list_users(user):
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify(
        {
            "users": [
                {
                    **serialize_user(u),
                    "is_banned": u.is_banned,
                    "created_at": u.created_at.isoformat(),
                }
                for u in users
            ]
        }
    )


@admin_bp.patch("/users/<uuid:user_id>")
@role_required(Role.ADMIN)
def update_user(user, user_id):
    target = db.session.get(User, user_id)
    if not target:
        return jsonify({"message": "Utente non trovato"}), 404
    if target.id == user.id:
        return jsonify({"message": "Non puoi modificare il tuo account da qui"}), 400

    try:
        data = load_schema(UserAdminSchema, request.get_json() or {})
    except ValidationError as e:
        return jsonify({"errors": e.messages}), 400

    if "role" in data:
        target.role = data["role"]
    if "is_banned" in data:
        target.is_banned = data["is_banned"]

    db.session.commit()
    return jsonify({"user": serialize_user(target), "is_banned": target.is_banned})


@admin_bp.get("/reviews/reported")
@role_required(Role.ADMIN)
def reported_reviews(user):
    reviews = Review.query.filter_by(is_reported=True, is_hidden=False).all()
    return jsonify(
        {
            "reviews": [
                {
                    "id": r.id,
                    "rating": r.rating,
                    "comment": r.comment,
                    "event_id": r.event_id,
                    "event_title": r.event.title,
                    "user": serialize_user(r.user, include_email=False),
                    "created_at": r.created_at.isoformat(),
                }
                for r in reviews
            ]
        }
    )


@admin_bp.post("/reviews/<int:review_id>/moderate")
@role_required(Role.ADMIN)
def moderate_review(user, review_id):
    review = db.session.get(Review, review_id)
    if not review:
        return jsonify({"message": "Recensione non trovata"}), 404

    action = (request.get_json() or {}).get("action", "hide")
    if action == "hide":
        review.is_hidden = True
        review.is_reported = False
    elif action == "dismiss":
        review.is_reported = False
    else:
        return jsonify({"message": "Azione non valida"}), 400

    db.session.commit()
    return jsonify({"message": "Moderazione applicata"})
