# Status nocny (2026-09-16 ~01:15)

## Sandcastle
**Nie działa.** Cursor usage limit na modelach (`auto` / composer). Reset cyklu: 2026-10-04 albo spend limit w ustawieniach.

## Co jedzie teraz
1. `ingest_youtube.py --max-videos 80` — timeout 6h, log: `.sandcastle/logs/yt-ingest-*.log`
2. Po YT: `scripts/afk-after-yt.sh` → quality report + crawl `--html-fallback --only-no-jsonld`

## Domknięte tej nocy
- Issues #3, #5, #8 zamknięte
- #9, #10 otwarte (YT + HTML)
- Usunięte ~3408 wierszy aggregatorów ze sqlite
- Raport: `docs/quality-report.md`

## Sprawdź po powrocie
```bash
pgrep -af ingest_youtube
tail -50 .sandcastle/logs/yt-ingest-*.log
sqlite3 data/recipes.sqlite 'SELECT COUNT(*) FROM recipes;'
python3 scripts/recipe_quality_report.py
gh issue list --label Sandcastle
```
