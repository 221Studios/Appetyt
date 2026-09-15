#!/usr/bin/env bash
# After YouTube ingest exits: refresh report, then HTML crawl for no_jsonld.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
LOG=".sandcastle/logs/afk-after-yt-$(date +%Y%m%d-%H%M%S).log"
mkdir -p .sandcastle/logs
exec >>"$LOG" 2>&1
echo "watcher start $(date -Is)"
while pgrep -f "python3 -u scripts/ingest_youtube.py" >/dev/null 2>&1; do
  sleep 120
done
echo "yt ingest ended $(date -Is)"
python3 scripts/recipe_quality_report.py || true
echo "starting html-fallback crawl for no_recipe_jsonld"
timeout 4h python3 -u scripts/crawl_recipes.py \
  --html-fallback --only-no-jsonld --limit 40 --delay 0.3 \
  || true
python3 scripts/recipe_quality_report.py || true
COUNT=$(sqlite3 data/recipes.sqlite "SELECT COUNT(*) FROM recipes;" || echo "?")
echo "done $(date -Is) recipes=$COUNT"
