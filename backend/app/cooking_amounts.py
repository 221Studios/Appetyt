"""Approximate culinary weights. Used for kcal and for usage vs basket cost.

Piece foods (1 onion, 1/2 onion) get a typical gram weight.
Shopping still rounds up to a whole piece when the shop sells pieces.
"""

from __future__ import annotations

import unicodedata

# Typical edible weight of 1 piece. Medium onion ~110 g (USDA household).
PIECE_G: dict[str, float] = {
    "onion": 110,
    "onions": 110,
    "cebula": 110,
    "garlic": 3,
    "czosnek": 3,
    "clove": 3,
    "zabek": 3,
    "egg": 50,
    "eggs": 50,
    "jajko": 50,
    "jajka": 50,
    "tomato": 123,
    "tomatoes": 123,
    "pomidor": 123,
    "pomidory": 123,
    "potato": 170,
    "potatoes": 170,
    "ziemniak": 170,
    "ziemniaki": 170,
    "carrot": 61,
    "carrots": 61,
    "marchew": 61,
    "lemon": 58,
    "cytryna": 58,
    "apple": 182,
    "apples": 182,
    "jablko": 182,
    "jablka": 182,
    "slice": 30,
    "bread": 30,
    "chleb": 30,
    "rasher": 25,
    "bacon": 25,
    "boczek": 25,
}

SPOON_G: dict[str, tuple[float, float]] = {
    "butter": (14.0, 5.0),
    "maslo": (14.0, 5.0),
    "oil": (13.5, 4.5),
    "oliwa": (13.5, 4.5),
    "olej": (13.5, 4.5),
    "sugar": (12.5, 4.0),
    "cukier": (12.5, 4.0),
    "flour": (8.0, 2.6),
    "maka": (8.0, 2.6),
    "honey": (21.0, 7.0),
    "miod": (21.0, 7.0),
    "salt": (18.0, 6.0),
    "sol": (18.0, 6.0),
    "soy": (16.0, 5.0),
    "vanilla": (4.2, 4.2),
    "sesame": (13.5, 4.5),
    "vinegar": (15.0, 5.0),
    "ocet": (15.0, 5.0),
    "cornstarch": (8.0, 2.7),
    "oyster": (18.0, 6.0),
    "fish": (18.0, 6.0),
    "lemon": (15.0, 5.0),
    "cinnamon": (2.6, 2.6),
    "paprika": (2.3, 2.3),
    "mustard": (15.0, 5.0),
}

SIZE_FACTOR = {
    "small": 70 / 110,
    "mala": 70 / 110,
    "medium": 1.0,
    "srednia": 1.0,
    "large": 150 / 110,
    "duza": 150 / 110,
}


def fold(text: str) -> str:
    repl = str.maketrans("ąćęłńóśźż", "acelnoszz")
    text = text.lower().translate(repl)
    return "".join(ch for ch in unicodedata.normalize("NFKD", text) if not unicodedata.combining(ch))


def _size_factor(text: str) -> float:
    folded = fold(text)
    if "small" in folded or "mala" in folded:
        return SIZE_FACTOR["small"]
    if "large" in folded or "duza" in folded:
        return SIZE_FACTOR["large"]
    return 1.0


def _piece_grams(name: str) -> float | None:
    folded = fold(name)
    tokens = set(folded.replace(",", " ").split())
    for token, grams in PIECE_G.items():
        if token in tokens or token == folded:
            return grams * _size_factor(name)
    return None


def _spoon_grams(name: str, unit: str) -> float | None:
    folded = fold(name)
    tbsp = unit in {"łyżka", "lyzka", "tbsp", "tablespoon"}
    tsp = unit in {"łyżeczka", "lyzeczka", "tsp", "teaspoon"}
    if not tbsp and not tsp:
        return None
    for token, (tbsp_g, tsp_g) in SPOON_G.items():
        if token in folded.split() or token in folded:
            return tbsp_g if tbsp else tsp_g
    return None


def to_grams(name: str, amount: float | None, unit: str | None) -> float | None:
    if amount is None or amount <= 0:
        return None
    if not unit:
        piece = _piece_grams(name or "")
        return round(amount * piece, 1) if piece else None
    normalized = unit.lower().strip()
    if normalized == "g":
        return round(amount, 1)
    if normalized == "kg":
        return round(amount * 1000, 1)
    if normalized in {"ml", "l"}:
        milliliters = amount if normalized == "ml" else amount * 1000
        return round(milliliters, 1)
    if normalized in {"szt", "sztuka", "sztuki", "piece", "pieces"}:
        piece = _piece_grams(name or "")
        return round(amount * piece, 1) if piece else None
    if normalized == "cup":
        folded = fold(name or "")
        if any(
            token in folded.split() for token in ("water", "woda", "milk", "mleko", "stock", "broth", "wine")
        ):
            return round(amount * 240.0, 1)
        if any(token in folded.split() for token in ("flour", "maka")):
            return round(amount * 125.0, 1)
        if any(token in folded.split() for token in ("sugar", "cukier")):
            return round(amount * 200.0, 1)
        if any(token in folded.split() for token in ("oil", "olej", "oliwa", "butter")):
            return round(amount * 218.0, 1)
        return None
    spoon = _spoon_grams(name or "", normalized)
    if spoon is not None:
        return round(amount * spoon, 1)
    return None


def to_pieces(amount: float | None, unit: str | None) -> float | None:
    if amount is None or not unit:
        return None
    if unit.lower().strip() in {"szt", "sztuka", "sztuki", "piece", "pieces"}:
        return amount
    return None
