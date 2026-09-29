from __future__ import annotations

import math
from datetime import datetime

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from .cooking_amounts import fold, to_grams, to_pieces
from .models import PRODUCT_MODELS, STORE_NAMES, Recipe
from .schemas import CostLineOut, StoreCostOut
from .serializers import product_out
from .staples import staple_for
from .units import normalize_amount

_NAME_ALIASES: tuple[tuple[tuple[str, ...], tuple[str, ...]], ...] = (
    (("olive oil", "extra virgin olive oil", "oliwa"), ("oliwa z oliwek", "oliwa")),
    (("cornstarch", "corn starch", "skrobia kukurydziana", "part cornstarch"), ("skrobia kukurydziana", "skrobia")),
    (("potato starch", "skrobia ziemniaczana"), ("skrobia ziemniaczana", "mąka ziemniaczana")),
    (("vegetable oil", "olej rzepakowy", "olej"), ("olej rzepakowy", "olej")),
    (("soy sauce", "sos sojowy"), ("sos sojowy",)),
    (("sesame oil", "olej sezamowy"), ("olej sezamowy",)),
)

_JUNK = (
    "chips",
    "chipsy",
    "hummus",
    "grissini",
    "bruschetta",
    "nori",
    "parboiled",
    "warzywa na patelni",
    "krążki kukurydziane",
    "krazki kukurydziane",
    "paluszki",
    "oskroba",
    "tapioka",
    "pesto",
    "kąpiel",
    "płukania",
    "odplamiania",
    "tkanin",
    "krakers",
    "nachos",
)


def _line_need(line) -> tuple[float | None, float | None, float | None]:
    pieces = to_pieces(line.amount_value, line.unit)
    stored = getattr(line, "amount_g", None)
    grams = stored if stored else to_grams(line.name, line.amount_value, line.unit)
    volume = None
    normalized = (
        normalize_amount(line.amount_value, line.unit) if line.amount_value is not None else None
    )
    if normalized and normalized[1] == "volume":
        volume = normalized[0]
    hay = fold(line.name or "")
    if volume is None and grams and any(token in hay for token in ("oil", "oliwa", "olej")):
        volume = grams / 0.91
    return pieces, grams, volume


def _package_dims(product) -> tuple[float | None, float | None, float | None]:
    normalized = normalize_amount(product.package_qty, product.package_unit)
    pieces = grams = volume = None
    if normalized:
        amount, kind = normalized
        if kind == "piece":
            pieces = amount
        elif kind == "mass":
            grams = amount
        elif kind == "volume":
            volume = amount
    if grams is None and product.package_size_g:
        grams = product.package_size_g
    hay = fold(product.name or "")
    if volume is None and grams and any(token in hay for token in ("oliwa", "olej", "oil")):
        volume = grams / 0.91
    return pieces, grams, volume


def _pick_product(candidates, pieces, grams, volume):
    if not candidates:
        return None

    def compatible(product) -> bool:
        pkg_pieces, pkg_grams, pkg_volume = _package_dims(product)
        if pieces and pkg_pieces:
            return True
        if volume and pkg_volume:
            return True
        if grams and pkg_grams:
            return True
        return False

    matched = [product for product in candidates if compatible(product)]
    if pieces:
        piece_only = [product for product in matched if _package_dims(product)[0]]
        if piece_only:
            return piece_only[0]
    return (matched or candidates)[0]


def _line_costs(product, pieces, grams, volume) -> tuple[float | None, float | None, str]:
    pkg_pieces, pkg_grams, pkg_volume = _package_dims(product)
    ratio = None
    if pieces and pkg_pieces and pkg_pieces > 0:
        ratio = pieces / pkg_pieces
    elif volume and pkg_volume and pkg_volume > 0:
        ratio = volume / pkg_volume
    elif grams and pkg_grams and pkg_grams > 0:
        ratio = grams / pkg_grams
    if ratio is None or ratio < 0:
        return None, round(float(product.price_pln), 2), "orientacyjny — całe opakowanie"
    usage = round(product.price_pln * ratio, 2)
    basket = round(math.ceil(ratio) * product.price_pln, 2) if ratio > 0 else 0.0
    return usage, basket, "orientacyjny"


def _search_hay(line) -> str:
    parts = [line.name or ""]
    ingredient = getattr(line, "ingredient", None)
    if ingredient is not None:
        parts.extend([ingredient.name_en or "", ingredient.name_pl or "", getattr(ingredient, "name", "") or ""])
    return fold(" ".join(parts))


def _queries(line) -> tuple[list[str], bool]:
    staple = staple_for(getattr(line, "ingredient_id", None))
    if staple is None:
        ingredient = getattr(line, "ingredient", None)
        if ingredient is not None:
            staple = staple_for(ingredient.id)
    if staple is not None and staple.queries:
        return list(staple.queries), True
    hay = _search_hay(line)
    found: list[str] = []
    for keys, aliases in _NAME_ALIASES:
        if any(fold(key) in hay for key in keys):
            found.extend(aliases)
    if found:
        return list(dict.fromkeys(found)), True
    ingredient = getattr(line, "ingredient", None)
    if ingredient is not None and ingredient.name_pl:
        short = ingredient.name_pl.split(",")[0].strip()
        return [short], True
    return [line.name], False


def _is_junk(name: str) -> bool:
    folded = fold(name)
    return any(fold(token) in folded for token in _JUNK)


def _starts_with_word(folded: str, needle: str) -> bool:
    if not needle or not folded.startswith(needle):
        return False
    if len(folded) == len(needle):
        return True
    return folded[len(needle)] in " -,./()"


def _query_hits(folded: str, query: str) -> bool:
    needle = fold(query)
    if not needle:
        return False
    if _starts_with_word(folded, needle):
        return True
    padded = f" {folded} "
    if f" {needle} " in padded:
        return True
    if " " in needle and needle in folded:
        return True
    return False


def _name_ok(name: str, queries: list[str], aliased: bool, reject: tuple[str, ...] = ()) -> bool:
    if _is_junk(name):
        return False
    folded = fold(name)
    if any(fold(token) in folded for token in reject if token):
        return False
    wants_corn = any("kukurydziana" in fold(query) for query in queries)
    wants_potato = any("ziemniaczana" in fold(query) for query in queries)
    wants_olive = any(fold(query) in ("oliwa", "oliwa z oliwek") for query in queries)
    if wants_corn:
        return "kukurydziana" in folded and "ziemniaczana" not in folded
    if wants_potato:
        return "ziemniaczana" in folded
    if wants_olive:
        return folded.startswith("oliwa")
    if not aliased:
        return True
    return any(_query_hits(folded, query) for query in queries)


def _unique_products(rows):
    seen: set[str] = set()
    unique = []
    for row in rows:
        if row.id in seen:
            continue
        seen.add(row.id)
        unique.append(row)
    return unique


def _find_product(session: Session, model, line, pieces, grams, volume):
    staple = staple_for(getattr(line, "ingredient_id", None))
    if staple is None:
        ingredient = getattr(line, "ingredient", None)
        if ingredient is not None:
            staple = staple_for(ingredient.id)
    if staple is not None and staple.skip_price:
        return None
    queries, aliased = _queries(line)
    reject = staple.reject if staple is not None else ()
    id_rows = []
    if line.ingredient_id is not None:
        id_rows.extend(
            session.scalars(
                select(model).where(model.ingredient_id == line.ingredient_id).order_by(model.price_pln.asc(), model.name.asc())
            ).all()
        )
    filters = [model.name.ilike(f"%{query.strip()}%") for query in queries[:3] if query.strip()]
    name_rows = []
    if filters:
        name_rows.extend(
            session.scalars(select(model).where(or_(*filters)).order_by(model.price_pln.asc(), model.name.asc()).limit(40)).all()
        )

    def _is_fixture(product) -> bool:
        return fold(getattr(product, "brand", None) or "") == "appetyt mvp" or "opakowanie testowe" in fold(product.name)

    good = []
    for product in _unique_products(id_rows):
        if _is_junk(product.name):
            continue
        if any(fold(token) in fold(product.name) for token in reject if token):
            continue
        good.append(product)
    for product in _unique_products(name_rows):
        if _is_fixture(product):
            continue
        if _name_ok(product.name, queries, aliased, reject):
            good.append(product)
    good = _unique_products(good)

    def _rank(product):
        folded = fold(product.name)
        specificity = max((len(fold(query)) for query in queries if fold(query) and fold(query) in folded), default=0)
        return (-specificity, product.price_pln, len(product.name))

    ranked = sorted(good, key=_rank)
    return _pick_product(ranked, pieces, grams, volume)


def cost_for_store(session: Session, recipe: Recipe, store: str) -> StoreCostOut:
    model = PRODUCT_MODELS[store]
    lines: list[CostLineOut] = []
    usage_total = 0.0
    basket_total = 0.0
    latest: datetime | None = None

    for line in recipe.ingredients:
        staple = staple_for(line.ingredient_id)
        if staple is not None and staple.skip_price:
            lines.append(
                CostLineOut(
                    ingredient_name=line.name,
                    required_amount=line.amount_text,
                    section_title=line.section_title,
                    product=None,
                    usage_cost_pln=0,
                    basket_cost_pln=0,
                    confidence="pomijane",
                )
            )
            continue
        pieces, grams, volume = _line_need(line)
        product = _find_product(session, model, line, pieces, grams, volume)
        usage = None
        basket = None
        confidence = "brak mapowania"
        if product:
            if fold(line.amount_text or "") in ("do smaku", "to taste"):
                usage, basket, confidence = None, None, "pomijane"
            else:
                usage, basket, confidence = _line_costs(product, pieces, grams, volume)
            if basket is not None:
                basket_total += basket
            if usage is not None:
                usage_total += usage
            if product.source_updated_at and (latest is None or product.source_updated_at > latest):
                latest = product.source_updated_at
        lines.append(
            CostLineOut(
                ingredient_name=line.name,
                required_amount=line.amount_text,
                section_title=line.section_title,
                product=product_out(product, store) if product else None,
                usage_cost_pln=usage,
                basket_cost_pln=basket,
                confidence=confidence,
            )
        )
    return StoreCostOut(
        store=store,
        store_name=STORE_NAMES[store],
        usage_cost_pln=round(usage_total, 2),
        basket_cost_pln=round(basket_total, 2),
        lines=lines,
        source_updated_at=latest,
    )
