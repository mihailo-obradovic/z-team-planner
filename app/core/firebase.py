"""firebase-admin initialisation — one default app per process.

Identity is Firebase Authentication (decision 004), and every token is validated through
Google's own SDK rather than by hand: it checks signature, time bounds, issuer and audience,
and it caches the signing certificates correctly.
"""

import logging

import firebase_admin
from firebase_admin import credentials

from app.core.config import Settings

logger = logging.getLogger(__name__)


def init_firebase(settings: Settings) -> firebase_admin.App:
    """Initialise the default app, or return the one this process already has."""
    try:
        # * firebase-admin keeps one process-global default app and raises on a second initialize_app. A test builds several applications in one process, so an existing app is reused rather than treated as an error.
        return firebase_admin.get_app()
    except ValueError:
        pass

    credential = (
        credentials.Certificate(str(settings.firebase_service_account_file))
        if settings.firebase_service_account_file
        else None
    )

    if credential is None:
        # ! Reached only with FIREBASE_AUTH_EMULATOR_HOST set, which config.py confines to development. The SDK then skips signature verification entirely — that is why serving with it set anywhere else is a total auth bypass.
        logger.warning(
            "Firebase initialised without credentials — emulator mode, tokens are unsigned"
        )

    return firebase_admin.initialize_app(
        credential, {"projectId": settings.firebase_project_id}
    )
