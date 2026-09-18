# Appetyt

Priorytet: **przepisy kompletne** w snapshotcie, potem **app-ready** w API (mapowanie → kcal/makro → cena sklepowa). Frontend poza zakresem, dopóki katalog w API nie jest app-ready.

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
- Nie buduj UI, zanim w API są przepisy app-ready (najpierw domknij przepisy kompletne w snapshotcie).
- `docs/GOAL.md` — kompletny vs app-ready; `scripts/recipe_completeness.py` — werdykt.

## Agent skills

### Issue tracker

Issues live in GitHub Issues for `n3xus47/Appetyt` (via `gh`). See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `CONTEXT.md` + `docs/adr/`. See `docs/agents/domain.md`.

## Maintaining this file

Keep entries short. Point to the authoritative file. Prefer rewrite over append.
