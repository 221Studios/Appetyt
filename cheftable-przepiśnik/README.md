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

## Android / iOS

```bash
npm run build
npx cap sync android ios
```

Android debug APK można zbudować w `android/` przez `./gradlew assembleDebug`.
