-- Co: oryginalne kroki źródła + przybliżone gramy linii składnika.
-- Dlaczego: UI nie kopiuje prozy, ale apka musi mieć oryginał;
--           1/2 cebuli ma kcal i koszt zużycia vs koszt zakupu całej sztuki.
-- Właściciel migracji: backend/alembic/versions/0002_source_steps_grams.py
-- Jak zastosować: alembic -c backend/alembic.ini upgrade head
-- Jak sprawdzić: PRAGMA table_info(recipes); kolumna source_steps_json.
--                PRAGMA table_info(recipe_ingredients); kolumna amount_g.

-- recipes.source_steps_json TEXT  -- JSON lista oryginalnych kroków, nie do UI
-- recipe_ingredients.amount_g REAL  -- przybliżona gramatura (cebula 110 g, mała 70 g)
