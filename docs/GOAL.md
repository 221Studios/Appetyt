# Cel: app-ready przepis

Przepis w runtime API jest gotowy dopiero gdy jednocześnie:

1. **Składniki** — linie z ilością/jednostką; maksimów `ingredient_id` zmapowane na USDA
2. **Kcal + makro** — policzone ze zmapowanych składników (na porcję / przepis)
3. **Cena** — `usage_cost` i `basket_cost` dla Frisco / Auchan / Carrefour (orientacyjnie, ze źródłem katalogu)
4. **Kroki** — krótkie instrukcje operacyjne + `source_url` do oryginału (bez kopiowania prozy/zdjęć)

Dopóki katalog w API tego nie spełnia masowo, **nie wracamy do frontendu**.

## Pipeline

```text
crawl / YT → data/recipes.sqlite
     → mapowanie linii (map_recipe_line / app_recipe)
     → scripts/export_app_recipes.py → data/app_recipes.json
     → backend seed → Postgres
     → GET /api/v1/recipes/{id}  (z costs + nutrition)
```

## Świadomie później

- Open Food Facts (`docs/later/open-food-facts.md`)
- konta / sync / UI
- transkrypty YouTube
