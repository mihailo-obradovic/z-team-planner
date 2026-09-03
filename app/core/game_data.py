"""The game-data fixture the server validates saved builds against.

Generated from `web/types/hero.ts` by `pnpm run game-data:export` and never edited by hand:
game data has one source (feature 005, Invariants). `test/unit/game-data.test.ts` fails
whenever the committed fixture and a fresh export disagree.
"""

import json
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

# * Two levels up from app/core/ is the repository root, where shared/ lives beside app/ and web/.
FIXTURE_PATH = Path(__file__).resolve().parents[2] / "shared" / "game-data.json"


@dataclass(frozen=True)
class HeroData:
    """One hero's validation-relevant facts."""

    starting_stats: tuple[int, ...]
    # * How many trainable options the hero has: two, or none for an episode 8 arrival.
    trainable_powers: int


@dataclass(frozen=True)
class SpecialPower:
    max: int
    # * The trainable slot that must be trained first, or None when the power needs nothing.
    requires_trainable: int | None


@dataclass(frozen=True)
class GameData:
    stat_names: tuple[str, ...]
    max_stat_value: int
    max_level_ups: int
    max_bonus_points: int
    max_bonus_level_per_hero: int
    max_power_trainings: int
    max_flight_trainings: int
    ep3_cut_options: frozenset[str]
    ep4_hire_options: frozenset[str]
    default_ep3_cut: str
    default_ep4_hire: str
    fixed_level_heroes: frozenset[str]
    flight_school_heroes: frozenset[str]
    special_powers: dict[str, SpecialPower]
    heroes: dict[str, HeroData]
    # * Blonde Blazer arrives in episode 8 whatever the player chose, so she is always a recruit; the other is whichever episode 4 option was not hired.
    always_recruited: frozenset[str]


def load_game_data(path: Path = FIXTURE_PATH) -> GameData:
    """Read the fixture into a frozen structure. Raises if it is missing or malformed."""
    raw = json.loads(path.read_text(encoding="utf-8"))

    return GameData(
        stat_names=tuple(raw["stat_names"]),
        max_stat_value=raw["max_stat_value"],
        max_level_ups=raw["max_level_ups"],
        max_bonus_points=raw["max_bonus_points"],
        max_bonus_level_per_hero=raw["max_bonus_level_per_hero"],
        max_power_trainings=raw["max_power_trainings"],
        max_flight_trainings=raw["max_flight_trainings"],
        ep3_cut_options=frozenset(raw["ep3_cut_options"]),
        ep4_hire_options=frozenset(raw["ep4_hire_options"]),
        default_ep3_cut=raw["default_ep3_cut"],
        default_ep4_hire=raw["default_ep4_hire"],
        fixed_level_heroes=frozenset(raw["fixed_level_heroes"]),
        flight_school_heroes=frozenset(raw["flight_school_heroes"]),
        special_powers={
            hero: SpecialPower(
                max=spec["max"], requires_trainable=spec.get("requires_trainable")
            )
            for hero, spec in raw["special_powers"].items()
        },
        heroes={
            hero: HeroData(
                starting_stats=tuple(spec["starting_stats"]),
                trainable_powers=spec["trainable_powers"],
            )
            for hero, spec in raw["heroes"].items()
        },
        always_recruited=frozenset(raw["always_recruited"]),
    )


@lru_cache
def get_game_data() -> GameData:
    """The process-wide game data, read once."""
    return load_game_data()
