# Appetyt

Priorytet: **jakość danych przepisów** (mapowanie → kcal/makro → cena sklepowa) i kontrakt `backend/`. Frontend poza zakresem, dopóki katalog w API nie jest app-ready.

## Indeks

- `CONTEXT.md` — słownik domeny
- `backend/AGENTS.md` — FastAPI, migracje, seed, kontrakt API
- `scripts/AGENTS.md` — pipeline importu / crawla / mapowania
- `docs/database/` — schematy snapshotów SQLite
- `docs/later/open-food-facts.md` — OFF, nie teraz

## Zasady

- Nie używaj Spoonacular jako magazynu składników.
- Nie mieszaj katalogów sklepów w jedną tabelę z kolumną `store`.
- Nie kopiuj zdjęć ani literackich opisów twórców do API.
- Nie buduj UI, zanim przepisy w seedzie/API nie mają sensownych kosztów i makro.

## Maintaining this file

Keep entries short. Point to the authoritative file. Prefer rewrite over append.
