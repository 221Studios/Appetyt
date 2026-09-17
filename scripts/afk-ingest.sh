#!/usr/bin/env bash
# Detached recipe ingest: YouTube remainder, then HTML fallback.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
mkdir -p .sandcastle/logs
LOG=".sandcastle/logs/afk-ingest-$(date +%Y%m%d-%H%M%S).log"
exec >>"$LOG" 2>&1
echo "afk ingest start $(date -Is) log=$LOG"

timeout 8h python3 -u scripts/ingest_youtube.py --max-videos 80 --delay 0.25
echo "yt ingest ended $(date -Is) status=$?"

python3 scripts/recipe_quality_report.py || true

echo "html-fallback crawl start $(date -Is)"
timeout 6h python3 -u scripts/crawl_recipes.py \
  --html-fallback --only-no-jsonld --limit 40 --delay 0.3
echo "html crawl ended $(date -Is) status=$?"

python3 scripts/recipe_quality_report.py || true
COUNT=$(sqlite3 data/recipes.sqlite "SELECT COUNT(*) FROM recipes;" || echo "?")
echo "afk ingest done $(date -Is) recipes=$COUNT"
