"""Validazione JWT Supabase Auth e sync profilo locale."""

import uuid
from typing import Any

import jwt
from flask import current_app, g

from app.extensions import db
from app.models import Role, User


class AuthError(Exception):
    def __init__(self, message: str, status_code: int = 401):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def _role_from_claims(claims: dict[str, Any]) -> str:
    app_meta = claims.get("app_metadata") or {}
    role = app_meta.get("role")
    if role in (Role.ADMIN, Role.ORGANIZER, Role.USER):
        return role
    user_meta = claims.get("user_metadata") or {}
    role = user_meta.get("role")
    if role in (Role.ADMIN, Role.ORGANIZER, Role.USER):
        return role
    return Role.USER


def sync_user_from_claims(claims: dict[str, Any]) -> User:
    sub = claims.get("sub")
    if not sub:
        raise AuthError("Token senza subject", 401)

    try:
        user_uuid = uuid.UUID(sub)
    except ValueError as exc:
        raise AuthError("Subject non valido", 401) from exc

    email = (claims.get("email") or "").lower()
    if not email:
        raise AuthError("Token senza email", 401)

    user = db.session.get(User, user_uuid)
    if not user:
        user = User.query.filter_by(email=email).first()

    first = claims.get("given_name") or (claims.get("user_metadata") or {}).get(
        "first_name", "Utente"
    )
    last = claims.get("family_name") or (claims.get("user_metadata") or {}).get(
        "last_name", ""
    )

    if not user:
        user = User(
            id=user_uuid,
            email=email,
            first_name=str(first)[:80],
            last_name=str(last or "EventHub")[:80],
            role=_role_from_claims(claims),
        )
        db.session.add(user)
    else:
        user.id = user_uuid
        user.email = email
        if user.role != Role.ADMIN:
            user.role = _role_from_claims(claims)

    db.session.commit()
    return user


def verify_access_token(token: str) -> dict[str, Any]:
    if current_app.config.get("SUPABASE_AUTH_DISABLED"):
        return _verify_test_token(token)

    try:
        return _verify_with_jwks(token)
    except jwt.ExpiredSignatureError as exc:
        raise AuthError("Token scaduto", 401) from exc
    except AuthError:
        raise
    except Exception as jwks_exc:
        # Fallback per progetti legacy HS256 (JWT secret).
        secret = current_app.config.get("SUPABASE_JWT_SECRET")
        if not secret:
            raise AuthError("Token non valido", 401) from jwks_exc
        try:
            return jwt.decode(
                token,
                secret,
                algorithms=["HS256"],
                audience="authenticated",
                options={"verify_aud": True},
            )
        except jwt.ExpiredSignatureError as exc:
            raise AuthError("Token scaduto", 401) from exc
        except jwt.InvalidTokenError as exc:
            raise AuthError("Token non valido", 401) from exc
        except Exception as exc:
            raise AuthError("Token non valido", 401) from exc


def _verify_with_jwks(token: str) -> dict[str, Any]:
    supabase_url = (current_app.config.get("SUPABASE_URL") or "").rstrip("/")
    if not supabase_url:
        raise AuthError("SUPABASE_URL non configurato", 500)

    issuer = f"{supabase_url}/auth/v1"
    jwks_url = f"{issuer}/.well-known/jwks.json"

    jwk_client = jwt.PyJWKClient(jwks_url)
    signing_key = jwk_client.get_signing_key_from_jwt(token).key
    return jwt.decode(
        token,
        signing_key,
        algorithms=["ES256", "RS256"],
        audience="authenticated",
        issuer=issuer,
        options={"verify_aud": True, "verify_iss": True},
    )


def _verify_test_token(token: str) -> dict[str, Any]:
    if not token.startswith("test-"):
        raise AuthError("Token di test non valido", 401)
    raw_id = token.removeprefix("test-")
    try:
        user = db.session.get(User, uuid.UUID(raw_id))
    except ValueError:
        user = None
    if not user:
        raise AuthError("Utente di test non trovato", 401)
    return {
        "sub": str(user.id),
        "email": user.email,
        "given_name": user.first_name,
        "family_name": user.last_name,
        "app_metadata": {"role": user.role},
    }


def authenticate_request() -> User:
    from flask import request

    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise AuthError("Token mancante", 401)

    token = auth.split(" ", 1)[1].strip()
    claims = verify_access_token(token)
    user = sync_user_from_claims(claims)

    if user.is_banned:
        raise AuthError("Account sospeso", 403)

    g.supabase_claims = claims
    g.current_user = user
    return user


def public_auth_config() -> dict:
    return {
        "supabase_url": current_app.config["SUPABASE_URL"],
        "supabase_anon_key": current_app.config["SUPABASE_ANON_KEY"],
    }
