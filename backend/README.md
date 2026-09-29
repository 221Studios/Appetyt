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
- `GET /api/v1/discover/home` — Top 5 dnia i sekcje kategorii; parametr `date=YYYY-MM-DD` pozwala odtworzyć konkretną edycję
- `GET /api/v1/creators`
- `GET /api/v1/ingredients?q=...`
- `GET /api/v1/stores`, `/stores/{slug}/products`
- `GET /api/v1/auth/google/start`, `/auth/google/callback`, `/auth/me`
- `POST /api/v1/auth/logout`, `/auth/logout-all`
- `DELETE /api/v1/auth/account`

Ceny zawsze jako szacunek, ze źródłem/datą katalogu gdy są.

Pozycje `ingredients[]` oraz kosztowe `costs[].lines[]` zachowują opcjonalne
`section_title` (np. `Sos`, `Bułka`, `Mięso`), dzięki czemu przepis i lista
zakupowa mogą renderować te same grupy w kolejności źródłowej.

Feed odkrywania używa strefy `Europe/Warsaw`: nowa edycja zaczyna się o północy. Top 5 preferuje opublikowane wpisy w `daily_discoveries`; gdy edycja nie ma jeszcze ręcznej publikacji, API wybiera stabilny, deterministyczny zestaw na dany dzień. Tagi są wielokrotne i grupowane jako: typ kuchni, diety, fast food, typ posiłku oraz inne.

## Logowanie Google

Uzupełnij w `.env` `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` i `AUTH_FRONTEND_URL`. W Google Cloud Console zarejestruj dokładnie wartość `GOOGLE_REDIRECT_URI` jako authorized redirect URI. Dla logowania ustaw konkretne `CORS_ORIGINS` — wildcard `*` wyłącza credentialed CORS. Logowanie zapisuje wyłącznie techniczne konto i powiązanie z Google; dane profilu Google nie są przechowywane.

Dla produkcyjnej strony webowej użyj OAuth client type **Web application**:

- Authorized JavaScript origins: `https://appetyt.221studio.pl`
- Authorized redirect URIs: `https://appetyt.221studio.pl/api/v1/auth/google/callback`

Nazwa pakietu i odcisk SHA-1/SHA-256 dotyczą osobnego klienta Android — nie są potrzebne do obecnego logowania przez przeglądarkę. Po utworzeniu klienta wpisz jego ID i secret do `/home/nikodem/appetyt/.env.production`, a następnie zrestartuj usługę API.
