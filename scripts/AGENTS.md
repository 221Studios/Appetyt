# scripts

Pipeline danych: USDA, katalogi sklepów, crawl/YT, mapowanie linii, eksport do seeda API.

## Składniki USDA

- Wejście: zip Foundation + SR Legacy w `data/raw/`
- Wyjście: `data/ingredients.sqlite`
- `ingredient_id` = `fdc_id`; kcal/makro na 100 g
- Import: `python3 scripts/import_usda.py`
- PL: `.venv/bin/python scripts/translate_pl.py` (cache `data/name_pl.json`)

## Katalogi sklepów

Osobne bazy: `data/frisco.sqlite`, `data/auchan.sqlite`, `data/carrefour.sqlite`.  
Schemat: `docs/database/0002_store_products.sql`  
Init: `python3 scripts/init_store_dbs.py`  
Import: `python3 scripts/import_store_catalog.py data/raw/<store>.json --store <slug>`  
Map USDA: `python3 scripts/map_frisco_ingredients.py --store <slug>`

## Twórcy i crawl

Seed: `data/creators.json` → `python3 scripts/import_creators.py`  
Schema.org: `python3 scripts/parse_schema_recipe.py <url> --creator-id <id>`  
Crawler: `python3 scripts/crawl_recipes.py --limit 0` (wznawia)  
YouTube: `python3 scripts/ingest_youtube.py --max-videos 25`  
Luki: `docs/creators-uzupelnienia.md`, `docs/creators-braki.md`

## Most do API (najważniejsze)

```bash
python3 scripts/export_app_recipes.py          # → data/app_recipes.json (gitignored)
# potem seed backendu
```

Czyta `recipes.sqlite` tylko do odczytu. Przepis trafia do eksportu dopiero gdy `app_recipe.is_app_ready` — bez sensownego mapowania nie ma sensu seedować śmieci do API.
