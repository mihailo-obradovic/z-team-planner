"""The five validation tiers and the episode rules (feature 005, Business Rules).

Order is size (413) → structure → identity → ranges, episode, budgets, caps (422). Identity
runs alone because every later tier indexes the game data by hero id; the rest collect
together, so one response tells the client everything that is wrong with the document.

Every failure carries the dotted path the client renders inline on the offending field.
"""

import json
from typing import Any

from pydantic import ValidationError

from app.core.game_data import GameData
from app.exceptions.errors import AppError, ErrorCode, ErrorDetail
from app.exceptions.handlers import location_to_path
from app.schemas.builds import BuildDocument, RawDocument

MAX_DOCUMENT_BYTES = 8192

# * The keys that hold per-hero state, in the order a client reads them.
_HERO_KEYS = ("lu", "bl", "pw", "sp")

# * Feature 015: the mission simulator's fixed shape — three templates, four team slots,
# * synergy levels 0–3, and the marker a Prism illusion occupies a slot with.
_MISSION_TEMPLATES = 3
_MISSION_SLOTS = 4
_MAX_SYNERGY_LEVEL = 3
_ILLUSION = "illusion"
_GOLEM_COPY = "copy"


def document_bytes(raw: Any) -> int:
    """The document's size in bytes, compactly encoded.

    Compact separators on purpose: the 8 KB rule is about the document, not about whichever
    indentation a client happened to send it with.
    """
    return len(
        json.dumps(raw, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    )


def _invalid(details: list[ErrorDetail]) -> AppError:
    return AppError(
        ErrorCode.VALIDATION_FAILED,
        "Validation failed.",
        status_code=422,
        details=details,
    )


def _deduplicate(details: list[ErrorDetail]) -> list[ErrorDetail]:
    # * Two tiers can condemn the same path (a recruit flight-trained is both "not Flight School" and "a recruit cannot train"); the client renders one message per field.
    seen: set[str] = set()
    unique: list[ErrorDetail] = []

    for detail in details:
        if detail.path not in seen:
            seen.add(detail.path)
            unique.append(detail)

    return unique


def validate_build_data(raw: RawDocument, game: GameData) -> BuildDocument:
    """Return the parsed document, or raise the 413 / 422 the contract specifies."""
    if document_bytes(raw) > MAX_DOCUMENT_BYTES:
        # * Size before structure: an oversized document is structurally invalid too, and the contract answers it with 413 rather than a list of field errors.
        raise AppError(
            ErrorCode.PAYLOAD_TOO_LARGE,
            f"A build document may not exceed {MAX_DOCUMENT_BYTES} bytes.",
            status_code=413,
        )

    try:
        document = BuildDocument.model_validate(raw)
    except ValidationError as exc:
        raise _invalid(
            [
                ErrorDetail(
                    path=location_to_path(("data", *error["loc"])), message=error["msg"]
                )
                for error in exc.errors()
            ]
        ) from None

    identity = _identity(document, game)
    if identity:
        # ! Stop here: every tier below indexes game.heroes by the ids this one just checked.
        raise _invalid(_deduplicate(identity))

    details = [
        *_ranges(document, game),
        *_episode(document, game),
        *_budgets(document, game),
        *_caps(document, game),
    ]

    if details:
        raise _invalid(_deduplicate(details))

    return document


def _identity(document: BuildDocument, game: GameData) -> list[ErrorDetail]:
    """Tier (ii): every hero id is one of the eleven, and the episode choices are real options."""
    details: list[ErrorDetail] = []

    if document.ec and document.ec not in game.ep3_cut_options:
        details.append(
            ErrorDetail(path="data.ec", message="Not an episode 3 cut option.")
        )

    if document.eh and document.eh not in game.ep4_hire_options:
        details.append(
            ErrorDetail(path="data.eh", message="Not an episode 4 hire option.")
        )

    for key in _HERO_KEYS:
        for hero in getattr(document, key):
            if hero not in game.heroes:
                details.append(
                    ErrorDetail(path=f"data.{key}.{hero}", message="Unknown hero.")
                )

    for index, hero in enumerate(document.fl):
        if hero not in game.heroes:
            details.append(
                ErrorDetail(path=f"data.fl[{index}]", message="Unknown hero.")
            )

    for index, entry in enumerate(document.mh):
        if (
            entry is not None
            and entry not in (_ILLUSION, _GOLEM_COPY)
            and entry not in game.heroes
        ):
            details.append(
                ErrorDetail(path=f"data.mh[{index}]", message="Unknown hero.")
            )

    return details


def _ranges(document: BuildDocument, game: GameData) -> list[ErrorDetail]:
    """Tier (iii): every value is inside the range its key allows."""
    details: list[ErrorDetail] = []
    stat_count = len(game.stat_names)

    for hero, points in document.lu.items():
        if len(points) != stat_count:
            details.append(
                ErrorDetail(
                    path=f"data.lu.{hero}",
                    message=f"Expected {stat_count} stats, in STAT_NAMES order.",
                )
            )
            continue

        for stat, value in zip(game.stat_names, points, strict=True):
            if value < 0:
                details.append(
                    ErrorDetail(
                        path=f"data.lu.{hero}.{stat}", message="Must be 0 or more."
                    )
                )

    for hero, level in document.bl.items():
        if not 1 <= level <= game.max_bonus_level_per_hero:
            details.append(
                ErrorDetail(
                    path=f"data.bl.{hero}",
                    message=f"Must be 1 to {game.max_bonus_level_per_hero}.",
                )
            )

    for hero, pair in document.pw.items():
        details.extend(_power_range(hero, pair, game))

    for hero, state in document.sp.items():
        details.extend(_special_range(document, hero, state, game))

    seen: set[str] = set()

    for index, hero in enumerate(document.fl):
        if hero not in game.flight_school_heroes:
            details.append(
                ErrorDetail(
                    path=f"data.fl[{index}]", message="Not a Flight School hero."
                )
            )
        elif hero in seen:
            details.append(
                ErrorDetail(path=f"data.fl[{index}]", message="Listed twice.")
            )

        seen.add(hero)

    details.extend(_mission_ranges(document, game))

    return details


def _mission_ranges(document: BuildDocument, game: GameData) -> list[ErrorDetail]:
    """Feature 015: template shapes, team-slot shape, and the two small settings."""
    details: list[ErrorDetail] = []

    if document.mt and len(document.mt) != _MISSION_TEMPLATES:
        details.append(
            ErrorDetail(
                path="data.mt",
                message=f"Expected all {_MISSION_TEMPLATES} templates.",
            )
        )
    else:
        for index, template in enumerate(document.mt):
            details.extend(
                _stat_values(f"data.mt[{index}].r", template.r, game)
            )

            # * Both condition columns may appear on any template, each holding at most
            # * one threshold (feature 015).
            for column, value_list in (("x", template.x), ("f", template.f)):
                if not value_list:
                    continue

                path = f"data.mt[{index}].{column}"

                details.extend(_stat_values(path, value_list, game))

                if sum(1 for value in value_list if value > 0) > 1:
                    details.append(
                        ErrorDetail(path=path, message="At most one threshold.")
                    )

    if document.mh and len(document.mh) != _MISSION_SLOTS:
        details.append(
            ErrorDetail(path="data.mh", message=f"Expected {_MISSION_SLOTS} slots.")
        )

    seen: set[str] = set()

    for index, entry in enumerate(document.mh):
        if entry is None or entry in (_ILLUSION, _GOLEM_COPY):
            continue

        if entry in seen:
            details.append(
                ErrorDetail(path=f"data.mh[{index}]", message="Listed twice.")
            )

        seen.add(entry)

    if not 0 <= document.ml <= _MAX_SYNERGY_LEVEL:
        details.append(
            ErrorDetail(
                path="data.ml", message=f"Must be 0 to {_MAX_SYNERGY_LEVEL}."
            )
        )

    if not 0 <= document.ma <= _MISSION_TEMPLATES - 1:
        details.append(
            ErrorDetail(
                path="data.ma", message=f"Must be 0 to {_MISSION_TEMPLATES - 1}."
            )
        )

    return details


def _stat_values(path: str, values: list[int], game: GameData) -> list[ErrorDetail]:
    """A per-stat value list: STAT_NAMES order, every value 0 to the stat maximum."""
    if len(values) != len(game.stat_names):
        return [
            ErrorDetail(
                path=path,
                message=f"Expected {len(game.stat_names)} stats, in STAT_NAMES order.",
            )
        ]

    return [
        ErrorDetail(
            path=f"{path}.{stat}", message=f"Must be 0 to {game.max_stat_value}."
        )
        for stat, value in zip(game.stat_names, values, strict=True)
        if not 0 <= value <= game.max_stat_value
    ]


def _power_range(hero: str, pair: list[int], game: GameData) -> list[ErrorDetail]:
    path = f"data.pw.{hero}"

    if len(pair) != 2 or pair[0] not in (0, 1) or pair[1] not in (0, 1, 2):
        return [ErrorDetail(path=path, message="Expected [0 or 1, 0 or 1 or 2].")]

    revealed, trained = pair

    if trained > game.heroes[hero].trainable_powers:
        return [
            ErrorDetail(path=path, message="This hero has no such trainable power.")
        ]

    if trained > 0 and revealed == 0:
        # * The interface only offers a trainable power once the starting one is revealed.
        return [
            ErrorDetail(
                path=path,
                message="A power cannot be trained before the starting power is revealed.",
            )
        ]

    return []


def _special_range(
    document: BuildDocument, hero: str, state: int, game: GameData
) -> list[ErrorDetail]:
    path = f"data.sp.{hero}"
    special = game.special_powers.get(hero)

    if special is None:
        return [ErrorDetail(path=path, message="This hero has no special power.")]

    if not 0 <= state <= special.max:
        return [ErrorDetail(path=path, message=f"Must be 0 to {special.max}.")]

    if (
        state > 0
        and special.requires_trainable is not None
        and document.trained_slot(hero) != special.requires_trainable
    ):
        return [
            ErrorDetail(
                path=path, message="Requires its upgrade power to be trained first."
            )
        ]

    return []


def _episode(document: BuildDocument, game: GameData) -> list[ErrorDetail]:
    """The episode rules: who is on the roster, and what a recruit may hold."""
    details: list[ErrorDetail] = []
    cut = document.ec or game.default_ep3_cut
    hired = document.eh or game.default_ep4_hire
    # * A recruit is Blonde Blazer, plus whichever episode 4 option was not hired.
    recruits = game.always_recruited | (game.ep4_hire_options - {hired})

    for key in _HERO_KEYS:
        for hero in getattr(document, key):
            path = f"data.{key}.{hero}"

            if hero == cut:
                details.append(
                    ErrorDetail(path=path, message="The cut hero holds no state.")
                )
            elif key in ("lu", "bl") and hero in game.fixed_level_heroes:
                details.append(
                    ErrorDetail(
                        path=path, message="A fixed-level hero cannot level up."
                    )
                )
            elif hero in recruits and _recruit_is_training(document, key, hero):
                details.append(
                    ErrorDetail(path=path, message="A recruit cannot train.")
                )

    for index, hero in enumerate(document.fl):
        path = f"data.fl[{index}]"

        if hero == cut:
            details.append(
                ErrorDetail(path=path, message="The cut hero holds no state.")
            )
        elif hero in recruits:
            details.append(ErrorDetail(path=path, message="A recruit cannot train."))

    # * Feature 015: the cut hero has no card anywhere, the mission team included. Recruits
    # * may be on the team — the e8 flag only governs display, exactly as with allocations.
    for index, entry in enumerate(document.mh):
        if entry == cut:
            details.append(
                ErrorDetail(
                    path=f"data.mh[{index}]", message="The cut hero holds no state."
                )
            )

    return details


def _recruit_is_training(document: BuildDocument, key: str, hero: str) -> bool:
    """Whether this entry is training, which a recruit may not do.

    Revealing a starting power is not training — it is what any hero on the roster does by
    triggering the power's condition, and for Blonde Blazer it is the only thing she has. The
    planner renders that toggle on a recruit's card, so a document holding `[1, 0]` is one a
    player really made. Training, `[_, 1]` or `[_, 2]`, is what episode 8 puts out of reach.
    """
    if key == "pw":
        return document.trained_slot(hero) > 0

    return key == "sp"


def _budgets(document: BuildDocument, game: GameData) -> list[ErrorDetail]:
    """Tier (iv): the team-wide and per-hero budgets."""
    details: list[ErrorDetail] = []

    if sum(document.bl.values()) > game.max_bonus_points:
        details.append(
            ErrorDetail(
                path="data.bl",
                message=f"At most {game.max_bonus_points} bonus levels across the team.",
            )
        )

    trained = sum(1 for hero in document.pw if document.trained_slot(hero) > 0)

    if trained > game.max_power_trainings:
        details.append(
            ErrorDetail(
                path="data.pw",
                message=f"At most {game.max_power_trainings} powers trained.",
            )
        )

    if len(set(document.fl)) > game.max_flight_trainings:
        details.append(
            ErrorDetail(
                path="data.fl",
                message=f"At most {game.max_flight_trainings} flight trainings.",
            )
        )

    for hero, points in document.lu.items():
        if len(points) != len(game.stat_names):
            # * Already reported by the ranges tier; summing a malformed row would say nothing new.
            continue

        allowed = game.max_level_ups + document.bl.get(hero, 0)

        if sum(points) > allowed:
            details.append(
                ErrorDetail(
                    path=f"data.lu.{hero}",
                    message=f"At most {allowed} level-ups for this hero.",
                )
            )

    return details


def _caps(document: BuildDocument, game: GameData) -> list[ErrorDetail]:
    """Tier (v): a hero's starting stat plus its level-ups never passes the cap."""
    details: list[ErrorDetail] = []

    for hero, points in document.lu.items():
        if len(points) != len(game.stat_names):
            continue

        for stat, start, added in zip(
            game.stat_names, game.heroes[hero].starting_stats, points, strict=True
        ):
            if start + added > game.max_stat_value:
                details.append(
                    ErrorDetail(
                        path=f"data.lu.{hero}.{stat}",
                        message=f"{stat} cannot exceed {game.max_stat_value}.",
                    )
                )

    return details
