<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Appetyt

Frontend jest wspólny dla Androida i iOS (Capacitor). Katalog aplikacji jest generowany
z istniejących snapshotów Appetyt: kompletne przepisy, składniki z wartościami odżywczymi
oraz osobne katalogi cenowe Frisco, Auchan i Carrefour.

## Dane

Z katalogu repozytorium Appetyt uruchom eksport mobilny na lokalnej bazie runtime:

```bash
DATABASE_URL=sqlite:////tmp/appetyt-mobile.sqlite \
  PYTHONPATH=backend .venv/bin/python scripts/export_mobile_catalog.py \
  --out data/mobile_catalog.json
```

Przed pierwszym eksportem trzeba wykonać migracje i seed zgodnie z instrukcjami backendu.
Plik `data/mobile_catalog.json` jest generowany i ignorowany przez Git.

## Uruchomienie web

Wymagany Node.js:


1. Install dependencies:
   `npm install`
2. Generate `data/mobile_catalog.json` as above
3. Run the app:
   `npm run dev`

## Języki i tłumaczenia przepisów

Język interfejsu wybiera się w ikonie ustawień w prawym górnym rogu. Wybór
`Polski` / `English` jest zapisywany lokalnie i przełącza również tytuły,
składniki, ilości oraz kroki każdego przepisu.

Tłumaczenia katalogu są generowane przed buildem po stronie serwera przez
Gemini, a nie przez słownik słów w przeglądarce:

```bash
python3 scripts/export_mvp_mobile_catalog.py
cd cheftable-przepiśnik
GEMINI_TRANSLATION_MODEL=gemini-3.5-flash GEMINI_API_KEY=... npm run translate:catalog
npm run validate:translations
npm run build
```

Generator zapisuje wynik w `data/recipe_translations.json`, zachowuje cache po
ID przepisu i odrzuca odpowiedź, jeśli model zmieni liczbę ilości, składników
lub kroków. Klucza API nie wolno dodawać do bundla aplikacji.

Można też tłumaczyć lokalnie, bez klucza API i limitu zapytań. Wymaga to
uruchomionej lokalnej Ollamy/n3xusAPI; model działa wolniej na samym CPU:

```bash
npm run translate:catalog:local
npm run validate:translations
```

Do szybszego przetworzenia kolejki bez klucza można użyć darmowego endpointu
Google Translate, z tym samym cache'em i walidacją struktury oraz ilości:

```bash
npm run translate:catalog:free
npm run validate:translations
```

## Android / iOS

```bash
npm run build
npx cap sync android ios
```

Android debug APK można zbudować w `android/` przez `./gradlew assembleDebug`.
