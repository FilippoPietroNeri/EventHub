from flask import Blueprint

from app.utils import serve_upload

uploads_bp = Blueprint("uploads", __name__)


@uploads_bp.get("/<path:filename>")
def get_upload(filename):
    return serve_upload(filename)
