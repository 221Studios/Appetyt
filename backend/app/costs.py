from __future__ import annotations

import math
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import PRODUCT_MODELS, STORE_NAMES, Recipe
from .schemas import CostLineOut, StoreCostOut
from .serializers import product_out

STORES = ("frisco", "auchan", "carrefour")


def _base_amount(value: float, unit: str | None) -> tuple[float, str] | None:
    if not unit:
        return None
    normalized = unit.lower().strip().replace(".", "")
    if normalized in {"g", "gram", "gramy"}:
        return value, "mass"
    if normalized in {"kg", "kilogram", "kilograms"}:
        return value * 1000, "mass"
    if normalized in {"ml", "milliliter", "mililitr"}:
        return value, "volume"
    if normalized in {"l", "liter", "litr"}:
        return value * 1000, "volume"
    if normalized in {"szt", "sztuka", "sztuki", "piece", "pieces"}:
        return value, "piece"
    return None


def cost_for_store(session: Session, recipe: Recipe, store: str) -> StoreCostOut:
    model = PRODUCT_MODELS[store]
    lines: list[CostLineOut] = []
    usage_total = 0.0
    basket_total = 0.0
    latest: datetime | None = None

    for line in recipe.ingredients:
        product = None
        usage = None
        basket = None
        confidence = "brak mapowania"
        if line.ingredient_id is not None:
            product = session.scalar(
                select(model)
                .where(model.ingredient_id == line.ingredient_id)
                .order_by(model.price_pln.asc())
                .limit(1)
            )
        required = _base_amount(line.amount_value, line.unit) if line.amount_value is not None else None
        package = _base_amount(product.package_qty, product.package_unit) if product else None
        if product and required and package and required[1] == package[1] and package[0] > 0:
            ratio = required[0] / package[0]
            usage = round(product.price_pln * ratio, 2)
            basket = round(math.ceil(ratio) * product.price_pln, 2) if ratio > 0 else 0.0
            confidence = "orientacyjny"
            usage_total += usage
            basket_total += basket
            if product.source_updated_at and (latest is None or product.source_updated_at > latest):
                latest = product.source_updated_at
        elif product:
            confidence = "orientacyjny — sprawdź jednostkę"
            if product.source_updated_at and (latest is None or product.source_updated_at > latest):
                latest = product.source_updated_at
        lines.append(
            CostLineOut(
                ingredient_name=line.name,
                required_amount=line.amount_text,
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
