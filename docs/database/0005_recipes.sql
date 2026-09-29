-- Co: tabela przepisów z parsera Schema.org/Recipe (JSON-LD).
-- Dlaczego: poziom 1 pipeline'u — składniki, czas, link; bez kopiowania prozy do UI.
-- Plik: data/recipes.sqlite (ta sama baza co creators)
-- Jak zastosować: python3 scripts/parse_schema_recipe.py <url>
-- Jak sprawdzić: sqlite3 data/recipes.sqlite "SELECT title, source_url FROM recipes LIMIT 5;"
-- source_steps_json: oryginalne kroki z JSON-LD, nie do wyświetlenia w apce.

CREATE TABLE IF NOT EXISTS recipes (
    source_url TEXT PRIMARY KEY,
    creator_id TEXT,
    title TEXT NOT NULL,
    prep_minutes INTEGER,
    cook_minutes INTEGER,
    total_minutes INTEGER,
    recipe_yield TEXT,
    ingredients_json TEXT NOT NULL,
    ingredient_sections_json TEXT,
    source_steps_json TEXT,
    fetched_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_recipes_creator ON recipes (creator_id);
