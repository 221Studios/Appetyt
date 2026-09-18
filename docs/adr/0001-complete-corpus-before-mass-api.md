# Najpierw przepis kompletny w snapshotcie, potem masa w API

Domknięcie korpusu (~50k) do **przepisów kompletnych** w snapshotcie ma pierwszeństwo przed masowym seedem / UI. Runtime API dostaje przepisy dopiero gdy są kompletne (most per twórca / po playbooku), a nie „prawie zmapowane” w skali 50k. Odrzucone: shipowanie częściowej jakości do apki, żeby szybciej zobaczyć UI.
