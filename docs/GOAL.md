# Cel: przepis kompletny → app-ready

Dwa etapy (nie mylić):

1. **Przepis kompletny** (snapshot) — linie jak w źródle, **kroki źródłowe** 1:1, każda linia → **składnik** USDA + gramy, ≥1 sklep z **produktem sklepowym** (lub **substytutem sklepowym**) na każdą linię, kcal/makro (suma przepisu + per serving). Paywall poza zakresem. Słownik: `CONTEXT.md`. ADR: `docs/adr/0001-…`, `0002-…`.
2. **Przepis app-ready** (runtime API) — kompletny przepis przeniesiony do API: **instrukcje operacyjne**, nutrition, koszty. UI dopiero gdy taki katalog jest w API — nie gdy „prawie zmapowany” crawl.

Najpierw domykamy korpus w snapshotcie (twórca po twórcy). Most do API to smoke / późniejszy eksport, nie skrót do frontendu.

## Pipeline

```text
źródło pierwotne (publiczna www)
     → katalog URL (np. discover_foxx_catalog)
     → ingest → data/recipes.sqlite  (+ archiwum starego crawl’a)
     → mapowanie linii / gramy / USDA / sklep
     → completeness_verdict  (przepis kompletny)
     → scripts/export_app_recipes.py → data/app_recipes.json
     → backend seed → Postgres
     → GET /api/v1/recipes/{id}  (przepis app-ready)
```

## Świadomie później

- Open Food Facts (`docs/later/open-food-facts.md`)
- konta / sync / UI
- transkrypty YouTube
