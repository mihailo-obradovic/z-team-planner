"""`POST /builds/import` — the first-login offer's endpoint, per item and partial."""

import pytest

from tests.routes.conftest import BUILDS, Api

pytestmark = pytest.mark.integration

VALID = {"v": 1, "ec": "coupe"}
UNKNOWN_HERO = {"v": 1, "lu": {"batman": [1, 0, 0, 0, 0]}}


def _item(name: str, data: dict | None = None) -> dict:
    return {"name": name, "data": data if data is not None else {"v": 1}}


def test_an_import_reports_one_row_per_item(api: Api) -> None:
    response = api.import_builds(
        [_item("First", VALID), _item("Second"), _item("Third")]
    )

    assert response.status_code == 200
    report = response.json()
    assert [row["index"] for row in report] == [0, 1, 2]
    assert {row["status"] for row in report} == {"created"}
    assert [row["name"] for row in report] == ["First", "Second", "Third"]
    assert api.list().json()["total"] == 3


def test_a_bad_item_does_not_cost_the_others(api: Api) -> None:
    response = api.import_builds(
        [_item("First"), _item("Second", UNKNOWN_HERO), _item("Third")]
    )

    report = response.json()
    assert [row["status"] for row in report] == ["created", "invalid", "created"]
    # ! The savepoint's whole job: item 2 rolled back and items 1 and 3 are still there.
    assert sorted(item["name"] for item in api.list().json()["items"]) == [
        "First",
        "Third",
    ]


def test_a_rejected_item_carries_the_paths_that_rejected_it(api: Api) -> None:
    report = api.import_builds([_item("Bad", {"v": 1, "fl": ["golem"]})]).json()

    assert report[0]["status"] == "invalid"
    assert report[0]["errors"] == [
        {"path": "data.fl[0]", "message": report[0]["errors"][0]["message"]}
    ]
    assert report[0]["errors"][0]["message"]
    # * No id and no name on a row that created nothing.
    assert "id" not in report[0]
    assert "name" not in report[0]


def test_a_created_item_carries_the_id_and_the_final_name(api: Api) -> None:
    report = api.import_builds([_item("Main"), _item("Main")]).json()

    assert [row["name"] for row in report] == ["Main", "Main (2)"]
    assert api.get(report[1]["id"]).json()["name"] == "Main (2)"


def test_names_collide_with_what_the_account_already_has(api: Api) -> None:
    api.create("Main")

    report = api.import_builds([_item("Main")]).json()

    assert report[0]["name"] == "Main (2)"


def test_an_unusable_name_is_one_bad_item_not_a_bad_batch(api: Api) -> None:
    # ! Local builds predate the interface's own 80-character rule and come from storage the
    # ! user can edit. One unusable name must not cost them every other build in the offer.
    report = api.import_builds(
        [_item("Fine"), _item("x" * 81), _item("   "), _item("Also fine")]
    ).json()

    assert [row["status"] for row in report] == [
        "created",
        "invalid",
        "invalid",
        "created",
    ]
    assert report[1]["errors"][0]["path"] == "name"
    assert api.list().json()["total"] == 2


def test_an_import_name_is_trimmed(api: Api) -> None:
    assert api.import_builds([_item("  Main  ")]).json()[0]["name"] == "Main"


def test_the_cap_stops_the_batch_where_it_runs_out(api: Api) -> None:
    for index in range(18):
        api.create(f"build-{index}")

    report = api.import_builds([_item("a"), _item("b"), _item("c"), _item("d")]).json()

    assert [row["status"] for row in report] == [
        "created",
        "created",
        "invalid",
        "invalid",
    ]
    # * A refusal with no field to blame is reported against the item as a whole.
    assert report[2]["errors"][0]["path"] == "$"
    assert "20" in report[2]["errors"][0]["message"]
    assert api.list().json()["total"] == 20


def test_an_oversized_item_is_one_bad_item(api: Api) -> None:
    report = api.import_builds(
        [_item("Fine"), _item("Huge", {"v": 1, "ec": "c" * 9000})]
    ).json()

    assert [row["status"] for row in report] == ["created", "invalid"]
    assert report[1]["errors"][0]["path"] == "$"


def test_more_than_fifty_items_is_refused_whole(api: Api) -> None:
    response = api.import_builds([_item(f"build-{index}") for index in range(51)])

    # * Not a report: the server will not read a batch this size at all.
    assert response.status_code == 422
    assert response.json()["error"]["details"][0]["path"] == "builds"
    assert api.list().json()["total"] == 0


def test_exactly_fifty_items_is_accepted(api: Api) -> None:
    response = api.import_builds([_item(f"build-{index}") for index in range(50)])

    assert response.status_code == 200
    # * The cap still applies underneath: fifty offered, twenty kept.
    assert len([row for row in response.json() if row["status"] == "created"]) == 20


def test_an_empty_import_is_an_empty_report(api: Api) -> None:
    response = api.import_builds([])

    assert response.status_code == 200
    assert response.json() == []


def test_the_same_key_replays_the_same_report(api: Api) -> None:
    key = "first-login-offer"
    first = api.import_builds([_item("Main"), _item("Other")], key=key)

    second = api.import_builds([_item("Main"), _item("Other")], key=key)

    assert first.json() == second.json()
    # * Replayed, not re-run: no "Main (2)" and "Other (2)" behind it.
    assert api.list().json()["total"] == 2


def test_an_import_without_a_key_is_refused(api: Api) -> None:
    response = api.client.post(f"{BUILDS}/import", json={"builds": [_item("Main")]})

    assert response.status_code == 422
    assert response.json()["error"]["details"][0]["path"] == "Idempotency-Key"


def test_an_import_belongs_to_the_caller(api: Api) -> None:
    api.import_builds([_item("Ann's")])

    api.act_as("bob")

    assert api.list().json()["total"] == 0


def test_the_documents_survive_the_round_trip(api: Api) -> None:
    document = {
        "v": 1,
        "ec": "coupe",
        "e8": 1,
        "pw": {"golem": [1, 1]},
        "fl": ["flambae"],
    }

    report = api.import_builds([_item("Main", document)]).json()

    assert api.get(report[0]["id"]).json()["data"] == document


def test_import_is_reachable_under_its_own_name(api: Api) -> None:
    # * Nothing answers POST on a build id, so "import" cannot be matched as one. The GET below
    # * really is the parameterised route rejecting a non-UUID, which is the correct answer there.
    assert api.import_builds([]).status_code == 200
    assert api.client.get(f"{BUILDS}/import").status_code == 422


def test_an_item_that_fails_after_writing_leaves_no_row(
    api: Api, monkeypatch: pytest.MonkeyPatch
) -> None:
    """The savepoint's real job, forced.

    Every rejection the code produces today is raised before the item writes anything, so the
    savepoint never has to undo one — which means nothing proves it is there. This makes an
    item write and then fail. Without `begin_nested`, its row rides along to the final commit
    and the account keeps a build the report says was never created.
    """
    from app.exceptions.errors import AppError, ErrorCode
    from app.repositories import builds as builds_repo

    real_insert = builds_repo.insert

    def insert_then_fail(session, *, owner_id, name, data):  # type: ignore[no-untyped-def]
        build = real_insert(session, owner_id=owner_id, name=name, data=data)

        if name == "Doomed":
            raise AppError(
                ErrorCode.VALIDATION_FAILED, "after the write", status_code=422
            )

        return build

    monkeypatch.setattr(builds_repo, "insert", insert_then_fail)

    report = api.import_builds([_item("First"), _item("Doomed"), _item("Third")]).json()

    assert [row["status"] for row in report] == ["created", "invalid", "created"]
    assert sorted(item["name"] for item in api.list().json()["items"]) == [
        "First",
        "Third",
    ]
