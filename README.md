# Appetyt

Cel na teraz: **każdy przepis w API jest poprawny** — zmapowane składniki, kcal/makro, orientacyjna cena sklepowa. Bez tego nie budujemy frontendu.

## Co jest w repo

| Ścieżka | Rola |
|---|---|
| `data/*.sqlite` | Źródła: USDA, katalogi sklepów, crawled przepisy, twórcy |
| `scripts/` | Pipeline: crawl, YT, mapowanie linii → składnik, eksport do API |
| `backend/` | FastAPI + SQLAlchemy + Alembic — kontrakt domenowy (read-only) |
| `docs/database/` | Schematy snapshotów SQLite |
| `tests/` | Testy skryptów i API |

Frontend (Expo / prototyp web) został usunięty — wraca dopiero gdy katalog przepisów w API spełnia cel jakości.

## Źródła danych (nie mieszać)

- `data/ingredients.sqlite` — składniki USDA (kcal/makro na 100 g)
- `data/{frisco,auchan,carrefour}.sqlite` — osobne katalogi sklepów
- `data/recipes.sqlite` — surowy crawl (JSON linii składników)
- `data/creators.json` — seed twórców

Runtime aplikacji: PostgreSQL (Docker) albo lokalny SQLite przez `DATABASE_URL`. Seed importuje snapshoty + opcjonalnie `data/app_recipes.json` (generowany, nie commitowany).

## Most crawl → API

```bash
# 1) zmapuj / zbuduj przepisy gotowe pod aplikację
python3 scripts/export_app_recipes.py

# 2) seed do runtime DB (Postgres lub sqlite)
docker compose up --build
# albo lokalnie: alembic upgrade + python -m app.seed
```

Przepis jest „app-ready” dopiero gdy ma poprawne ilości, `ingredient_id` (tam gdzie da się zmapować), kcal/makro i linie kosztów sklepowych.

## Słownik

Patrz [`CONTEXT.md`](CONTEXT.md).

## API (bez UI)

```bash
docker compose up --build
curl http://localhost:8000/healthz
curl 'http://localhost:8000/api/v1/recipes?limit=20'
# OpenAPI: http://localhost:8000/docs
```

## Testy

```bash
make api-install
make api-lint
make api-test
python3 -m unittest discover -s tests -q
```
