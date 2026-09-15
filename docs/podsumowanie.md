# Appetyt — stan projektu

Aplikacja z przepisami: **kcal ze składnika USDA**, **cena z katalogu sklepu**. Nie ma jeszcze UI ani samych przepisów.

## Co jest gotowe

### Składniki (USDA)

- Źródło: FoodData Central — Foundation Foods + SR Legacy.
- Plik: `data/ingredients.sqlite` (~8156 pozycji).
- Kalorie i makro na 100 g. `ingredient_id` = `fdc_id`.
- Import: `python3 scripts/import_usda.py`
- Polskie nazwy: `.venv/bin/python scripts/translate_pl.py`

### Katalogi sklepów (3 osobne bazy)

Ten sam schemat, trzy pliki — sklepy się nie mieszają.

| Sklep | Plik | SKU | Zmapowane na USDA | Unikalne składniki |
| --- | --- | ---: | ---: | ---: |
| Frisco | `data/frisco.sqlite` | 12 850 | 2458 | 134 |
| Auchan | `data/auchan.sqlite` | 14 457 | 3363 | 136 |
| Carrefour | `data/carrefour.sqlite` | 10 331 | 2520 | 129 |

Surowy JSON (gitignored): `data/raw/{frisco,auchan,carrefour}/catalog.json`.

Schemat: `docs/database/0002_store_products.sql`.  
Import: `python3 scripts/import_store_catalog.py <json> --store <slug>`.  
Mapowanie: `python3 scripts/map_frisco_ingredients.py --store <slug>`.

### Dwa koszty przepisu (logika jest, UI nie)

- **Koszt zużycia** — ułamek ceny paczki za ilość w przepisie.
- **Koszt koszyka** — pełne opakowania, które trzeba kupić.

Kod: `scripts/store_dbs.py` (`usage_cost`, `basket_cost`).

### Mapowanie SKU → USDA

Tylko jawne reguły (`scripts/map_store_ingredients.py`), nie fuzzy matching.

Mapujemy składniki do gotowania (mąka, jajka, schab, kasze, sery twarde, warzywa, przyprawy…).  
Nie mapujemy: napojów smakowych, chipsów, słodyczy, gotowców, chemii, karmy, kawy ziarnistej (w USDA nie ma suchego ziarna).

Dalsze exact-match reguły dałyby mało, a luzniejsze — błędy. Na tym zostajemy. Reszta paczek = Open Food Facts później.

## Czego nie robić

- Spoonacular jako magazyn składników.
- Jedna wspólna tabela cen z kolumną `store`.
- Open Food Facts teraz (`docs/later/open-food-facts.md`).
- Wklejanie haseł do sklepów — harvest przez zalogowane Chrome (CDP).

## Harvest (gdy katalog się zestarzeje)

- Frisco: API oferty w sesji przeglądarki.
- Carrefour: `__NEXT_DATA__` + `?page=N` (`scripts/harvest_carrefour.py`, Chrome `:9223`).
- Auchan: `zakupy.auchan.pl` API `webproductpagews` (`scripts/harvest_auchan.py`). Przy WAF trzeba kliknąć weryfikację w oknie.

## Twórcy (seed, nie ingest)

Cel: 50+50 PL i 50+50 global. Seed: **200** wierszy. Luki później: `docs/creators-uzupelnienia.md`.

- Seed: `data/creators.json`
- Baza: `data/recipes.sqlite` (osobna od USDA i sklepów)
- Import: `python3 scripts/import_creators.py`
- Schemat: `docs/database/0003_creators.sql`

Nie piszemy scraperów na 200 źródeł naraz. Pipeline (kolejność):

1. Blog / WWW → JSON-LD Schema.org/Recipe (surowy HTML, nie markdown).
2. YouTube Data API v3 → `snippet.description`.
3. Napisy / Whisper tylko gdy 1 i 2 nic nie dają.

W aplikacji: składniki + ilości + skrócone kroki + zawsze link do oryginału. Nie kopiujemy zdjęć, filmów ani literackiego opisu.

Mapowanie linii składnika → `ingredient_id` to osobny moduł. Nie mieszać z jawnymi regułami SKU → USDA.

## Parser poziomu 1 (Schema.org)

`python3 scripts/parse_schema_recipe.py <url> --creator-id <id>`

Crawler: `python3 scripts/crawl_recipes.py --limit 0` (wszystkie URL z sitemap; wznawia).
`--report` pokazuje jakość.

Z HTML bierze JSON-LD `Recipe`: tytuł, składniki, czas, yield, link.
Kroki z JSON-LD lądują w `source_steps_json` — nie do UI.
Część blogów (np. Kwestia Smaku) ma tylko pusty `itemtype=Recipe`, bez JSON-LD ze składnikami — wtedy parser nic nie zwraca.

## Jeszcze nie ma

- Ingestu YouTube i skróconych instrukcji operacyjnych.
- Aplikacji (lista, koszyk, porównanie sklepów).
- Polskich gotowców przez EAN → Open Food Facts.
- Uzupełnienia luk w 200 twórcach (`docs/creators-uzupelnienia.md`).
