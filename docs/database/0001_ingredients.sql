-- Co: tabela składników v1 (kalorie i makro na 100 g).
-- Dlaczego: rdzeń aplikacji z przepisami; ID ze USDA (fdc_id).
-- Źródło: FoodData Central Foundation Foods (2026-04) + SR Legacy (2018-04).
-- Jak zastosować: python3 scripts/import_usda.py
-- Jak sprawdzić: SELECT COUNT(*) FROM ingredients;
--                 SELECT * FROM ingredients WHERE name_en LIKE '%chicken%' LIMIT 5;

CREATE TABLE IF NOT EXISTS ingredients (
    ingredient_id INTEGER PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_pl TEXT,
    kcal_per_100g REAL,
    protein REAL,
    fat REAL,
    carbs REAL,
    data_type TEXT NOT NULL,
    source_release TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ingredients_name_en ON ingredients (name_en);
CREATE INDEX IF NOT EXISTS idx_ingredients_data_type ON ingredients (data_type);
