"""Werdykt przepisu kompletnego — zewnętrzna bramka jakości snapshotu.

Osobna od `scripts.app_recipe.is_app_ready` (luźny próg ratio mapowania).
"""

from __future__ import annotations

from typing import Any, Mapping


NUTRITION_REQUIRED = (
    "calories_total",
    "calories_per_serving",
    "protein_per_serving",
    "fat_per_serving",
    "carbs_per_serving",
)


def completeness_verdict(recipe: Mapping[str, Any]) -> dict[str, Any]:
    """Zwraca ``{"complete": bool, "reasons": list[str]}``.

    Oczekiwany kształt wejścia (znormalizowany snapshot + mapowania + wycena)::

        {
          "source_steps": [str, ...],
          "source_ingredient_count": int,
          "lines": [
            {
              "name": str,
              "ingredient_id": int | None,
              "amount_g": float | None,
              "stores_with_product": [store_slug, ...],
            },
            ...
          ],
          "nutrition": {
            "calories_total": float | None,
            "calories_per_serving": float | None,
            "protein_per_serving": float | None,
            "fat_per_serving": float | None,
            "carbs_per_serving": float | None,
          },
        }

    Kompletny = kroki źródłowe, liczba linii jak w źródle, każda linia → USDA + gramy,
    ≥1 sklep pokrywa wszystkie linie (produkt lub substytut), nutrition suma + per serving.
    """
    reasons: list[str] = []

    steps = recipe.get("source_steps") or []
    if not steps:
        reasons.append("missing_source_steps")

    lines = list(recipe.get("lines") or [])
    if not lines:
        reasons.append("no_ingredient_lines")

    expected = recipe.get("source_ingredient_count")
    if expected is not None and int(expected) != len(lines):
        reasons.append("line_count_mismatch")

    for line in lines:
        name = str(line.get("name") or "").strip() or "?"
        if line.get("ingredient_id") is None:
            reasons.append(f"unmapped_usda:{name}")
        if line.get("amount_g") is None:
            reasons.append(f"missing_grams:{name}")

    if lines and not _has_full_store_coverage(lines):
        reasons.append("no_full_store_coverage")

    nutrition = recipe.get("nutrition") or {}
    for key in NUTRITION_REQUIRED:
        if nutrition.get(key) is None:
            reasons.append(f"missing_nutrition_{key}")

    return {"complete": not reasons, "reasons": reasons}


def _has_full_store_coverage(lines: list[Mapping[str, Any]]) -> bool:
    store_sets = [
        set(line.get("stores_with_product") or [])
        for line in lines
    ]
    if not store_sets:
        return False
    common: set[str] | None = None
    for stores in store_sets:
        common = stores if common is None else common & stores
    return bool(common)
