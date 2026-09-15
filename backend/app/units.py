from __future__ import annotations

from typing import Literal

UnitKind = Literal["mass", "volume", "piece"]

_UNIT_FACTORS: dict[str, tuple[float, UnitKind]] = {
    "g": (1.0, "mass"),
    "gram": (1.0, "mass"),
    "gramy": (1.0, "mass"),
    "kg": (1000.0, "mass"),
    "kilogram": (1000.0, "mass"),
    "kilograms": (1000.0, "mass"),
    "ml": (1.0, "volume"),
    "milliliter": (1.0, "volume"),
    "mililitr": (1.0, "volume"),
    "l": (1000.0, "volume"),
    "liter": (1000.0, "volume"),
    "litre": (1000.0, "volume"),
    "litr": (1000.0, "volume"),
    "szt": (1.0, "piece"),
    "sztuka": (1.0, "piece"),
    "sztuki": (1.0, "piece"),
    "piece": (1.0, "piece"),
    "pieces": (1.0, "piece"),
}


def normalize_amount(value: float, unit: str | None) -> tuple[float, UnitKind] | None:
    if not unit:
        return None
    normalized = unit.lower().strip().replace(".", "")
    factor_and_kind = _UNIT_FACTORS.get(normalized)
    if factor_and_kind is None:
        return None
    factor, kind = factor_and_kind
    return value * factor, kind
