# scripts

Import składników z zrzutów USDA JSON.

## Kontrakt

- Wejście: zip Foundation + SR Legacy w `data/raw/`
- Wyjście: `data/ingredients.sqlite`, tabela `ingredients`
- Kalorie i makro: na 100 g
- `ingredient_id` = `fdc_id`
- `name_pl`: `.venv/bin/python scripts/translate_pl.py` (Argos EN→PL, cache `data/name_pl.json`)

## Polecenie

`python3 scripts/import_usda.py`

## Katalogi sklepów

Osobne bazy: `data/frisco.sqlite`, `data/auchan.sqlite`, `data/carrefour.sqlite`.
Schemat: `docs/database/0002_store_products.sql`
Init: `python3 scripts/init_store_dbs.py`
Import JSON: `python3 scripts/import_store_catalog.py data/raw/frisco.json --store frisco`
Map USDA: `python3 scripts/map_frisco_ingredients.py --store frisco`
JSON musi mieć `"store"` zgodny z plikiem.

## Twórcy

Seed: `data/creators.json` → `data/recipes.sqlite`.
`python3 scripts/import_creators.py`

Nie budować tu scraperów per twórca. Parsery idą osobno, od `primary_source=website`.

## Schema.org / Recipe

Surowy HTML → JSON-LD `Recipe`. Nie markdown.
`python3 scripts/parse_schema_recipe.py <url-przepisu> --creator-id jamie_oliver`

Crawler (sitemap → JSON-LD):
`python3 scripts/crawl_recipes.py --creator-id jamie_oliver --limit 5`
`--limit 0` = wszystkie URL z sitemap (długo). Wznawia: pomija już zapisane URL.
`--report` = jakość w bazie.
`--dry-run` tylko wypisuje URL.

n3xusAPI nie jest ingestem: zwraca markdown i wycina JSON-LD. Parsujemy surowy HTML.

Opisy YouTube często mają URL do bloga. Najpierw te linki → JSON-LD, potem tekst opisu.

`python3 scripts/ingest_youtube.py --max-videos 25`
`--creator-id foxx_gotuje` jeden kanał. yt-dlp, bez oficjalnego API.
Pomija `youtube_com_only` / złą tożsamość / brak handle.

Eksport do backendu (Treehouse FastAPI):
`python3 scripts/export_app_recipes.py` (wszystkie; `--limit 500` wycinek)
Czyta `recipes.sqlite` tylko do odczytu. Zapisuje `data/app_recipes.json` (gitignored).
Składniki: ilości + USDA gdy reguła jest pewna. Kroki: skrót operacyjny, nie kopia prozy.

Luki w rejestrze (do 200 używalnych źródeł): `docs/creators-uzupelnienia.md`
Wznawianie crawla: `docs/crawl-checkpoint.md`
