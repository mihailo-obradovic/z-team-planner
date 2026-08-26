"""The harness every `/builds` test drives: a real database, two accounts, one client."""

from collections.abc import Iterator
from dataclasses import dataclass
from typing import Any
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from httpx import Response

from app.auth import CurrentUser, get_current_user
from app.main import API_V1_PREFIX, create_app
from app.repositories import users as users_repo

BUILDS = f"{API_V1_PREFIX}/builds"


@dataclass
class Api:
    """A client that is signed in, and can change who it is signed in as.

    The auth dependency is overridden rather than mocked at the SDK: these tests are about the
    builds contract, and `tests/auth/` is where the token path itself is proven.
    """

    client: TestClient
    accounts: dict[str, CurrentUser]
    _current: dict[str, CurrentUser]

    def act_as(self, who: str) -> None:
        self._current["user"] = self.accounts[who]

    def create(
        self,
        name: str = "Main",
        data: dict[str, Any] | None = None,
        key: str | None = None,
    ) -> Response:
        # * A fresh key per call unless a test is specifically about replaying one.
        return self.client.post(
            BUILDS,
            json={"name": name, "data": data if data is not None else {"v": 1}},
            headers={"Idempotency-Key": key or uuid4().hex},
        )

    def get(self, build_id: str) -> Response:
        return self.client.get(f"{BUILDS}/{build_id}")

    def list(self, **query: Any) -> Response:
        return self.client.get(BUILDS, params=query)


@pytest.fixture
def api(migrated_db: None) -> Iterator[Api]:
    app = create_app()

    with app.state.session_factory() as session:
        accounts = {
            who: CurrentUser(
                id=users_repo.upsert_by_firebase_uid(
                    session,
                    firebase_uid=f"uid-{who}",
                    google_sub=f"google-{who}",
                    email=f"{who}@example.com",
                    display_name=who.title(),
                ).id,
                firebase_uid=f"uid-{who}",
            )
            for who in ("ann", "bob")
        }
        session.commit()

    current = {"user": accounts["ann"]}
    app.dependency_overrides[get_current_user] = lambda: current["user"]

    with TestClient(app) as client:
        yield Api(client=client, accounts=accounts, _current=current)
