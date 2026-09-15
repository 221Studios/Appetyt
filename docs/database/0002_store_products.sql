-- Co: osobna baza produktów sklepowych (ten sam schemat × 3 pliki).
-- Dlaczego: koszt przepisu per sklep (zużycie vs cały koszyk), bez mieszania katalogów.
-- Pliki: data/frisco.sqlite, data/auchan.sqlite, data/carrefour.sqlite
-- Sklep jest tożsamością pliku (store_meta.store_slug), nie kolumną w products.
-- Jak zastosować: python3 scripts/init_store_dbs.py
-- Jak sprawdzić: sqlite3 data/frisco.sqlite "SELECT * FROM store_meta; SELECT COUNT(*) FROM products;"
-- ingredient_id: opcjonalny fdc_id z data/ingredients.sqlite (nie FK między plikami).

CREATE TABLE IF NOT EXISTS store_meta (
    store_slug TEXT PRIMARY KEY,
    store_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
    product_id TEXT PRIMARY KEY,
    ean TEXT,
    name TEXT NOT NULL,
    brand TEXT,
    category TEXT,
    package_qty REAL NOT NULL,
    package_unit TEXT NOT NULL,
    package_size_g REAL,
    price_pln REAL NOT NULL,
    price_per_100g REAL,
    url TEXT,
    fetched_at TEXT NOT NULL,
    ingredient_id INTEGER
);

CREATE INDEX IF NOT EXISTS idx_products_ingredient ON products (ingredient_id);
CREATE INDEX IF NOT EXISTS idx_products_ean ON products (ean);
CREATE INDEX IF NOT EXISTS idx_products_name ON products (name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);
