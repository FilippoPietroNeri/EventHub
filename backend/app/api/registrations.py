import csv
import io

from flask import Blueprint, jsonify, make_response, request
from app.decorators import jwt_required

from app.decorators import get_current_user, role_required
from app.extensions import db
from app.models import Event, Registration, Role
from app.stripe_payments import create_checkout_session, is_stripe_enabled, retrieve_checkout_session
from app.supabase_auth import AuthError
from app.tasks import send_registration_email
from app.utils import generate_ticket_code, qr_code_data_uri, serialize_event

registrations_bp = Blueprint("registrations", __name__)


@registrations_bp.post("/events/<int:event_id>")
@jwt_required()
def register_for_event(event_id):
    user = get_current_user()
    if not user:
        return jsonify({"message": "Accesso negato"}), 403

    event = db.session.get(Event, event_id)
    if not event:
        return jsonify({"message": "Evento non trovato"}), 404
    if event.is_past:
        return jsonify({"message": "Evento già concluso"}), 400
    if event.spots_left <= 0:
        return jsonify({"message": "Posti esauriti"}), 409
    if float(event.price or 0) > 0:
        return (
            jsonify(
                {
                    "message": "Per eventi a pagamento usa Stripe Checkout",
                    "requires_payment": True,
                }
            ),
            402,
        )

    reg, created = _activate_registration(user.id, event.id)
    if not created:
        return jsonify({"message": "Già iscritto"}), 409

    return jsonify(
        {
            "message": "Iscrizione confermata",
            "registration": _serialize_registration(reg),
        }
    ), 201


@registrations_bp.post("/events/<int:event_id>/checkout-session")
@jwt_required()
def create_checkout(event_id):
    user = get_current_user()
    if not user:
        return jsonify({"message": "Accesso negato"}), 403
    if not is_stripe_enabled():
        return jsonify({"message": "Stripe non configurato"}), 503

    event = db.session.get(Event, event_id)
    if not event:
        return jsonify({"message": "Evento non trovato"}), 404
    if event.is_past:
        return jsonify({"message": "Evento già concluso"}), 400
    if event.spots_left <= 0:
        return jsonify({"message": "Posti esauriti"}), 409
    if float(event.price or 0) <= 0:
        return jsonify({"message": "Evento gratuito: usa iscrizione standard"}), 400

    existing = Registration.query.filter_by(
        user_id=user.id, event_id=event.id, status="active"
    ).first()
    if existing:
        return jsonify({"message": "Già iscritto"}), 409

    try:
        session = create_checkout_session(event=event, user=user)
    except AuthError as exc:
        return jsonify({"message": exc.message}), exc.status_code
    except Exception as exc:
        return jsonify({"message": str(exc)}), 500

    return jsonify(
        {
            "session_id": session.id,
            "checkout_url": session.url,
            "mode": "test",
        }
    )


@registrations_bp.post("/events/<int:event_id>/checkout-confirm")
@jwt_required()
def confirm_checkout(event_id):
    user = get_current_user()
    if not user:
        return jsonify({"message": "Accesso negato"}), 403

    event = db.session.get(Event, event_id)
    if not event:
        return jsonify({"message": "Evento non trovato"}), 404

    body = request.get_json(silent=True) or {}
    session_id = (body.get("session_id") or "").strip()
    if not session_id:
        return jsonify({"message": "session_id mancante"}), 400

    try:
        session = retrieve_checkout_session(session_id)
    except AuthError as exc:
        return jsonify({"message": exc.message}), exc.status_code
    except Exception as exc:
        return jsonify({"message": f"Sessione Stripe non valida: {exc}"}), 400

    if str(session.payment_status) != "paid":
        return jsonify({"message": "Pagamento non completato"}), 409

    metadata = session.metadata or {}
    if str(metadata.get("event_id")) != str(event.id) or str(metadata.get("user_id")) != str(
        user.id
    ):
        return jsonify({"message": "Sessione non valida per questo utente/evento"}), 403

    active = Registration.query.filter_by(
        user_id=user.id, event_id=event.id, status="active"
    ).first()
    if active:
        return jsonify({"message": "Già iscritto", "registration": _serialize_registration(active)})

    reg, _created = _activate_registration(user.id, event.id)
    return jsonify({"message": "Pagamento confermato, iscrizione completata", "registration": _serialize_registration(reg)})


@registrations_bp.delete("/events/<int:event_id>")
@jwt_required()
def unregister_from_event(event_id):
    user = get_current_user()
    reg = Registration.query.filter_by(
        user_id=user.id, event_id=event_id, status="active"
    ).first()
    if not reg:
        return jsonify({"message": "Iscrizione non trovata"}), 404
    reg.status = "cancelled"
    db.session.commit()
    return jsonify({"message": "Disiscrizione completata"})


@registrations_bp.get("/me/tickets")
@jwt_required()
def my_tickets():
    user = get_current_user()
    regs = (
        Registration.query.filter_by(user_id=user.id, status="active")
        .order_by(Registration.registered_at.desc())
        .all()
    )
    return jsonify({"tickets": [_serialize_registration(r) for r in regs]})


@registrations_bp.get("/organizer/events/<int:event_id>/export")
@role_required(Role.ORGANIZER, Role.ADMIN)
def export_attendees(user, event_id):
    event = db.session.get(Event, event_id)
    if not event:
        return jsonify({"message": "Evento non trovato"}), 404
    if user.role == Role.ORGANIZER and event.organizer_id != user.id:
        return jsonify({"message": "Non autorizzato"}), 403

    regs = Registration.query.filter_by(event_id=event_id, status="active").all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ticket_code", "email", "nome", "cognome", "data_iscrizione"])
    for r in regs:
        writer.writerow(
            [
                r.ticket_code,
                r.user.email,
                r.user.first_name,
                r.user.last_name,
                r.registered_at.isoformat(),
            ]
        )

    response = make_response(output.getvalue())
    response.headers["Content-Type"] = "text/csv"
    response.headers["Content-Disposition"] = (
        f'attachment; filename="iscritti_evento_{event_id}.csv"'
    )
    return response


def _serialize_registration(reg: Registration):
    return {
        "id": reg.id,
        "ticket_code": reg.ticket_code,
        "status": reg.status,
        "registered_at": reg.registered_at.isoformat(),
        "qr_code": qr_code_data_uri(reg.ticket_code, reg.event.title),
        "event": serialize_event(reg.event),
    }


def _activate_registration(user_id, event_id):
    existing = Registration.query.filter_by(user_id=user_id, event_id=event_id).first()
    if existing and existing.status == "active":
        return existing, False

    if existing:
        existing.status = "active"
        existing.ticket_code = generate_ticket_code()
        reg = existing
    else:
        reg = Registration(
            user_id=user_id,
            event_id=event_id,
            ticket_code=generate_ticket_code(),
        )
        db.session.add(reg)

    db.session.commit()
    send_registration_email.delay(reg.user.email, reg.event.title, reg.ticket_code)
    return reg, True
