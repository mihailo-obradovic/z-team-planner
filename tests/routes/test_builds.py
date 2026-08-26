"""`/builds` — the Examples table, row by row, against a real database."""

from uuid import uuid4

import pytest

from tests.routes.conftest import BUILDS, Api

pytestmark = pytest.mark.integration


def test_a_create_answers_201_with_the_build_and_its_etag(api: Api) -> None:
    response = api.create("Main")

    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Main"
    assert body["data"] == {"v": 1}
    assert body["format_version"] == 1
    # ! The ETag is the body's own updated_at, character for character — a client hands back exactly what it was given.
    assert response.headers["ETag"] == body["updated_at"]
    assert body["updated_at"].endswith("Z")


def test_the_same_key_replays_rather_than_creating_again(api: Api) -> None:
    key = "retry-after-a-lost-response"

    first = api.create("Main", key=key)
    second = api.create("Main", key=key)

    assert (first.status_code, second.status_code) == (201, 201)
    # * The same build, not a second one with a suffixed name.
    assert first.json() == second.json()
    assert api.list().json()["total"] == 1


def test_the_same_key_with_a_different_body_is_a_conflict(api: Api) -> None:
    key = "reused-by-mistake"
    api.create("Main", key=key)

    response = api.create("Other", key=key)

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "idempotency_conflict"
    assert api.list().json()["total"] == 1


def test_a_rejected_document_does_not_hold_its_key(api: Api) -> None:
    # ! Failures are not stored. If they were, a client that fixed the document and retried with the same key would meet the old rejection for a day.
    key = "fix-and-retry"
    assert api.create("Main", {"v": 1, "fl": ["golem"]}, key=key).status_code == 422

    assert api.create("Main", {"v": 1}, key=key).status_code == 201


def test_a_create_without_a_key_is_refused(api: Api) -> None:
    response = api.client.post(BUILDS, json={"name": "Main", "data": {"v": 1}})

    assert response.status_code == 422
    assert response.json()["error"]["details"][0]["path"] == "Idempotency-Key"


def test_a_colliding_name_comes_back_suffixed(api: Api) -> None:
    assert api.create("Main").json()["name"] == "Main"
    assert api.create("Main").json()["name"] == "Main (2)"
    assert api.create("Main").json()["name"] == "Main (3)"


def test_a_suffix_fills_the_lowest_free_gap(api: Api) -> None:
    api.create("Main")
    api.create("Main (2)")

    # * "Main" is taken and so is "Main (2)", so the next free suffix is 3 — not 2 again, and not 4.
    assert api.create("Main").json()["name"] == "Main (3)"


def test_a_name_is_trimmed(api: Api) -> None:
    assert api.create("  Main  ").json()["name"] == "Main"


@pytest.mark.parametrize("name", ["", "   ", "x" * 81])
def test_a_name_outside_its_bounds_is_refused(api: Api, name: str) -> None:
    response = api.create(name)

    assert response.status_code == 422
    assert response.json()["error"]["details"][0]["path"] == "name"


def test_an_eighty_character_name_is_accepted_and_may_be_suffixed(api: Api) -> None:
    longest = "x" * 80
    assert api.create(longest).json()["name"] == longest
    # * 84 characters, which is why the column is 90 rather than 80.
    assert api.create(longest).json()["name"] == f"{longest} (2)"


def test_an_invalid_document_is_422_with_its_path(api: Api) -> None:
    response = api.create("Main", {"v": 1, "lu": {"coupe": [7, 0, 0, 0, 0]}})

    assert response.status_code == 422
    error = response.json()["error"]
    assert error["code"] == "validation_failed"
    assert error["details"][0]["path"] == "data.lu.coupe.combat"


def test_an_oversized_document_is_413(api: Api) -> None:
    response = api.create(
        "Main", {"v": 1, "lu": {"golem": [1, 0, 0, 0, 0]}, "ec": "c" * 9000}
    )

    assert response.status_code == 413
    assert response.json()["error"]["code"] == "payload_too_large"


def test_the_twenty_first_build_is_refused(api: Api) -> None:
    for index in range(20):
        assert api.create(f"build-{index}").status_code == 201

    response = api.create("one-too-many")

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "build_limit"
    assert "20" in response.json()["error"]["message"]
    # * Nothing was written: the cap is checked inside the same transaction as the insert.
    assert api.list().json()["total"] == 20


def test_the_cap_is_per_account(api: Api) -> None:
    for index in range(20):
        api.create(f"build-{index}")

    api.act_as("bob")

    assert api.create("mine").status_code == 201


def test_a_list_is_newest_updated_first_and_carries_no_documents(api: Api) -> None:
    for name in ("first", "second", "third"):
        api.create(name)

    body = api.list().json()

    assert body == {
        "items": body["items"],
        "total": 3,
        "page": 1,
        "page_size": 20,
    }
    assert [item["name"] for item in body["items"]] == ["third", "second", "first"]
    assert "data" not in body["items"][0]


def test_a_page_is_a_window_on_the_whole_set(api: Api) -> None:
    for index in range(7):
        api.create(f"build-{index}")

    body = api.list(page=2, page_size=5).json()

    assert len(body["items"]) == 2
    assert (body["total"], body["page"], body["page_size"]) == (7, 2, 5)


def test_a_page_past_the_end_is_empty_rather_than_an_error(api: Api) -> None:
    api.create("Main")

    body = api.list(page=9).json()

    assert (body["items"], body["total"]) == ([], 1)


@pytest.mark.parametrize(
    ("query", "path"),
    [
        ({"page": 0}, "page"),
        ({"page_size": 0}, "page_size"),
        ({"page_size": 101}, "page_size"),
    ],
)
def test_pagination_outside_its_bounds_is_refused(
    api: Api, query: dict[str, int], path: str
) -> None:
    response = api.list(**query)

    assert response.status_code == 422
    assert response.json()["error"]["details"][0]["path"] == path


def test_a_list_shows_only_the_caller_s_builds(api: Api) -> None:
    api.create("Ann's")
    api.act_as("bob")
    api.create("Bob's")

    assert [item["name"] for item in api.list().json()["items"]] == ["Bob's"]


def test_a_read_returns_the_document_unchanged(api: Api) -> None:
    document = {
        "v": 1,
        "ec": "coupe",
        "eh": "phenomaman",
        "e8": 1,
        "lu": {"golem": [3, 3, 3, 0, 0]},
        "bl": {"golem": 2},
        "pw": {"golem": [1, 1], "flambae": [1, 2]},
        "sp": {"flambae": 1},
        "fl": ["flambae"],
    }
    created = api.create("Main", document).json()

    response = api.get(created["id"])

    assert response.status_code == 200
    # ! Byte for byte, key for key: what was validated is what comes back (feature 005, Invariants).
    assert response.json()["data"] == document
    assert response.headers["ETag"] == created["updated_at"]


def test_another_account_s_build_is_not_found_rather_than_forbidden(api: Api) -> None:
    build_id = api.create("Ann's").json()["id"]

    api.act_as("bob")
    response = api.get(build_id)

    # ! Never 403: that would confirm the build exists, and an unguessable id is the only access control the public read has.
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"


def test_an_unknown_id_is_not_found(api: Api) -> None:
    assert api.get(str(uuid4())).status_code == 404


def test_an_id_that_is_not_a_uuid_is_refused(api: Api) -> None:
    response = api.get("not-a-uuid")

    assert response.status_code == 422
    assert response.json()["error"]["details"][0]["path"] == "build_id"


def test_every_response_carries_a_request_id(api: Api) -> None:
    assert "X-Request-ID" in api.create("Main").headers
    assert "X-Request-ID" in api.get(str(uuid4())).headers


@pytest.mark.integration
def test_a_database_that_will_not_answer_is_503_not_500(
    container_env: None, monkeypatch: pytest.MonkeyPatch
) -> None:
    from fastapi.testclient import TestClient

    from app.auth import CurrentUser, get_current_user
    from app.core.config import get_settings
    from app.main import create_app

    # * A suspended Neon compute that will not wake looks exactly like this from the API's side.
    monkeypatch.setenv(
        "DATABASE_URL", "postgresql+psycopg://u:p@127.0.0.1:1/neondb?connect_timeout=1"
    )
    get_settings.cache_clear()

    app = create_app()
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(
        id=uuid4(), firebase_uid="uid-ann"
    )

    with TestClient(app) as client:
        response = client.get(BUILDS)

    # ! Retryable, and distinguishable from a 500 without parsing a message — the client can tell the user to try again rather than reporting a bug.
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "service_unavailable"
    assert "X-Request-ID" in response.headers
