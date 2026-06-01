from decimal import Decimal, ROUND_HALF_UP

import stripe
from flask import current_app

from app.supabase_auth import AuthError


def is_stripe_enabled() -> bool:
    return bool(current_app.config.get("STRIPE_SECRET_KEY"))


def _is_test_key(value: str) -> bool:
    return value.startswith("sk_test_") or value.startswith("rk_test_")


def require_stripe_test_mode() -> None:
    key = current_app.config.get("STRIPE_SECRET_KEY") or ""
    if not key:
        raise AuthError("Stripe non configurato", 503)

    if current_app.config.get("STRIPE_TEST_MODE_ONLY", True) and not _is_test_key(key):
        raise AuthError(
            "EventHub è configurato in TEST MODE: usa una chiave Stripe test (sk_test_/rk_test_)",
            503,
        )


def _price_to_cents(value: Decimal | int | float | str) -> int:
    amount = Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    cents = int((amount * 100).to_integral_value(rounding=ROUND_HALF_UP))
    if cents < 0:
        raise ValueError("Importo non valido")
    return cents


def create_checkout_session(*, event, user):
    require_stripe_test_mode()

    stripe.api_key = current_app.config["STRIPE_SECRET_KEY"]
    amount_cents = _price_to_cents(event.price)
    if amount_cents <= 0:
        raise ValueError("Evento gratuito: checkout Stripe non necessario")

    frontend = current_app.config.get("FRONTEND_URL", "http://localhost:4200").rstrip("/")
    success_url = f"{frontend}/events/{event.id}?checkout=success&session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{frontend}/events/{event.id}?checkout=cancel"

    return stripe.checkout.Session.create(
        mode="payment",
        line_items=[
            {
                "price_data": {
                    "currency": "eur",
                    "product_data": {
                        "name": event.title,
                        "description": f"{event.city} - {event.venue}",
                    },
                    "unit_amount": amount_cents,
                },
                "quantity": 1,
            }
        ],
        success_url=success_url,
        cancel_url=cancel_url,
        customer_email=user.email,
        metadata={"event_id": str(event.id), "user_id": str(user.id)},
    )


def retrieve_checkout_session(session_id: str):
    require_stripe_test_mode()
    stripe.api_key = current_app.config["STRIPE_SECRET_KEY"]
    return stripe.checkout.Session.retrieve(session_id)
