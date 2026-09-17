# Appetyt

Mobilna aplikacja do odkrywania przepisów, zarządzania lodówką i planowania zakupów.

- `apps/mobile` — Expo React Native (Android/iOS)
- `backend` — FastAPI + SQLAlchemy + Alembic
- PostgreSQL — docelowa baza uruchamiana przez Docker Compose
- `scripts` i `data/*.sqlite` — istniejący pipeline oraz przejściowe źródła importu

Instrukcja uruchomienia: [`docs/mvp.md`](docs/mvp.md). Kontrakt API: `http://localhost:8000/docs` po starcie.
