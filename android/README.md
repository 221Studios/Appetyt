# Appetyt Foxx — Android

Natywna aplikacja Android z lokalnym katalogiem 64 kompletnych przepisów Foxx Gotuje.

## Build

Z katalogu `android/`:

```bash
gradle assembleDebug
```

APK powstaje w `app/build/outputs/apk/debug/app-debug.apk`.

Plik `data/app_recipes.json` z katalogu głównego jest kopiowany do zasobów podczas builda. Aplikacja działa offline i nie wymaga uruchomionego API.
