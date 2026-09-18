# Appetyt API

FastAPI — kontrakt domenowy `/api/v1`. Runtime: PostgreSQL. Snapshoty SQLite w `data/` to tylko źródło seeda.

## Lokalnie

```bash
cp .env.example .env
python3 -m venv .venv && . .venv/bin/activate
pip install -r backend/requirements.txt
DATABASE_URL=sqlite:///./data/appetyt-dev.sqlite alembic -c backend/alembic.ini upgrade head
DATABASE_URL=sqlite:///./data/appetyt-dev.sqlite PYTHONPATH=backend python -m app.seed
DATABASE_URL=sqlite:///./data/appetyt-dev.sqlite PYTHONPATH=backend uvicorn app.main:app --reload --port 8000
```

Żeby wseedować crawled przepisy: najpierw `python3 scripts/export_app_recipes.py`, potem ponownie seed.

## Kontrakt

- `GET /healthz`
- `GET /api/v1/recipes`, `/recipes/{id}` (z kosztami sklepów)
- `GET /api/v1/creators`
- `GET /api/v1/ingredients?q=...`
- `GET /api/v1/stores`, `/stores/{slug}/products`

Ceny zawsze jako szacunek, ze źródłem/datą katalogu gdy są.
