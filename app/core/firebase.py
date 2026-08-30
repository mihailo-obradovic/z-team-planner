"""firebase-admin initialisation — one default app per process.

Identity is Firebase Authentication (decision 004), and every token is validated through
Google's own SDK rather than by hand: it checks signature, time bounds, issuer and audience,
and it caches the signing certificates correctly.
"""

import logging
import os

import firebase_admin
from firebase_admin import credentials
from google.auth import credentials as google_credentials

from app.core.config import Settings

logger = logging.getLogger(__name__)


class _EmulatorCredentials(credentials.Base):
    """A credential that authenticates nothing, for the Auth emulator.

    ! Not the same as passing no credential. firebase-admin builds a google-auth credential
    ! the first time the auth client is used — against the emulator too, which needs none —
    ! and with `None` that means Application Default Credentials. A developer machine has no
    ! reason to carry ADC, so every `verify_id_token` raised `DefaultCredentialsError` and
    ! answered 500: signed-in local development did not work at all.
    """

    def get_credential(self) -> google_credentials.Credentials:
        return google_credentials.AnonymousCredentials()


def init_firebase(settings: Settings) -> firebase_admin.App:
    """Initialise the default app, or return the one this process already has."""
    if settings.firebase_auth_emulator_host:
        # ! The one place configuration writes back into the environment, and it has to. firebase-admin reads this variable from os.environ itself, and pydantic-settings reads `.env` into a Settings object without ever exporting it — so a developer following README's `.env` instructions got a SDK that had never heard of the emulator and refused every unsigned token with "no kid claim". config.py already refuses to start with this set outside development, so this cannot export it anywhere real.
        os.environ["FIREBASE_AUTH_EMULATOR_HOST"] = settings.firebase_auth_emulator_host

    try:
        # * firebase-admin keeps one process-global default app and raises on a second initialize_app. A test builds several applications in one process, so an existing app is reused rather than treated as an error.
        return firebase_admin.get_app()
    except ValueError:
        pass

    if settings.firebase_service_account_json:
        # * A managed host hands the key over as environment contents; config.py has already refused the case where both spellings are set.
        credential: credentials.Base = credentials.Certificate(
            settings.firebase_service_account_json
        )
    elif settings.firebase_service_account_file:
        credential = credentials.Certificate(
            str(settings.firebase_service_account_file)
        )
    else:
        # ! Reached only with FIREBASE_AUTH_EMULATOR_HOST set, which config.py confines to development. The SDK then skips signature verification entirely — that is why serving with it set anywhere else is a total auth bypass.
        logger.warning(
            "Firebase initialised without credentials — emulator mode, tokens are unsigned"
        )
        credential = _EmulatorCredentials()

    return firebase_admin.initialize_app(
        credential, {"projectId": settings.firebase_project_id}
    )
