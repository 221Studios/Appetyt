# Backend

FastAPI exposes the mobile domain contract under `/api/v1`; database details stay behind routers and serializers.

- Runtime database: PostgreSQL. Apply `alembic -c backend/alembic.ini upgrade head` before seeding.
- Deterministic local seed: `PYTHONPATH=backend python -m app.seed`; it imports checked-in SQLite snapshots, five MVP fixtures, and optional `data/app_recipes.json` from the crawler export.
- Tests: `.venv/bin/pytest`; lint: `.venv/bin/ruff check backend/app backend/tests`.
- Store products remain physically separate as `products_frisco`, `products_auchan`, and `products_carrefour`.
