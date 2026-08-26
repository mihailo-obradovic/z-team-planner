"""`/shared/{id}` — what a share link shows, and to whom."""

from uuid import uuid4

import pytest

from app.main import API_V1_PREFIX
from app.utils.ratelimit import TokenBucketLimiter
from tests.routes.conftest import Api

pytestmark = pytest.mark.integration

SHARED = f"{API_V1_PREFIX}/shared"

DOCUMENT = {"v": 1, "ec": "coupe", "fl": ["flambae"], "pw": {"golem": [1, 1]}}


def test_a_share_link_shows_the_owner_s_current_document(api: Api) -> None:
    created = api.create("Main", DOCUMENT).json()

    response = api.client.get(f"{SHARED}/{created['id']}")

    assert response.status_code == 200
    assert response.json()["data"] == DOCUMENT
    assert response.json()["name"] == "Main"


def test_the_public_read_says_nothing_about_the_owner(api: Api) -> None:
    created = api.create("Main", DOCUMENT).json()

    body = api.client.get(f"{SHARED}/{created['id']}").json()

    # ! Exactly these four. An owner id, an email or a display name here would turn a link
    # ! anyone may hold into a way to learn who made it.
    assert set(body) == {"id", "name", "data", "updated_at"}


def test_it_is_the_current_document_not_the_one_at_share_time(api: Api) -> None:
    created = api.create("Main").json()
    api.patch(created["id"], created["updated_at"], data=DOCUMENT)

    # * A live link, not a snapshot — that is what makes it different from a `?build=` URL.
    assert api.client.get(f"{SHARED}/{created['id']}").json()["data"] == DOCUMENT


def test_a_signed_out_visitor_may_read_it(api: Api) -> None:
    created = api.create("Main", DOCUMENT).json()

    # * No Authorization header at all: the id is the whole access control.
    response = api.client.get(
        f"{SHARED}/{created['id']}", headers={"Authorization": ""}
    )

    assert response.status_code == 200


def test_another_account_may_read_it(api: Api) -> None:
    created = api.create("Ann's", DOCUMENT).json()

    api.act_as("bob")

    assert api.client.get(f"{SHARED}/{created['id']}").status_code == 200
    # * Readable by link, still invisible in their own list and unreachable by the owned routes.
    assert api.get(created["id"]).status_code == 404


def test_a_deleted_build_makes_its_link_gone(api: Api) -> None:
    created = api.create("Main").json()
    api.delete(created["id"])

    response = api.client.get(f"{SHARED}/{created['id']}")

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"


def test_an_unknown_id_is_the_same_answer(api: Api) -> None:
    assert api.client.get(f"{SHARED}/{uuid4()}").status_code == 404


def test_an_id_that_is_not_a_uuid_is_refused(api: Api) -> None:
    response = api.client.get(f"{SHARED}/not-a-uuid")

    assert response.status_code == 422
    assert response.json()["error"]["details"][0]["path"] == "build_id"


def test_too_many_reads_from_one_caller_are_refused(api: Api) -> None:
    created = api.create("Main").json()
    # * A small bucket rather than sixty real requests; the figure itself is the limiter's own test.
    api.client.app.state.shared_limiter = TokenBucketLimiter(  # pyright: ignore[reportAttributeAccessIssue]
        capacity=3, refill_per_second=1.0, clock=lambda: 1000.0
    )

    codes = [api.client.get(f"{SHARED}/{created['id']}").status_code for _ in range(4)]

    assert codes == [200, 200, 200, 429]
    refused = api.client.get(f"{SHARED}/{created['id']}")
    assert refused.json()["error"]["code"] == "rate_limited"
    assert "X-Request-ID" in refused.headers


def test_the_limit_does_not_reach_the_account_s_own_routes(api: Api) -> None:
    created = api.create("Main").json()
    api.client.app.state.shared_limiter = TokenBucketLimiter(  # pyright: ignore[reportAttributeAccessIssue]
        capacity=1, refill_per_second=1.0, clock=lambda: 1000.0
    )

    api.client.get(f"{SHARED}/{created['id']}")
    assert api.client.get(f"{SHARED}/{created['id']}").status_code == 429

    # * The stopgap guards the one route an outsider can reach, and nothing else.
    assert api.get(created["id"]).status_code == 200
    assert api.list().status_code == 200


def test_each_application_counts_on_its_own(api: Api) -> None:
    # ! The limiter lives on app.state, not at module scope. A module-level one would leak
    # ! counts between applications — every test builds one, and so would every reload.
    from app.main import create_app

    assert api.client.app.state.shared_limiter is not create_app().state.shared_limiter  # pyright: ignore[reportAttributeAccessIssue]
