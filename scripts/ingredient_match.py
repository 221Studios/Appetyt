"""Porównanie list składników 1:1 (MVP źródło)."""

from __future__ import annotations


def normalize_ingredient_line(text: str) -> str:
    """Identyczny tekst po złożeniu białych znaków (kolejność linii osobno)."""
    return " ".join((text or "").split())


def normalize_ingredient_list(lines: list[str] | None) -> list[str]:
    return [normalize_ingredient_line(x) for x in (lines or []) if normalize_ingredient_line(x)]


def ingredients_match_exact(stored: list[str] | None, live: list[str] | None) -> dict:
    """Dokładne 1:1: ta sama długość i ta sama treść w tej samej kolejności."""
    a = normalize_ingredient_list(stored)
    b = normalize_ingredient_list(live)
    equal = a == b
    first_diff: dict | None = None
    if not equal:
        limit = max(len(a), len(b))
        for i in range(limit):
            left = a[i] if i < len(a) else None
            right = b[i] if i < len(b) else None
            if left != right:
                first_diff = {"index": i, "stored": left, "live": right}
                break
    return {
        "match": equal,
        "stored_count": len(a),
        "live_count": len(b),
        "first_diff": first_diff,
    }
