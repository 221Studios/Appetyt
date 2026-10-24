# Appetyt

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](backend/pyproject.toml)
[![Python](https://img.shields.io/badge/Python-3.11%2B-3776AB?logo=python&logoColor=white)](backend/pyproject.toml)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](backend/pyproject.toml)

Appetyt to otwartoźródłowy katalog przepisów twórców kulinarnych: Foxx, Sam the Cooking Guy, Nick DiGiovanni i Joshua Weissman. Łączy oryginalne źródła ze składnikami, szacunkową wartością odżywczą oraz orientacyjnymi kosztami zakupów, pomagając gotować z materiałów autorów i świadomie planować posiłki.

## 📑 Spis treści

- [O projekcie](#-o-projekcie)
- [Główne funkcje](#-główne-funkcje)
- [Technologie](#-technologie)
- [Instalacja i uruchomienie](#-instalacja-i-uruchomienie)
- [Użycie](#-użycie)
- [Contributing](#-contributing)
- [Licencja](#-licencja)

## 🚀 O projekcie

Appetyt powstał dla osób, które chcą gotować ze źródeł pierwotnych, a jednocześnie widzieć porównywalne szacunki kalorii, makroskładników i kosztu potrzebnych produktów. Każdy wpis zachowuje `source_url` prowadzący do oryginalnego materiału autora.

Dane źródłowe są oddzielone od bazy używanej przez aplikację. Snapshoty SQLite przechowują katalog twórców, składniki, mapowania USDA i osobne katalogi sklepów. Zweryfikowane dane trafiają przez eksport i seed do FastAPI, które udostępnia kontrakt `/api/v1`. Klient w `appetyt-mobile/` korzysta z Reacta i Capacitor, dzięki czemu może działać w przeglądarce oraz na Androidzie i iOS.

```text
snapshoty SQLite → walidacja i eksport → seed → FastAPI /api/v1 → klient Capacitor
```

Priorytetem projektu jest kompletność katalogu źródłowego dla czterech twórców. Definicje etapów „przepis kompletny” i „app-ready” znajdują się w [docs/GOAL.md](docs/GOAL.md), słownik domeny w [CONTEXT.md](CONTEXT.md), a decyzje architektoniczne w [docs/adr/](docs/adr/).

Główne katalogi repozytorium:

| Ścieżka | Przeznaczenie |
|---|---|
| `data/` | Snapshoty SQLite, dane wejściowe i lokalny cache obrazów |
| `scripts/` | Import, crawl, mapowanie, audyt kompletności i eksport |
| `backend/` | FastAPI, SQLAlchemy, Alembic i seed bazy runtime |
| `appetyt-mobile/` | Klient React + Vite + Capacitor |
| `docs/` | Cel projektu, ADR-y i dokumentacja schematów |
| `tests/` | Testy pipeline'u danych |
| `android/` | Eksperymentalny katalog legacy; nie jest bieżącym klientem Capacitor |

## ✨ Główne funkcje

- [x] **Katalog twórców:** przepisy Foxx, Sama, Nicka i Weissmana wraz z linkiem do oryginalnego źródła.
- [x] **Składniki zgodne ze źródłem:** tekst, kolejność i sekcje składników są zachowywane 1:1 w snapshotach.
- [x] **Wartości odżywcze:** orientacyjne kcal i makroskładniki wyliczane na podstawie mapowania produktów do USDA.
- [x] **Koszty zakupów:** szacunki zużycia i koszyka dla oddzielnych katalogów Frisco, Auchan i Carrefour.
- [x] **Logowanie przez Google:** OAuth, sesje użytkownika i bezpieczne wylogowanie.
- [x] **Zgłoszenia społeczności:** przesyłanie publicznych linków do przepisów i kolejka moderacji.
- [x] **Oceny przepisów:** oceny użytkowników w skali 1–10 oraz publiczne agregaty.
- [x] **Discover home:** dzienne Top 5 i tematyczne sekcje kategorii.
- [x] **Dokumentacja API:** automatycznie generowany kontrakt OpenAPI i interaktywny Swagger UI.

Nie każdy wpis źródłowy osiągnął już poziom kompletności wymagany przez aplikację. Bieżący stan danych można sprawdzić skryptem `scripts/recipe_completeness.py`.

## 🛠 Technologie

W projekcie wykorzystano następujące technologie, biblioteki i narzędzia:

- **Backend:** Python 3.11+, FastAPI 0.115, SQLAlchemy i Alembic.
- **Baza danych:** PostgreSQL 16 w środowisku produkcyjnym lub SQLite lokalnie.
- **Klient:** React 19, Vite 6 i Capacitor 8 dla webu, Androida i iOS.
- **Infrastruktura:** Docker, Docker Compose i Git LFS.
- **Jakość kodu:** Ruff, Pytest, unittest i TypeScript.

## ⚙️ Instalacja i uruchomienie

### Wymagania wstępne

Przed rozpoczęciem zainstaluj:

- Git oraz [Git LFS](https://git-lfs.com/),
- Python 3.11 lub nowszy,
- Docker z Docker Compose — opcjonalnie, ale jest to najprostszy sposób uruchomienia całego backendu,
- Node.js 20 lub nowszy — tylko jeśli chcesz uruchamiać klienta web/mobile.

### Kroki instalacji

1. Sklonuj repozytorium i pobierz pliki LFS:

   ```bash
   git clone https://github.com/n3xus47/Appetyt.git
   cd Appetyt
   git lfs install
   git lfs pull
   ```

2. Utwórz lokalną konfigurację:

   ```bash
   cp .env.example .env
   ```

   W PowerShell użyj `Copy-Item .env.example .env`. Pliku `.env` nie należy commitować.

3. Wybierz jeden ze sposobów uruchomienia API.

#### Docker Compose

```bash
docker compose up --build
```

Docker Compose uruchamia PostgreSQL 16, wykonuje migracje i seed, a następnie startuje API oraz worker zgłoszeń. API będzie dostępne pod adresem `http://localhost:8000`.

#### Lokalne środowisko Python

Linux/macOS:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r backend/requirements.txt
export DATABASE_URL=sqlite:///./data/appetyt-dev.sqlite
alembic -c backend/alembic.ini upgrade head
PYTHONPATH=backend python -m app.seed
PYTHONPATH=backend uvicorn app.main:app --reload --port 8000
```

PowerShell:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r backend/requirements.txt
$env:DATABASE_URL = "sqlite:///./data/appetyt-dev.sqlite"
alembic -c backend/alembic.ini upgrade head
$env:PYTHONPATH = "backend"
python -m app.seed
uvicorn app.main:app --reload --port 8000
```

Szczegóły konfiguracji bazy, seeda, OAuth i workera opisuje [backend/README.md](backend/README.md).

## 📖 Użycie

Po uruchomieniu backendu sprawdź stan usługi i pobierz przykładową stronę katalogu:

```bash
curl http://localhost:8000/healthz
curl "http://localhost:8000/api/v1/recipes?limit=20"
```

Interaktywna dokumentacja OpenAPI jest dostępna pod adresem [http://localhost:8000/docs](http://localhost:8000/docs).

### Klient web/mobile

Najpierw wyeksportuj katalog z głównego katalogu repozytorium, a następnie uruchom klienta:

```bash
python3 scripts/export_mvp_mobile_catalog.py
cd appetyt-mobile
npm install
npm run dev
```

Vite udostępni aplikację lokalnie pod adresem wyświetlonym w terminalu. Instrukcje dotyczące Androida i iOS znajdują się w [appetyt-mobile/README.md](appetyt-mobile/README.md).

### Testy i kontrola jakości

```bash
make api-lint
make api-test
make scripts-test
```

## 🤝 Contributing

Zgłoszenia błędów, propozycje funkcji i pull requesty są mile widziane. Przed rozpoczęciem pracy przeczytaj [CONTRIBUTING.md](CONTRIBUTING.md) oraz [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

Podatności bezpieczeństwa zgłaszaj prywatnie zgodnie z [SECURITY.md](SECURITY.md), a nie przez publiczne GitHub Issues.

## 📄 Licencja

Projekt jest udostępniany na licencji [MIT](LICENSE).
