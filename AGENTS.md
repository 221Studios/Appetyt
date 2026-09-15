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

- `backend/AGENTS.md` — FastAPI, migracje, seed i kontrakt API
- `apps/mobile/AGENTS.md` — Expo React Native i stan lokalny
- `scripts/AGENTS.md` — import USDA
- `docs/later/open-food-facts.md` — OFF, nie teraz

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
