# Appetyt API

FastAPI exposes the mobile domain contract under `/api/v1`. The API does not expose SQLite details. PostgreSQL is the runtime database; the checked-in SQLite snapshots are only the import source used by `app.seed`.

## Local

```bash
cp .env.example .env
python3 -m venv .venv && . .venv/bin/activate
pip install -r backend/requirements.txt
DATABASE_URL=sqlite:///./data/appetyt-dev.sqlite alembic -c backend/alembic.ini upgrade head
DATABASE_URL=sqlite:///./data/appetyt-dev.sqlite PYTHONPATH=backend python -m app.seed
DATABASE_URL=sqlite:///./data/appetyt-dev.sqlite PYTHONPATH=backend uvicorn app.main:app --reload --port 8000
```

For crawled recipes, copy `data/app_recipes.json` from the ingest checkout (`python3 scripts/export_app_recipes.py`) into this `data/` folder, then re-run seed.

## Contract

- `GET /healthz`
- `GET /api/v1/recipes`, `/recipes/{id}`
- `GET /api/v1/creators`
- `GET /api/v1/ingredients?q=...`
- `GET /api/v1/stores`, `/stores/{slug}/products`

Price responses are always marked as estimates and retain catalog source/update metadata.
