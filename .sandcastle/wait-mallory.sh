#!/usr/bin/env bash
set -u
cd /home/n3xus/Projekty/Appetyt
LOG=.sandcastle/logs/mallory-crawl.log
# Wait until the big blog queue (python driver that prints FULL START) is gone.
# Match crawl_recipes without matching this script.
while pgrep -af 'scripts/crawl_recipes.py' | grep -v munchies_by_mallory >/dev/null 2>&1; do
  sleep 60
done
# Also wait for the orchestrator bash that still has FULL DONE in cmdline via python -u - <<
while pgrep -af 'FULL DONE \{cid\}' >/dev/null 2>&1; do
  sleep 60
done
echo "mallory crawl start $(date -Is)" | tee -a "$LOG"
python3 -u scripts/crawl_recipes.py --creator-id munchies_by_mallory --limit 0 --delay 0.3 --html-fallback >>"$LOG" 2>&1
echo "mallory crawl done $(date -Is) status=$?" | tee -a "$LOG"
