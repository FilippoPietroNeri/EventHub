from functools import wraps

from flask import jsonify

from app.supabase_auth import AuthError, authenticate_request


def jwt_required():
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                authenticate_request()
            except AuthError as e:
                return jsonify({"message": e.message}), e.status_code
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def role_required(*roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                user = authenticate_request()
            except AuthError as e:
                return jsonify({"message": e.message}), e.status_code
            if user.role not in roles:
                return jsonify({"message": "Permessi insufficienti"}), 403
            return fn(user, *args, **kwargs)

        return wrapper

    return decorator


def get_current_user():
    try:
        return authenticate_request()
    except AuthError:
        return None
