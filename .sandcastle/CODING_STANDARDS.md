# Coding standards

## Scope

- Appetyt stores recipes from named chefs and culinary influencers.
- Calories come from USDA FoodData Central (`fdc_id`).
- Do not use Spoonacular as storage. Open Food Facts is not MVP.

## Style

- Python 3, type hints, small scripts under `scripts/`.
- Reuse `parse_recipe_html`, `save_recipe`, `recipe_quality`, `extract_page_urls`.
- Comments only for non-obvious constraints (copyright, skip lists, abort rules).

## Testing

- Behavior tests in `tests/`. Red-green-refactor.
- Run `python3 -m unittest discover -s tests -q` before committing.
- Fixtures belong in `tests/` or small HTML strings, not live crawls in unit tests.

## Data

- Never invent ingredients, times, or nutrition.
- Never commit SQLite files or `data/raw/`.
- Skip aggregators listed in crawl scripts and `data/creators_gaps.json`.

## Git and issues

- One unblocked GitHub issue per iteration.
- Commit with `RALPH:` prefix.
- Do not modify unrelated files.
