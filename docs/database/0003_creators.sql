-- Co: rejestr twórców przepisów (seed), osobna baza od USDA i katalogów sklepów.
-- Dlaczego: pipeline pozyskiwania idzie od twórcy i jego źródła pierwotnego,
--           nie od 200 osobnych scraperów naraz.
-- Plik: data/recipes.sqlite
-- Seed: data/creators.json
-- Jak zastosować: python3 scripts/import_creators.py
-- Jak sprawdzić: sqlite3 data/recipes.sqlite "SELECT category, COUNT(*) FROM creators GROUP BY category;"

CREATE TABLE IF NOT EXISTS creators (
    creator_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'influencer_pl',
        'chef_pl',
        'influencer_global',
        'chef_global'
    )),
    primary_source TEXT NOT NULL CHECK (primary_source IN (
        'website',
        'youtube_description',
        'youtube_transcript'
    )),
    website_url TEXT,
    youtube_channel_id TEXT,
    language TEXT NOT NULL CHECK (language IN ('pl', 'en'))
);

CREATE INDEX IF NOT EXISTS idx_creators_category ON creators (category);
CREATE INDEX IF NOT EXISTS idx_creators_primary_source ON creators (primary_source);
