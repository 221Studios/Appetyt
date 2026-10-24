# Współpraca przy Appetyt

Dziękujemy za zainteresowanie projektem. Przed rozpoczęciem większej zmiany otwórz issue i opisz problem, oczekiwany rezultat oraz zakres danych lub API, którego dotyczy propozycja.

## Workflow

1. Zrób fork repozytorium i utwórz krótko nazwaną gałąź roboczą.
2. Sprawdź [docs/GOAL.md](docs/GOAL.md), [CONTEXT.md](CONTEXT.md) oraz ADR-y związane ze zmianą.
3. Wprowadź możliwie małą, spójną zmianę wraz z testami.
4. Uruchom lokalną weryfikację.
5. Otwórz pull request z opisem motywacji, zakresu i sposobu sprawdzenia zmiany.

Nie commituj sekretów, plików `.env`, kluczy API, surowych dumpów z `data/raw/` ani generowanego `data/app_recipes.json`. Duże pliki objęte Git LFS muszą pozostać w LFS.

## Issue tracker

Issue powinno zawierać kroki reprodukcji albo kryteria akceptacji oraz informację, których snapshotów, skryptów lub endpointów dotyczy. Projekt używa etykiet:

- `needs-triage` — wymaga oceny maintenera,
- `needs-info` — brakuje informacji od zgłaszającego,
- `wontfix` — nie będzie realizowane.

## Weryfikacja

Po instalacji zależności przez `make api-install` uruchom:

```bash
make api-lint
make api-test
make scripts-test
```

Lint API używa Ruff. Zmiana pipeline'u powinna zachować deterministyczność, istniejące snapshoty oraz merytoryczne komentarze opisujące heurystyki źródeł i HTML.

## Zasady domenowe

- Nie używaj Spoonacular jako magazynu składników.
- Nie łącz katalogów sklepów w jedną tabelę z kolumną `store`.
- `source_url` ma prowadzić do oryginału twórcy.
- Nie kopiuj literackich opisów twórców do API.
- Nie traktuj przepisu jako app-ready bez werdyktu `scripts/recipe_completeness.py`.

Zgłaszając pull request, potwierdzasz, że masz prawo udostępnić zmianę na licencji MIT projektu i akceptujesz [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
