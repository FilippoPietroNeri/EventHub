from flask import Blueprint, jsonify

from app.decorators import jwt_required
from app.supabase_auth import AuthError, authenticate_request, public_auth_config
from app.utils import serialize_user

auth_bp = Blueprint("auth", __name__)


@auth_bp.get("/config")
def supabase_config():
    """
    Configurazione Supabase per il frontend
    ---
    tags:
      - Auth
    """
    return jsonify(public_auth_config())


@auth_bp.get("/me")
@jwt_required()
def me():
    try:
        user = authenticate_request()
    except AuthError as e:
        return jsonify({"message": e.message}), e.status_code
    return jsonify({"user": serialize_user(user)})


@auth_bp.post("/sync")
@jwt_required()
def sync_profile():
    try:
        user = authenticate_request()
    except AuthError as e:
        return jsonify({"message": e.message}), e.status_code
    return jsonify({"user": serialize_user(user), "message": "Profilo sincronizzato"})
