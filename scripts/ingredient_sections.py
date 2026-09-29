"""Detect and preserve semantic sections inside a recipe ingredient list."""

from __future__ import annotations

import re
from typing import Any

_LEADING_AMOUNT_RE = re.compile(
    r"^(?:\d+(?:[.,]\d+)?|[½¼¾⅓⅔⅛]|\d+\s*/\s*\d+|"
    r"(?:a|an|one|two|three|four|five|half|quarter|kilka|kilku|szczypta|garść|garsc))\b",
    re.IGNORECASE,
)
_SECTION_PREFIX_RE = re.compile(
    r"^(?:for(?: the)?\b|to serve\b|sauce\b|bun(?:s)?\b|patty\b|patties\b|"
    r"meat\b|filling\b|topping\b|dressing\b|marinade\b|assembly\b|"
    r"garnish\b|glaze\b|seasoning\b|base\b|dough\b|cream\b|ganache\b|"
    r"frosting\b|crust\b|rice\b|salad\b|slaw\b|pickles?\b|"
    r"sos\b|bułk(?:a|i)\b|mięso\b|nadzienie\b|polewa\b|marynata\b|"
    r"dressing\b|dekoracja\b|lukier\b|ciasto\b)",
    re.IGNORECASE,
)
_NON_INGREDIENT_RE = re.compile(
    r"(?:^shop\b|shop\s+jamie|barbecue\s+kit|weber\b|serveware|"
    r"tongs?\b|spatula\b|roasting tray|griddle press|choose your flavour|"
    r"^plugin$|^functions$|^public methods$|^scroll event$|^underscore\.js\b|"
    r"^https?://|^www\.|^\(c\)|^break;$|^default:$|^case\s+['\"]|"
    r"^const\s+|^recipeData\.|^strona główna$|^pierwszy raz\??$|"
    r"^moje książki$|^współpraca$|^kontakt$|^o mnie$|^poradnik\b|"
    r"^kuchenne porady\b|^roślinne żywienie$|^specjalne okazje\b|"
    r"^boże narodzenie$|^tłusty czwartek$|^wielkanoc$|"
    r"^wegańskie kompendium$|^10\+ pomysłów\b|^throttle function borrowed from:\s*|"
    r"^for us cup measures\b|^to serve,\s|^bring the pan\b|"
    r"^top up with\b|^using a slotted spoon\b|^be careful when\b|"
    r"^cook the\b|^meanwhile,\s|^whisk in\b|^keep the\b|"
    r"^spoon on\b|^your comment has been submitted\b|^copyright\b)",
    re.IGNORECASE,
)


def _clean(text: object) -> str:
    return " ".join(str(text or "").split()).strip()


def _is_upper_heading(text: str) -> bool:
    letters = "".join(character for character in text if character.isalpha())
    if len(letters) < 3 or len(text.split()) < 1:
        return False
    return sum(character.isupper() for character in letters) / len(letters) >= 0.85


def is_non_ingredient_line(text: str) -> bool:
    return bool(_NON_INGREDIENT_RE.search(_clean(text)))


def is_section_heading(text: str) -> bool:
    """Return true only for conservative, human-readable section headings."""
    cleaned = _clean(text)
    if not cleaned or is_non_ingredient_line(cleaned):
        return False
    if _LEADING_AMOUNT_RE.match(cleaned):
        return False
    if cleaned.endswith(":") or _is_upper_heading(cleaned):
        return True
    return bool(_SECTION_PREFIX_RE.match(cleaned))


def ingredient_structure(lines: list[str] | None) -> dict[str, Any]:
    """Classify raw lines without changing their source text or order.

    ``groups`` contains only usable ingredient lines. The original raw list is
    retained by the caller, while ``source_index`` makes every group traceable
    back to that unchanged list. Non-food CTA/equipment lines are reported in
    ``ignored`` instead of leaking into shopping lists.
    """
    groups: list[dict[str, Any]] = []
    ignored: list[dict[str, Any]] = []
    current: dict[str, Any] | None = None

    for source_index, raw_line in enumerate(lines or []):
        text = _clean(raw_line)
        if not text:
            continue
        if is_non_ingredient_line(text):
            ignored.append({"source_index": source_index, "text": text})
            continue
        if is_section_heading(text):
            current = {"title": text, "source_indexes": [], "items": []}
            groups.append(current)
            continue
        if current is None:
            current = {"title": None, "source_indexes": [], "items": []}
            groups.append(current)
        current["source_indexes"].append(source_index)
        current["items"].append(text)

    return {
        "groups": [group for group in groups if group["items"]],
        "ignored": ignored,
    }


def group_ingredient_lines(lines: list[str] | None) -> list[dict[str, Any]]:
    """Convenience interface used by recipe and shopping-list consumers."""
    return ingredient_structure(lines)["groups"]
