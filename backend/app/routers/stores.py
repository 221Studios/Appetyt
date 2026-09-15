from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from ..db import get_session
from ..models import PRODUCT_MODELS, STORE_NAMES, StoreCatalog
from ..schemas import ProductListOut, ProductOut, StoreOut

router = APIRouter(prefix="/stores", tags=["stores"])


def product_out(product: object, store: str) -> ProductOut:
    return ProductOut(
        id=product.id,
        store=store,
        name=product.name,
        brand=product.brand,
        package_qty=product.package_qty,
        package_unit=product.package_unit,
        price_pln=product.price_pln,
        price_per_100g=product.price_per_100g,
        source_url=product.source_url,
        source_updated_at=product.source_updated_at,
    )


@router.get("", response_model=list[StoreOut])
def list_stores(session: Session = Depends(get_session)) -> list[StoreOut]:
    catalogs = {row.slug: row for row in session.scalars(select(StoreCatalog)).all()}
    result = []
    for slug, model in PRODUCT_MODELS.items():
        count = session.scalar(select(func.count()).select_from(model)) or 0
        catalog = catalogs.get(slug)
        result.append(
            StoreOut(
                slug=slug,
                name=catalog.name if catalog else STORE_NAMES[slug],
                source_url=catalog.source_url if catalog else None,
                source_updated_at=catalog.source_updated_at if catalog else None,
                product_count=count,
            )
        )
    return result


@router.get("/{store}/products", response_model=ProductListOut)
def list_products(
    store: str,
    q: str | None = Query(default=None, min_length=1, max_length=120),
    ingredient_id: int | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    session: Session = Depends(get_session),
) -> ProductListOut:
    model = PRODUCT_MODELS.get(store)
    if model is None:
        raise HTTPException(status_code=404, detail="Unknown store")
    filters = []
    if q:
        pattern = f"%{q.strip()}%"
        filters.append(or_(model.name.ilike(pattern), model.brand.ilike(pattern)))
    if ingredient_id is not None:
        filters.append(model.ingredient_id == ingredient_id)
    base = select(model).where(*filters)
    total = session.scalar(select(func.count()).select_from(model).where(*filters)) or 0
    rows = session.scalars(base.order_by(model.price_pln, model.name).limit(limit)).all()
    return ProductListOut(items=[product_out(row, store) for row in rows], total=total, store=store)
