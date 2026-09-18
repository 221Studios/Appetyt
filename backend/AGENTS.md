# Backend

FastAPI — kontrakt domenowy pod `/api/v1`. Szczegóły SQLite/Postgres zostają za routerami i serializerami.

- Runtime: PostgreSQL. `alembic -c backend/alembic.ini upgrade head`, potem seed.
- Seed: `PYTHONPATH=backend python -m app.seed` — snapshoty SQLite + 5 fixture’ów + opcjonalny `data/app_recipes.json`.
- Testy: `pytest`; lint: `ruff check backend/app backend/tests`.
- Produkty sklepów: osobne tabele `products_frisco`, `products_auchan`, `products_carrefour`.
- Priorytet: przepisy app-ready (mapowanie, kcal/makro, koszty). Klienci UI poza zakresem na razie.
