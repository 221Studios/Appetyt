# Appetyt MVP

## Uruchomienie od czystego klona

Wymagany jest Docker z Compose, Node.js 20+ oraz Expo Go zgodne z Expo SDK 57.

```bash
git clone <repo-url> && cd Appetyt
docker compose up --build
```

API działa pod `http://localhost:8000`, a dokumentacja OpenAPI pod `http://localhost:8000/docs`.

W drugim terminalu uruchom aplikację mobilną:

```bash
cd apps/mobile
cp .env.example .env
npm ci
npx expo install --check
npm start
```

Na fizycznym Androidzie ustaw w `apps/mobile/.env` adres LAN komputera, np. `EXPO_PUBLIC_API_URL=http://192.168.1.20:8000/api/v1`. Telefon i komputer muszą być w tej samej sieci. W Expo Go zeskanuj kod QR. Nie używaj `localhost` na telefonie — oznacza on telefon, nie komputer.

## Sprawdzenie

```bash
curl http://localhost:8000/healthz
curl 'http://localhost:8000/api/v1/recipes?limit=100'
```

Migracje Alembic i deterministyczny seed uruchamiają się przy starcie kontenera API. Seed importuje sprawdzone snapshoty SQLite składników, twórców i katalogów oraz dodaje pięć jawnych przepisów testowych.

## Ograniczenia MVP

- Stan lodówki, zapisanych przepisów i listy zakupów jest wyłącznie lokalny w AsyncStorage. Nie ma kont ani synchronizacji.
- Ceny Frisco, Auchan i Carrefour są orientacyjne. Każda odpowiedź kosztowa oznacza to jawnie i zawiera źródło oraz datę katalogu, jeśli jest dostępna.
- Pięć przepisów testowych to oryginalne, krótkie instrukcje MVP. API przechowuje linki do źródeł, ale aplikacja nie kopiuje zdjęć ani literackich opisów.
- Dopasowanie lodówki w kliencie jest podstawowym MVP; pełne mapowanie jednostek i zamienników wymaga osobnego etapu.
- Nie ma kont, płatności, chmurowego wdrożenia, ingestu 200 twórców ani Open Food Facts.
