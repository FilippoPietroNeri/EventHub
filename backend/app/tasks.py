import logging

from celery import Celery

logger = logging.getLogger(__name__)

celery = Celery("eventhub")


def init_celery(app):
    celery.conf.update(
        broker_url=app.config["CELERY_BROKER_URL"],
        result_backend=app.config["CELERY_RESULT_BACKEND"],
        task_serializer="json",
        accept_content=["json"],
        result_serializer="json",
        timezone="UTC",
        task_always_eager=app.config.get("CELERY_TASK_ALWAYS_EAGER", False),
        task_eager_propagates=app.config.get("CELERY_TASK_EAGER_PROPAGATES", False),
    )
    celery.conf.update(app.config)
    return celery


@celery.task(name="send_registration_email")
def send_registration_email(user_email: str, event_title: str, ticket_code: str):
    """Simula invio email di conferma iscrizione (log in dev)."""
    message = (
        f"Conferma iscrizione a '{event_title}'. "
        f"Codice biglietto: {ticket_code}"
    )
    logger.info("[EMAIL -> %s] %s", user_email, message)
    return {"sent": True, "to": user_email}
