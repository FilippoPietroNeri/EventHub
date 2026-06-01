from flask import Blueprint, jsonify, request
from marshmallow import ValidationError

from app.decorators import get_current_user, jwt_required
from app.extensions import db
from app.schemas import ChangePasswordSchema, UserProfileSchema, load_schema
from app.utils import serialize_user

users_bp = Blueprint("users", __name__)


@users_bp.patch("/me")
@jwt_required()
def update_profile():
    user = get_current_user()
    try:
        data = load_schema(UserProfileSchema, request.get_json() or {})
    except ValidationError as e:
        return jsonify({"errors": e.messages}), 400

    if "email" in data and data["email"].lower() != user.email:
        from app.models import User

        if User.query.filter_by(email=data["email"].lower()).first():
            return jsonify({"message": "Email già in uso"}), 409
        user.email = data["email"].lower()

    if "first_name" in data:
        user.first_name = data["first_name"]
    if "last_name" in data:
        user.last_name = data["last_name"]

    db.session.commit()
    return jsonify({"user": serialize_user(user)})


@users_bp.post("/me/password")
@jwt_required()
def change_password():
    from flask import current_app

    if not current_app.config.get("SUPABASE_AUTH_DISABLED"):
        return jsonify(
            {
                "message": "La password è gestita da Supabase Auth. "
                "Usa il reset password dall'app o la dashboard Supabase."
            }
        ), 400

    user = get_current_user()
    if not user:
        return jsonify({"message": "Non autenticato"}), 401

    try:
        data = load_schema(ChangePasswordSchema, request.get_json() or {})
    except ValidationError as e:
        return jsonify({"errors": e.messages}), 400

    return jsonify({"message": "Cambio password non disponibile in questa modalità"}), 400
