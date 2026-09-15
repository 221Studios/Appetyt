# Checkpoint crawla / ingestu

Baza: `data/recipes.sqlite`. Crawler i YouTube pomijają już zapisane `source_url`.

## Stan pipeline

| poziom | status |
|---|---|
| 1. JSON-LD na stronach twórców | **skończony** (named list) |
| 2. YouTube opisy → URL → JSON-LD / HTML / n3xusAPI | **w toku** |
| 3. Składniki z samego opisu YT (bez strony) | włączone w `ingest_youtube.py` |
| 4. Transkrypty | nie teraz |

Skip aggregatorów (crawl + YT + raport): `smaker`, `tasty`, `epicurious`, `serious_eats`, `the_recipe_critic` — `data/creators_gaps.json` (`aggregators_skip`, `media_skip`).

Sandcastle issues 3/5/8: kod + testy. Pętla AFK pada na limicie użycia Cursor (`auto` / composer). Kontynuacja ręczna / ingest w tle.

```bash
python3 scripts/ingest_youtube.py --max-videos 25
python3 scripts/recipe_quality_report.py
```

## Domknięte (poziom 1, orientacyjnie)

| twórca | przepisów |
|---|---|
| jamie_oliver | 4469 |
| sallys_baking_addiction | 1149 |
| natashas_kitchen | 1076 |
| recipetin_eats | 950 |
| the_woks_of_life | 1283 |
| preppy_kitchen | 538 |
| sip_and_feast | 458 |
| aaron_and_claire | 285 |
| brian_lagerstrom | 234 |
| gordon_ramsay | 172 |
| raymond_blanc | 84 |

## Ucięte / pominięte

- `half_baked_harvest` — ~4,5k URL, plateau ~400
- `seonkyoung_longest`, `po_prostu_pycha`, `marions_kitchen`
- media/agregatory: `smaker`, `tasty`, `epicurious`, `the_recipe_critic`, `serious_eats`

Skip: `data/creators_gaps.json`. Postęp YT: `data/raw/youtube_progress.json`.
