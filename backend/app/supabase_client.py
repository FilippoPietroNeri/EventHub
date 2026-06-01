"""Client Supabase (service role) per Storage e operazioni admin."""

from functools import lru_cache

from flask import current_app


@lru_cache(maxsize=1)
def _storage_client():
    from supabase import create_client

    url = current_app.config["SUPABASE_URL"]
    key = current_app.config["SUPABASE_SERVICE_ROLE_KEY"]
    if not url or not key:
        return None
    return create_client(url, key)


def upload_cover(file_bytes: bytes, filename: str, content_type: str) -> str | None:
    """Carica locandina su Supabase Storage; ritorna path pubblico."""
    client = _storage_client()
    if not client:
        return None

    bucket = current_app.config["SUPABASE_STORAGE_BUCKET"]
    storage_path = f"covers/{filename}"
    client.storage.from_(bucket).upload(
        storage_path,
        file_bytes,
        file_options={"content-type": content_type, "upsert": "true"},
    )
    return storage_path


def public_cover_url(storage_path: str | None) -> str | None:
    if not storage_path:
        return None
    if storage_path.startswith("http"):
        return storage_path
    client = _storage_client()
    if not client:
        return f"/api/uploads/{storage_path}"
    bucket = current_app.config["SUPABASE_STORAGE_BUCKET"]
    base = current_app.config["SUPABASE_URL"].rstrip("/")
    return f"{base}/storage/v1/object/public/{bucket}/{storage_path}"
