"""Parse a recipe ingredient line into amount, unit, and name."""

from __future__ import annotations

import hashlib
import re
from urllib.parse import urlparse

FRACTIONS = {
    "½": 0.5,
    "¼": 0.25,
    "¾": 0.75,
    "⅓": 1 / 3,
    "⅔": 2 / 3,
    "⅛": 0.125,
}

SIZE_WORDS = {
    "large",
    "small",
    "medium",
    "fresh",
    "leftover",
    "unsalted",
    "salted",
    "free-range",
    "free range",
    "heaped",
    "level",
    "nice",
    "a",
    "an",
    "of",
    "duza",
    "duża",
    "mala",
    "mała",
    "srednia",
    "średnia",
    "swieza",
    "świeża",
}

MASS_UNITS = {
    "g": ("g", 1.0),
    "gram": ("g", 1.0),
    "grams": ("g", 1.0),
    "gr": ("g", 1.0),
    "kg": ("g", 1000.0),
    "kilogram": ("g", 1000.0),
    "oz": ("g", 28.35),
    "lb": ("g", 453.6),
}
VOLUME_UNITS = {
    "ml": ("ml", 1.0),
    "milliliter": ("ml", 1.0),
    "millilitre": ("ml", 1.0),
    "l": ("ml", 1000.0),
    "liter": ("ml", 1000.0),
    "litre": ("ml", 1000.0),
    "litr": ("ml", 1000.0),
}
PIECE_UNITS = {
    "szt": "szt",
    "sztuka": "szt",
    "sztuki": "szt",
    "piece": "szt",
    "pieces": "szt",
    "clove": "szt",
    "cloves": "szt",
    "zabek": "szt",
    "ząbek": "szt",
    "zabki": "szt",
    "ząbki": "szt",
    "slice": "szt",
    "slices": "szt",
    "rasher": "szt",
    "rashers": "szt",
    "egg": "szt",
    "eggs": "szt",
    "jajko": "szt",
    "jajka": "szt",
}
SPOON_UNITS = {
    "tablespoon": "łyżka",
    "tablespoons": "łyżka",
    "tbsp": "łyżka",
    "tbs": "łyżka",
    "lyzka": "łyżka",
    "łyżka": "łyżka",
    "łyżki": "łyżka",
    "lyzki": "łyżka",
    "teaspoon": "łyżeczka",
    "teaspoons": "łyżeczka",
    "tsp": "łyżeczka",
    "lyzeczka": "łyżeczka",
    "łyżeczka": "łyżeczka",
    "łyżeczki": "łyżeczka",
}
CUP_UNITS = {
    "cup": "cup",
    "cups": "cup",
    "szklanka": "cup",
    "szklanki": "cup",
}

UNIT_ALT = (
    r"kg|grams?|gr|g|oz|lb|ml|litres?|liters?|litr(?:y|ow|ów)?|"
    r"tablespoons?|teaspoons?|tbsp|tbs|tsp|łyżeczki|łyżeczka|łyżki|łyżka|"
    r"cups?|szklanki|szklanka|"
    r"szt(?:uki|uka|\.)?|pieces?|cloves?|ząbki|zabki|ząbek|zabek|"
    r"slices?|rashers?|eggs?|l"
)

LEADING_RE = re.compile(
    rf"^(?P<num>\d+(?:[.,]\d+)?)?(?P<frac>[½¼¾⅓⅔⅛])?\s*"
    rf"(?P<unit>{UNIT_ALT})?\b\s*",
    re.IGNORECASE,
)
ASCII_FRAC_RE = re.compile(
    rf"^(?:(?P<whole>\d+)\s+)?(?P<num>\d+)\s*/\s*(?P<den>\d+)\s*"
    rf"(?P<unit>{UNIT_ALT})?\b\s*(?P<rest>.*)$",
    re.IGNORECASE,
)
PAREN_RE = re.compile(r"\([^)]*\)")


def _number(num: str | None, frac: str | None) -> float | None:
    value = 0.0
    if num:
        value += float(num.replace(",", "."))
    if frac:
        value += FRACTIONS.get(frac, 0.0)
    return value or None


def _clean_name(text: str) -> str:
    text = PAREN_RE.sub(" ", text)
    text = re.sub(r"\s+", " ", text).strip(" ,.")
    words = text.split()
    while words and words[0].lower() in SIZE_WORDS:
        words.pop(0)
    return " ".join(words).strip() or text.strip()


def _canon_unit(raw_unit: str) -> tuple[str | None, float]:
    raw_unit = raw_unit.lower().rstrip(".")
    if raw_unit in MASS_UNITS:
        canon, factor = MASS_UNITS[raw_unit]
        return canon, factor
    if raw_unit in VOLUME_UNITS:
        canon, factor = VOLUME_UNITS[raw_unit]
        return canon, factor
    if raw_unit in PIECE_UNITS:
        return PIECE_UNITS[raw_unit], 1.0
    if raw_unit in SPOON_UNITS:
        return SPOON_UNITS[raw_unit], 1.0
    if raw_unit in CUP_UNITS:
        return CUP_UNITS[raw_unit], 1.0
    return None, 1.0


def parse_ingredient_line(raw: str) -> dict:
    text = (raw or "").strip()
    amount_text = text
    glued = re.match(
        r"^(?P<num>\d+(?:[.,]\d+)?)(?P<frac>[½¼¾⅓⅔⅛])?(?P<unit>kg|g|ml|l)\b\s*(?P<rest>.*)$",
        text,
        re.IGNORECASE,
    )
    unit = None
    amount = None
    rest = text
    ascii_frac = ASCII_FRAC_RE.match(text)
    if ascii_frac and int(ascii_frac.group("den")) != 0:
        amount = int(ascii_frac.group("num")) / int(ascii_frac.group("den"))
        if ascii_frac.group("whole"):
            amount += int(ascii_frac.group("whole"))
        rest = ascii_frac.group("rest")
        raw_unit = ascii_frac.group("unit") or ""
        canon, factor = _canon_unit(raw_unit) if raw_unit else (None, 1.0)
        if canon in {"g", "ml"}:
            amount = round(amount * factor, 4)
        unit = canon if canon else ("szt" if not raw_unit else None)
        if not canon and not raw_unit:
            unit = "szt"
    elif glued:
        amount = _number(glued.group("num"), glued.group("frac"))
        raw_unit = glued.group("unit").lower()
        rest = glued.group("rest")
        if raw_unit in MASS_UNITS:
            canon, factor = MASS_UNITS[raw_unit]
            amount = round(amount * factor, 2) if amount is not None else None
            unit = canon
        elif raw_unit in VOLUME_UNITS:
            canon, factor = VOLUME_UNITS[raw_unit]
            amount = round(amount * factor, 2) if amount is not None else None
            unit = canon
    else:
        match = LEADING_RE.match(text)
        if match and (match.group("num") or match.group("frac")):
            amount = _number(match.group("num"), match.group("frac"))
            rest = text[match.end() :].strip()
            raw_unit = match.group("unit") or ""
            canon, factor = _canon_unit(raw_unit) if raw_unit else (None, 1.0)
            if canon in {"g", "ml"}:
                amount = round((amount or 0) * factor, 2)
            unit = canon
            if amount is not None and not raw_unit:
                unit = "szt"
    name = _clean_name(rest)
    if amount is not None and unit:
        pretty = int(amount) if float(amount).is_integer() else amount
        amount_text = f"{pretty} {unit}"
    elif amount is not None:
        pretty = int(amount) if float(amount).is_integer() else amount
        amount_text = str(pretty)
    return {
        "name": name or text,
        "amount_value": amount,
        "unit": unit,
        "amount_text": amount_text,
        "scalable": True,
    }


def parse_servings(recipe_yield: str | None) -> int | None:
    if not recipe_yield:
        return None
    match = re.search(r"(\d+)", str(recipe_yield))
    if not match:
        return None
    value = int(match.group(1))
    if value < 1 or value > 48:
        return None
    return value


def recipe_id(creator_id: str | None, source_url: str) -> str:
    host = urlparse(source_url).netloc.replace("www.", "")
    prefix = re.sub(r"[^a-z0-9]+", "-", (creator_id or host or "recipe").lower()).strip("-")
    digest = hashlib.sha1(source_url.encode("utf-8")).hexdigest()[:12]
    return f"{prefix}-{digest}"[:120]


def _step_title(text: str, index: int) -> str:
    first = re.split(r"[.!?\n]", text.strip())[0]
    words = first.split()
    title = " ".join(words[:6]).strip(" ,;")
    if len(title) > 48:
        title = title[:45].rstrip() + "…"
    return title or f"Krok {index}"


def operational_steps(source_steps: list[str] | None) -> list[dict]:
    if not source_steps:
        return [
            {
                "step_number": 1,
                "title": "Gotuj według źródła",
                "instructions": "Pełna instrukcja jest w źródle przepisu.",
                "duration_minutes": None,
            }
        ]
    steps = []
    for index, raw in enumerate(source_steps[:12], start=1):
        steps.append(
            {
                "step_number": index,
                "title": _step_title(str(raw), index),
                "instructions": "Szczegóły w źródle przepisu.",
                "duration_minutes": None,
            }
        )
    return steps
