-- Co: URL kanału YouTube (handle), gdy channel_id jeszcze nieznane.
-- Dlaczego: lista seedu podaje @handle albo samo youtube.com, nie zawsze UC...
-- Jak zastosować: python3 scripts/import_creators.py
-- Jak sprawdzić: sqlite3 data/recipes.sqlite "PRAGMA table_info(creators);"

ALTER TABLE creators ADD COLUMN youtube_url TEXT;
