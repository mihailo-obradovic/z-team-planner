"""`PATCH` and `DELETE` — the lost-update guard and the removal it makes safe."""

from uuid import uuid4

import pytest

from tests.routes.conftest import BUILDS, Api

pytestmark = pytest.mark.integration

DOCUMENT = {"v": 1, "ec": "coupe", "lu": {"golem": [3, 3, 3, 0, 0]}}


def test_a_patch_with_the_current_etag_writes_and_issues_a_new_one(api: Api) -> None:
    created = api.create("Main").json()

    response = api.patch(created["id"], created["updated_at"], data=DOCUMENT)

    assert response.status_code == 200
    body = response.json()
    assert body["data"] == DOCUMENT
    assert response.headers["ETag"] == body["updated_at"]
    # ! A new version every write, or the ETag the second device still holds would keep working.
    assert body["updated_at"] > created["updated_at"]


def test_a_patch_without_if_match_is_refused(api: Api) -> None:
    created = api.create("Main").json()

    response = api.patch(created["id"], data=DOCUMENT)

    assert response.status_code == 428
    assert response.json()["error"]["code"] == "precondition_required"
    # * Nothing was written.
    assert api.get(created["id"]).json()["data"] == {"v": 1}


def test_a_stale_etag_answers_with_the_other_device_s_build(api: Api) -> None:
    created = api.create("Main").json()
    held = created["updated_at"]
    # * The other device saves first.
    api.patch(created["id"], held, name="Theirs")

    response = api.patch(created["id"], held, data=DOCUMENT)

    assert response.status_code == 412
    body = response.json()
    # ! A build, not the error envelope: without the other device's document the client cannot offer "reload theirs".
    assert "error" not in body
    assert body["name"] == "Theirs"
    assert body["updated_at"] > held
    # * And its ETag, so the client can save over it without reading again.
    assert response.headers["ETag"] == body["updated_at"]


@pytest.mark.parametrize(
    "if_match",
    ["nonsense", "", "2026-08-26T08:00:00.000000Z", "2026-08-26T08:00:00.000000"],
)
def test_an_if_match_that_names_no_version_is_stale(api: Api, if_match: str) -> None:
    # * Including a naive timestamp: guessing an offset for it could let a stale write through, so it is refused like any other value that names nothing.
    created = api.create("Main").json()

    response = api.patch(created["id"], if_match, name="Renamed")

    assert response.status_code == 412
    assert api.get(created["id"]).json()["name"] == "Main"


def test_the_build_s_own_timestamp_without_its_offset_is_stale(api: Api) -> None:
    """The exact instant, spelled without the `Z` — refused, not assumed to be UTC.

    This is the version the server issued, so anything that guessed an offset would let it
    through. The server always sends `Z`; a value without one did not come from here.
    """
    created = api.create("Main").json()
    naive = created["updated_at"].removesuffix("Z")

    response = api.patch(created["id"], naive, name="Renamed")

    assert response.status_code == 412
    assert api.get(created["id"]).json()["name"] == "Main"


def test_a_rename_reuses_the_suffix_slot_it_already_occupies(api: Api) -> None:
    # * "Main (2)" renamed to "Main" keeps the (2): its own name leaves the taken set first, so
    # * the search does not step over the slot this very build is sitting in and land on (3).
    api.create("Main")
    second = api.create("Main").json()
    assert second["name"] == "Main (2)"

    response = api.patch(second["id"], second["updated_at"], name="Main")

    assert response.json()["name"] == "Main (2)"


@pytest.mark.parametrize("wrap", ['"{}"', 'W/"{}"'])
def test_a_quoted_entity_tag_is_accepted(api: Api, wrap: str) -> None:
    # * Intermediaries quote entity-tags, and a weak validator is still this build's version.
    created = api.create("Main").json()

    response = api.patch(
        created["id"], wrap.format(created["updated_at"]), name="Renamed"
    )

    assert response.status_code == 200
    assert response.json()["name"] == "Renamed"


def test_a_rename_onto_another_build_s_name_is_suffixed(api: Api) -> None:
    api.create("Main")
    other = api.create("Other").json()

    response = api.patch(other["id"], other["updated_at"], name="Main")

    assert response.status_code == 200
    assert response.json()["name"] == "Main (2)"


def test_a_rename_to_its_own_name_changes_nothing(api: Api) -> None:
    created = api.create("Main").json()

    response = api.patch(created["id"], created["updated_at"], name="Main")

    assert response.status_code == 200
    # ! The same version, so the ETag the client holds stays valid — a no-op that bumped it would invalidate every other tab for nothing.
    assert response.json()["updated_at"] == created["updated_at"]
    assert response.json()["name"] == "Main"


def test_an_empty_patch_changes_nothing(api: Api) -> None:
    created = api.create("Main").json()

    response = api.patch(created["id"], created["updated_at"])

    assert response.status_code == 200
    assert response.json() == created


def test_a_rename_leaves_the_document_alone(api: Api) -> None:
    created = api.create("Main", DOCUMENT).json()

    response = api.patch(created["id"], created["updated_at"], name="Renamed")

    assert response.json()["data"] == DOCUMENT


def test_a_document_replacement_leaves_the_name_alone(api: Api) -> None:
    created = api.create("Main").json()

    response = api.patch(created["id"], created["updated_at"], data=DOCUMENT)

    assert response.json()["name"] == "Main"


def test_an_invalid_document_is_refused_and_nothing_is_written(api: Api) -> None:
    created = api.create("Main").json()

    response = api.patch(
        created["id"], created["updated_at"], data={"v": 1, "fl": ["golem"]}
    )

    assert response.status_code == 422
    assert response.json()["error"]["details"][0]["path"] == "data.fl[0]"
    unchanged = api.get(created["id"]).json()
    assert unchanged["data"] == {"v": 1}
    assert unchanged["updated_at"] == created["updated_at"]


@pytest.mark.parametrize("name", ["", "   ", "x" * 81])
def test_a_rename_outside_the_name_bounds_is_refused(api: Api, name: str) -> None:
    created = api.create("Main").json()

    response = api.patch(created["id"], created["updated_at"], name=name)

    assert response.status_code == 422
    assert response.json()["error"]["details"][0]["path"] == "name"


def test_a_stale_etag_outranks_an_invalid_document(api: Api) -> None:
    # * The conflict is what the user must resolve first; the document they are holding may not be the one they keep.
    created = api.create("Main").json()
    held = created["updated_at"]
    api.patch(created["id"], held, name="Theirs")

    response = api.patch(created["id"], held, data={"v": 1, "fl": ["golem"]})

    assert response.status_code == 412


def test_another_account_s_build_cannot_be_patched(api: Api) -> None:
    created = api.create("Ann's").json()

    api.act_as("bob")
    response = api.patch(created["id"], created["updated_at"], name="Stolen")

    assert response.status_code == 404
    api.act_as("ann")
    assert api.get(created["id"]).json()["name"] == "Ann's"


def test_patching_an_unknown_build_is_not_found(api: Api) -> None:
    response = api.patch(str(uuid4()), "2026-08-26T08:00:00.000000Z", name="X")

    assert response.status_code == 404


def test_a_missing_if_match_is_refused_before_the_build_is_looked_up(api: Api) -> None:
    # * The header is about the request, not the resource, so refusing it first leaks nothing.
    response = api.client.patch(f"{BUILDS}/{uuid4()}", json={"name": "X"})

    assert response.status_code == 428


def test_a_delete_removes_it_and_the_id_stops_resolving(api: Api) -> None:
    created = api.create("Main").json()

    assert api.delete(created["id"]).status_code == 204
    assert api.get(created["id"]).status_code == 404
    assert api.list().json()["total"] == 0


def test_deleting_twice_is_not_found_rather_than_an_error(api: Api) -> None:
    created = api.create("Main").json()
    api.delete(created["id"])

    response = api.delete(created["id"])

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"


def test_another_account_s_build_cannot_be_deleted(api: Api) -> None:
    created = api.create("Ann's").json()

    api.act_as("bob")
    assert api.delete(created["id"]).status_code == 404

    api.act_as("ann")
    assert api.get(created["id"]).status_code == 200


def test_a_deleted_name_becomes_free_again(api: Api) -> None:
    created = api.create("Main").json()
    api.delete(created["id"])

    # * No leftover suffix: the name was released with the row.
    assert api.create("Main").json()["name"] == "Main"


def test_deleting_frees_a_slot_under_the_cap(api: Api) -> None:
    for index in range(20):
        api.create(f"build-{index}")
    assert api.create("one-too-many").status_code == 409

    api.delete(api.list().json()["items"][0]["id"])

    assert api.create("now-there-is-room").status_code == 201
