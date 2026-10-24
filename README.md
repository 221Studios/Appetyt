# Appetyt

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Version](https://img.shields.io/badge/version-1.0.0-2f81f7)
![Python](https://img.shields.io/badge/Python-3.11%2B-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)

Appetyt to otwartoźródłowy katalog przepisów pochodzących bezpośrednio od twórców: Foxx, Sam the Cooking Guy, Nick DiGiovanni i Joshua Weissman. Projekt łączy link do oryginału z danymi potrzebnymi do gotowania: składnikami, szacunkową wartością odżywczą oraz orientacyjnymi kosztami zakupów we Frisco, Auchan i Carrefour.

Projekt jest przeznaczony dla osób, które chcą gotować ze źródeł pierwotnych, a jednocześnie widzieć porównywalny szacunek kalorii, makroskładników i kosztu składników.

> **Stan projektu:** aktualnym priorytetem jest domknięcie „MVP źródło” dla czterech twórców — kompletnego katalogu URL oraz składników 1:1 w snapshotach. Pełna definicja etapów „przepis kompletny” i „app-ready” znajduje się w [docs/GOAL.md](docs/GOAL.md).

## O projekcie

Appetyt oddziela dane źródłowe od runtime aplikacji. Snapshoty SQLite przechowują katalog twórców, dane USDA i osobne katalogi sklepowe. Seed przenosi przygotowane dane do bazy runtime, a FastAPI udostępnia je pod `/api/v1`. Klient w `appetyt-mobile/` jest aplikacją React + Capacitor dla webu, Androida i iOS.

```text
snapshoty SQLite → walidacja i eksport → seed → FastAPI /api/v1 → klient Capacitor
```

Najważniejsze pojęcia domenowe opisuje [CONTEXT.md](CONTEXT.md), a decyzje architektoniczne znajdują się w [docs/adr/](docs/adr/).

## Funkcje

- katalog przepisów czterech twórców z linkiem `source_url` do oryginału,
- zachowanie kolejności i tekstu linii składników 1:1 w snapshotach źródłowych,
- szacunki kcal i makroskładników na podstawie mapowania do USDA,
- orientacyjny koszt zużycia i koszt koszyka dla osobnych katalogów Frisco, Auchan i Carrefour,
- logowanie przez Google OAuth i zarządzanie sesjami,
- zgłaszanie publicznych linków do przepisów z kolejką moderacji,
- oceny przepisów w skali 1–10 oraz publiczne agregaty ocen,
- ekran odkrywania z dziennym Top 5 i sekcjami kategorii,
- OpenAPI i interaktywna dokumentacja endpointów.

Nie każdy przepis źródłowy jest już przepisem kompletnym lub app-ready. Aktualny stan katalogu ocenia `scripts/recipe_completeness.py`; definicje jakości są opisane w [docs/GOAL.md](docs/GOAL.md).

## Struktura repozytorium

| Ścieżka | Rola |
|---|---|
| `data/` | Snapshoty SQLite, dane wejściowe i cache wizualny |
| `scripts/` | Import, crawl, mapowanie, audyt kompletności i eksport |
| `backend/` | FastAPI, SQLAlchemy, Alembic i seed runtime |
| `appetyt-mobile/` | Klient React 19 + Vite + Capacitor 8 |
| `docs/` | Cel projektu, ADR-y i schematy baz danych |
| `tests/` | Testy pipeline'u danych |
| `android/` | Eksperymentalny katalog legacy; nie jest bieżącym klientem Capacitor |

## Technologie

- Python 3.11+
- FastAPI 0.115
- SQLAlchemy i Alembic
- PostgreSQL 16 lub SQLite w środowisku lokalnym
- Docker i Docker Compose
- React 19, Vite i Capacitor 8
- Git LFS dla dużych snapshotów

## Instalacja

### Wymagania

- Git z Git LFS,
- Python 3.11+,
- Docker z Docker Compose (opcjonalnie),
- Node.js 20+ tylko do uruchamiania klienta.

### Pobranie repozytorium

```bash
git clone https://github.com/n3xus47/Appetyt.git
cd Appetyt
git lfs install
git lfs pull
cp .env.example .env
```

Plik `.env` jest lokalny i nie może trafić do repozytorium.

### Uruchomienie przez Docker

```bash
docker compose up --build
```

Compose uruchamia PostgreSQL 16, wykonuje migracje i seed, a następnie startuje API na `http://localhost:8000`. Uruchamia także worker obsługujący zgłoszenia linków.

### Uruchomienie lokalne

Ustaw w `.env` lokalny adres PostgreSQL albo `DATABASE_URL=sqlite:///./data/appetyt-dev.sqlite`, a następnie:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r backend/requirements.txt
alembic -c backend/alembic.ini upgrade head
PYTHONPATH=backend python -m app.seed
PYTHONPATH=backend uvicorn app.main:app --reload --port 8000
```

W PowerShell aktywacja środowiska to `.venv\Scripts\Activate.ps1`, a `PYTHONPATH` można ustawić poleceniem `$env:PYTHONPATH = "backend"`. Więcej wariantów konfiguracji opisuje [backend/README.md](backend/README.md).

## Użycie API

```bash
curl http://localhost:8000/healthz
curl "http://localhost:8000/api/v1/recipes?limit=20"
```

Dokumentacja OpenAPI jest dostępna pod adresem [http://localhost:8000/docs](http://localhost:8000/docs).

## Klient web/mobile

Najpierw wyeksportuj katalog z katalogu głównego repozytorium, a potem uruchom Vite:

```bash
python3 scripts/export_mvp_mobile_catalog.py
cd appetyt-mobile
npm install
npm run dev
```

Instrukcje budowania Androida i iOS znajdują się w [appetyt-mobile/README.md](appetyt-mobile/README.md).

## Jakość

```bash
make api-lint
make api-test
make scripts-test
```

## Współpraca i bezpieczeństwo

Zasady zgłaszania zmian opisuje [CONTRIBUTING.md](CONTRIBUTING.md). Podatności bezpieczeństwa należy zgłaszać prywatnie zgodnie z [SECURITY.md](SECURITY.md), a nie w publicznym issue. Uczestników projektu obowiązuje [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Licencja

Kod jest udostępniany na licencji [MIT](LICENSE).
