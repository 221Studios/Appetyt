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
    "glowka": "szt",
    "główka": "szt",
    "glowki": "szt",
    "główki": "szt",
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
    "lyzek": "łyżka",
    "łyżek": "łyżka",
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
    r"tablespoons?|teaspoons?|tbsp|tbs|tsp|łyżeczki|łyżeczka|łyżeczek|łyżeczkę|"
    r"łyżki|łyżka|łyżek|łyżkę|lyzek|"
    r"cups?|szklanki|szklanka|"
    r"szt(?:uki|uka|\.)?|pieces?|cloves?|ząbki|zabki|ząbek|zabek|główki|główka|glowki|glowka|"
    r"slices?|rashers?|eggs?|l"
)

LEADING_RE = re.compile(
    rf"^(?P<num>\d+(?:[.,]\d+)?)?(?P<frac>[½¼¾⅓⅔⅛])?\s*"
    rf"(?P<unit>{UNIT_ALT})?\b\s*",
    re.IGNORECASE,
)
RANGE_RE = re.compile(
    rf"^(?P<a>\d+(?:[.,]\d+)?)\s*[-–]\s*(?P<b>\d+(?:[.,]\d+)?)\s*"
    rf"(?P<unit>{UNIT_ALT})?\b\s*(?P<rest>.*)$",
    re.IGNORECASE,
)
ASCII_FRAC_RE = re.compile(
    rf"^(?:(?P<whole>\d+)\s+)?(?P<num>\d+)\s*/\s*(?P<den>\d+)\s*"
    rf"(?P<unit>{UNIT_ALT})?\b\s*(?P<rest>.*)$",
    re.IGNORECASE,
)
PAREN_RE = re.compile(r"\([^)]*\)")
PAREN_GRAMS_RE = re.compile(
    r"\((?:about\s+|approx\.?\s+)?(\d+[.,]?\d*)\s*g\)",
    re.IGNORECASE,
)
PREP_SUFFIX_RE = re.compile(
    r",\s*(?:beaten|chopped|diced|minced|sliced|crushed|grated|peeled|"
    r"softened|melted|divided|to taste|optional)\b.*$",
    re.IGNORECASE,
)


def _number(num: str | None, frac: str | None) -> float | None:
    value = 0.0
    if num:
        value += float(num.replace(",", "."))
    if frac:
        value += FRACTIONS.get(frac, 0.0)
    return value or None


def _clean_name(text: str) -> str:
    text = PAREN_RE.sub(" ", text)
    text = PREP_SUFFIX_RE.sub("", text)
    text = re.sub(r"\s+", " ", text).strip(" ,.*")
    words = text.split()
    while words and words[0].lower() in SIZE_WORDS:
        words.pop(0)
    cleaned = " ".join(words).strip(" ,.*")
    return cleaned or text.strip(" ,.*")


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
    vague = re.match(
        r"^(?P<q>kilka|kilku|par[eę]|odrobin[aę]|szczypta|gar[sś][cć])\s+(?P<rest>.+)$",
        text,
        re.IGNORECASE,
    )
    if vague:
        qty = {
            "kilka": 3,
            "kilku": 3,
            "pare": 2,
            "parę": 2,
            "odrobina": 1,
            "odrobinę": 1,
            "szczypta": 1,
            "garsc": 1,
            "garść": 1,
        }.get(vague.group("q").lower(), 3)
        text = f"{qty} {vague.group('rest')}"
    glued = re.match(
        r"^(?P<num>\d+(?:[.,]\d+)?)(?P<frac>[½¼¾⅓⅔⅛])?(?P<unit>kg|g|ml|l)\b\s*(?P<rest>.*)$",
        text,
        re.IGNORECASE,
    )
    unit = None
    amount = None
    rest = text
    range_match = RANGE_RE.match(text)
    if range_match:
        a = float(range_match.group("a").replace(",", "."))
        b = float(range_match.group("b").replace(",", "."))
        amount = (a + b) / 2.0
        rest = range_match.group("rest")
        raw_unit = range_match.group("unit") or ""
        canon, factor = _canon_unit(raw_unit) if raw_unit else (None, 1.0)
        if canon in {"g", "ml"}:
            amount = round(amount * factor, 4)
        unit = canon if canon else "szt"
        # fall through to name clean below via shared return path
        name = _clean_name(rest)
        if amount is not None and unit:
            amount_text = (
                f"{range_match.group('a')}–{range_match.group('b')}"
                f" {raw_unit or unit}"
            ).strip()
        return {
            "name": name or text,
            "amount_value": amount,
            "unit": unit,
            "amount_text": amount_text,
            "scalable": True,
        }
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
    paren_g = PAREN_GRAMS_RE.search(raw or text)
    if paren_g:
        amount = float(paren_g.group(1).replace(",", "."))
        unit = "g"
    if unit == "szt" and re.search(r"drożdż|drozdz|proszku do pieczenia", name, re.IGNORECASE):
        # A few source lines omit the unit in the conventional "9,5 g yeast"
        # notation.  Keep this narrow so ordinary count ingredients remain pcs.
        unit = "g"
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


_OPERATIONAL_ACTIONS = (
    (r"\b(?:dodaj|dodawać|wlej|wle[jź]|wbij)\b", "Dodaj wskazane składniki."),
    (r"\b(?:wymieszaj|mieszaj|wymieszać)\b", "Wymieszaj składniki."),
    (r"\b(?:zblenduj|blenduj|zmiksuj|zmiksować)\b", "Zblenduj składniki na gładko."),
    (r"\b(?:smaż|smazyc|smażymy)\b", "Smaż do uzyskania wskazanego efektu."),
    (r"\b(?:gotuj|zagotuj|ugotuj)\b", "Gotuj zgodnie z podanym czasem."),
    (r"\b(?:piecz|wypiekaj)\b", "Piecz zgodnie z podaną temperaturą i czasem."),
    (r"\b(?:pokrój|pokroj|posiekaj|obierz)\b", "Pokrój i przygotuj składniki."),
    (r"\b(?:odstaw|pozostaw|schłodź|wystudź|ostudź)\b", "Odstaw do odpoczynku lub wystudzenia."),
    (r"\b(?:podawaj|serwuj)\b", "Podawaj po zakończeniu przygotowania."),
)
_TIME_RE = re.compile(r"\b(\d+(?:[.,]\d+)?)\s*(?:min(?:ut)?|godzin(?:ę|y)?)\b", re.IGNORECASE)
_TEMP_RE = re.compile(r"\b(\d{2,3})\s*(?:°\s*)?(?:c|stopni)\b", re.IGNORECASE)


def _operational_instruction(text: str) -> str:
    actions: list[str] = []
    for pattern, instruction in _OPERATIONAL_ACTIONS:
        if re.search(pattern, text, re.IGNORECASE) and instruction not in actions:
            actions.append(instruction)
    if not actions:
        actions.append("Wykonaj etap zgodnie z kolejnością źródła.")
    details: list[str] = []
    time_match = _TIME_RE.search(text)
    if time_match:
        details.append(f"Czas: {time_match.group(1)} min.")
    temperature_match = _TEMP_RE.search(text)
    if temperature_match:
        details.append(f"Temperatura: {temperature_match.group(1)}°C.")
    return " ".join(actions + details)


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
    for index, raw in enumerate(source_steps, start=1):
        steps.append(
            {
                "step_number": index,
                "title": _step_title(str(raw), index),
                "instructions": _operational_instruction(str(raw)),
                "duration_minutes": None,
            }
        )
    return steps
