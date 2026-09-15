# Appetyt

Aplikacja z przepisami. Źródło kalorii składników: USDA FoodData Central.

## Baza składników (v1)

- Źródło: Foundation Foods + SR Legacy.
- Plik: `data/ingredients.sqlite`
- Import: `python3 scripts/import_usda.py`
- Polskie nazwy: `.venv/bin/python scripts/translate_pl.py`
- Zrzuty: `data/raw/` (nie commitować)
- Schemat: `docs/database/0001_ingredients.sql`

Nie używaj Spoonacular jako magazynu. Open Food Facts: nie MVP, plan daleki — `docs/later/open-food-facts.md`.

## Indeks

- `scripts/AGENTS.md` — import USDA
- `docs/later/open-food-facts.md` — OFF, nie teraz
