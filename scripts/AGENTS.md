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

## Kompletność i archiwum

- Werdykt **przepisu kompletnego**: `scripts/recipe_completeness.py` (`completeness_verdict`) — nie mylić z luźnym `is_app_ready`.
- Archiwum twórcy przed re-ingestem: `python3 scripts/archive_creator_recipes.py <creator_id>`
- Foxx katalog URL: `python3 scripts/discover_foxx_catalog.py` → `data/foxx_gotuje_catalog.json`
- Foxx jeden przepis E2E: `python3 scripts/complete_foxx_recipe.py [url]`
- Foxx cały katalog + raport: `python3 scripts/complete_foxx_catalog.py` → `data/foxx_gotuje_completeness_report.json`
- Foxx: trudne linie (bez USDA/gramów/sklepu) pomijane w `build_foxx_completeness`; w kanonie zostają linie usable.
- Foxx audit 10 vs live: `python3 scripts/audit_foxx_sample.py` → `data/foxx_gotuje_audit10.json` (`creator_closed` = pass)

## Most do API

```bash
python3 scripts/export_complete_recipes.py     # tylko complete z raportu Foxx → data/app_recipes.json
python3 scripts/export_app_recipes.py          # szerszy eksport (gitignored)
# potem seed backendu
```

Smoke Foxx: `export_complete_recipes.py` + `backend/tests/test_foxx_complete_smoke.py`.  
`is_app_ready` to tylko próg ratio — bramka jakości to `completeness_verdict`.
