import os
import uuid
from pathlib import Path

from flask import current_app, send_from_directory

import base64
from io import BytesIO

import segno

from app.supabase_client import public_cover_url, upload_cover


def allowed_file(filename: str) -> bool:
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower()
        in current_app.config["ALLOWED_EXTENSIONS"]
    )


def save_cover(file) -> str | None:
    if not file or not file.filename:
        return None
    if not allowed_file(file.filename):
        raise ValueError("Formato file non supportato")

    ext = file.filename.rsplit(".", 1)[1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}"
    data = file.read()
    content_type = file.content_type or f"image/{ext}"

    if current_app.config.get("SUPABASE_URL") and current_app.config.get(
        "SUPABASE_SERVICE_ROLE_KEY"
    ):
        path = upload_cover(data, filename, content_type)
        if path:
            return path

    upload_dir = Path(current_app.config["UPLOAD_FOLDER"])
    upload_dir.mkdir(parents=True, exist_ok=True)
    filepath = upload_dir / filename
    with open(filepath, "wb") as f:
        f.write(data)
    return filename


def cover_url(filename: str | None) -> str | None:
    if not filename:
        return None
    if filename.startswith("http"):
        return filename
    if filename.startswith("covers/"):
        return public_cover_url(filename)
    public = public_cover_url(filename)
    if public and public.startswith("http"):
        return public
    return f"/api/uploads/{filename}"


def serve_upload(filename):
    upload_dir = current_app.config["UPLOAD_FOLDER"]
    return send_from_directory(upload_dir, filename)


def generate_ticket_code() -> str:
    return str(uuid.uuid4())


def qr_code_data_uri(ticket_code: str, event_title: str) -> str:
    payload = f"EVENTHUB:{ticket_code}:{event_title}"
    qr = segno.make(payload, error="m")
    buffer = BytesIO()
    qr.save(buffer, kind="png", scale=6, border=2)
    encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
    return f"data:image/png;base64,{encoded}"


def serialize_user(user, include_email=True):
    data = {
        "id": str(user.id),
        "first_name": user.first_name,
        "last_name": user.last_name,
        "full_name": user.full_name,
        "role": user.role,
    }
    if include_email:
        data["email"] = user.email
    return data


def serialize_event(event, detailed=False):
    desc = event.description
    if not detailed and len(desc) > 200:
        desc = desc[:200] + "..."
    return {
        "id": event.id,
        "title": event.title,
        "description": desc if detailed else desc,
        "category": event.category,
        "city": event.city,
        "venue": event.venue,
        "start_at": event.start_at.isoformat(),
        "price": float(event.price),
        "capacity": event.capacity,
        "spots_left": event.spots_left,
        "cover_image": cover_url(event.cover_image),
        "featured": event.featured,
        "is_past": event.is_past,
        "average_rating": event.average_rating,
        "organizer": serialize_user(event.organizer, include_email=False),
    }
