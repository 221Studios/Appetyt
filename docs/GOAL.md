# Cel: MVP źródło → przepis kompletny → app-ready

Trzy etapy (nie mylić):

0. **MVP źródło** (teraz) — tylko 4 twórców: `foxx_gotuje`, `sam_the_cooking_guy`, `nick_digiovanni`, `joshua_weissman`. Najpierw domknięty katalog URL z **źródła pierwotnego** (oficjalna www / blog; re-discover + cross-check n3xusAPI / wyszukiwarka; każdy kandydat zweryfikowany przed kanonem). Potem w snapshotcie: `source_url` + lista składników **identyczny tekst 1:1** ze stroną (kolejność ma znaczenie; normalizacja białych znaków OK). Bez kroków jako bramki, bez USDA / sklepów / cen. Istniejący kanon zostaje; live audyt poprawia rozjazdy. Paywall / login = poza zakresem.
1. **Przepis kompletny** (snapshot, później) — linie jak w źródle, **kroki źródłowe** 1:1, każda linia → **składnik** USDA + gramy, ≥1 sklep z **produktem sklepowym** (lub **substytutem sklepowym**) na każdą linię, kcal/makro. Słownik: `CONTEXT.md`. ADR: `docs/adr/0001-…`, `0002-…`.
2. **Przepis app-ready** (runtime API) — kompletny przepis w API: **instrukcje operacyjne**, nutrition, koszty. UI dopiero gdy taki katalog jest w API.

## Pipeline (MVP)

```text
źródło pierwotne (www twórcy)
     → discover katalogu + cross-check (n3xusAPI / search) → weryfikacja URL
     → live audyt składników 1:1 vs data/recipes.sqlite
     → poprawki ingest tylko przy rozjeździe
     → raport MVP (pass/fail per URL)
```

Pełny pipeline (kompletny → API) bez zmian względem wcześniejszego celu — dopiero po domknięciu MVP źródło.

## Świadomie później

- Open Food Facts (`docs/later/open-food-facts.md`)
- tekstowe recenzje i synchronizacja dodatkowych danych konta; oceny liczbowe 1–10 są osobnym, bieżącym zakresem MVP
- UI katalogu przed uzyskaniem przepisów app-ready w API
- Androidowy przepływ logowania przez Google
- logowanie Google webowe — osobny fundament pod przyszłe recenzje, zgodnie z ADR `0003`–`0008`
- transkrypty YouTube / przepisy tylko z YT
- USDA / mapowanie sklepów / ceny (po MVP źródło)
