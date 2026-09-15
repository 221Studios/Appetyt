# Checkpoint crawla (poziom 1 JSON-LD)

Baza: `data/recipes.sqlite`. Crawler pomija już zapisane `source_url`.

## Co zostało z tej kolejki

Poziom 1 (JSON-LD, nazwani szefowie/influ z listy) **jest skończony**.

Dalej: YouTube opisy → najpierw linki do stron (JSON-LD), potem tekst opisu.

```bash
python3 scripts/ingest_youtube.py --max-videos 25
```

## Domknięte

| twórca | przepisów (orientacyjnie) |
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
- media: `smaker`, `tasty`, `epicurious`, `the_recipe_critic`, `serious_eats`

Skip: `data/creators_gaps.json`
