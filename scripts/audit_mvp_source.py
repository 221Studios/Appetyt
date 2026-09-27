"""MVP źródło: audyt katalogu URL + składniki 1:1 vs live dla 4 twórców."""

from __future__ import annotations

import argparse
import json
import sqlite3
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.html_recipe import parse_html_recipe
from scripts.ingredient_match import ingredients_match_exact, normalize_ingredient_list
from scripts.schema_recipe import fetch_html, parse_recipe_html, save_recipe

DEFAULT_DB = ROOT / "data" / "recipes.sqlite"
DEFAULT_OUT = ROOT / "data" / "mvp_source_audit.json"

CREATORS = {
    "foxx_gotuje": {
        "catalog": ROOT / "data" / "foxx_gotuje_catalog.json",
        "site": "adifoxx.pl",
    },
    "sam_the_cooking_guy": {
        # MVP: tylko strony z publiczną listą składników (patrz discover + probe).
        "catalog": ROOT / "data" / "sam_the_cooking_guy_mvp_catalog.json",
        "site": "thecookingguy.com",
    },
    "nick_digiovanni": {
        "catalog": ROOT / "data" / "nick_digiovanni_catalog.json",
        "site": "nickskitchen.com",
    },
    "joshua_weissman": {
        "catalog": ROOT / "data" / "joshua_weissman_catalog.json",
        "site": "joshuaweissman.com",
    },
}

FetchFn = Callable[[str], str]
ParseFn = Callable[[str, str], dict | None]


def _host(url: str) -> str:
    return urlparse(url).netloc.lower().removeprefix("www.")


def load_catalog_urls(path: Path) -> list[str]:
    data = json.loads(path.read_text(encoding="utf-8"))
    recipes = data.get("recipes") or []
    urls: list[str] = []
    for row in recipes:
        if isinstance(row, dict) and row.get("source_url"):
            urls.append(row["source_url"])
        elif isinstance(row, str):
            urls.append(row)
    return sorted(set(urls))


def parse_live_recipe(html: str, source_url: str) -> dict | None:
    return parse_recipe_html(html, source_url) or parse_html_recipe(html, source_url)


def load_db_row(conn: sqlite3.Connection, source_url: str) -> dict | None:
    row = conn.execute(
        "SELECT source_url, creator_id, title, ingredients_json, source_steps_json "
        "FROM recipes WHERE source_url = ?",
        (source_url,),
    ).fetchone()
    if row is None:
        return None
    return {
        "source_url": row["source_url"],
        "creator_id": row["creator_id"],
        "title": row["title"],
        "ingredients": json.loads(row["ingredients_json"] or "[]"),
        "source_steps": json.loads(row["source_steps_json"] or "[]"),
    }


def audit_one(
    *,
    source_url: str,
    stored: dict | None,
    fetch: FetchFn,
    parse: ParseFn,
) -> dict:
    result = {
        "source_url": source_url,
        "in_db": stored is not None,
        "status": "unknown",
        "match": False,
        "stored_count": 0,
        "live_count": 0,
        "first_diff": None,
        "error": None,
        "title": (stored or {}).get("title"),
    }
    if stored is None:
        result["status"] = "missing_from_db"
        return result
    try:
        html = fetch(source_url)
        live = parse(html, source_url)
    except Exception as exc:
        result["status"] = "fetch_or_parse_error"
        result["error"] = str(exc)[:300]
        return result
    if live is None:
        result["status"] = "live_parse_failed"
        return result
    cmp = ingredients_match_exact(stored.get("ingredients"), live.get("ingredients"))
    result.update(
        {
            "match": cmp["match"],
            "stored_count": cmp["stored_count"],
            "live_count": cmp["live_count"],
            "first_diff": cmp["first_diff"],
            "status": "pass" if cmp["match"] else "ingredient_mismatch",
            "live_title": live.get("title"),
            "live_ingredients": normalize_ingredient_list(live.get("ingredients")),
        }
    )
    return result


def repair_one(
    *,
    source_url: str,
    creator_id: str,
    fetch: FetchFn,
    parse: ParseFn,
    db_path: Path,
) -> dict:
    html = fetch(source_url)
    live = parse(html, source_url)
    if live is None:
        return {"source_url": source_url, "repaired": False, "error": "live_parse_failed"}
    save_recipe(live, creator_id=creator_id, db_path=db_path)
    return {
        "source_url": source_url,
        "repaired": True,
        "ingredient_count": len(normalize_ingredient_list(live.get("ingredients"))),
        "title": live.get("title"),
    }


def audit_creator(
    creator_id: str,
    *,
    recipes_db: Path,
    fetch: FetchFn = fetch_html,
    parse: ParseFn = parse_live_recipe,
    limit: int | None = None,
    workers: int = 8,
    repair: bool = False,
) -> dict:
    meta = CREATORS[creator_id]
    catalog_path = meta["catalog"]
    if not catalog_path.exists():
        raise FileNotFoundError(catalog_path)
    urls = load_catalog_urls(catalog_path)
    if limit is not None:
        urls = urls[:limit]

    conn = sqlite3.connect(recipes_db)
    conn.row_factory = sqlite3.Row
    db_urls = {
        row[0]
        for row in conn.execute(
            "SELECT source_url FROM recipes WHERE creator_id = ?",
            (creator_id,),
        )
    }
    extra_in_db = sorted(db_urls - set(urls))

    stored_by_url = {url: load_db_row(conn, url) for url in urls}
    conn.close()

    results: list[dict] = []
    with ThreadPoolExecutor(max_workers=max(1, workers)) as pool:
        futures = {
            pool.submit(
                audit_one,
                source_url=url,
                stored=stored_by_url.get(url),
                fetch=fetch,
                parse=parse,
            ): url
            for url in urls
        }
        for fut in as_completed(futures):
            results.append(fut.result())
    results.sort(key=lambda r: r["source_url"])

    repaired: list[dict] = []
    if repair:
        for item in results:
            if item["status"] in {"ingredient_mismatch", "missing_from_db"}:
                try:
                    repaired.append(
                        repair_one(
                            source_url=item["source_url"],
                            creator_id=creator_id,
                            fetch=fetch,
                            parse=parse,
                            db_path=recipes_db,
                        )
                    )
                except Exception as exc:
                    repaired.append(
                        {
                            "source_url": item["source_url"],
                            "repaired": False,
                            "error": str(exc)[:300],
                        }
                    )
            # drop bulky live list from final report after repair attempt
        # re-audit repaired URLs
        if repaired:
            conn = sqlite3.connect(recipes_db)
            conn.row_factory = sqlite3.Row
            for item in results:
                if item["status"] in {"ingredient_mismatch", "missing_from_db"}:
                    stored = load_db_row(conn, item["source_url"])
                    refreshed = audit_one(
                        source_url=item["source_url"],
                        stored=stored,
                        fetch=fetch,
                        parse=parse,
                    )
                    item.clear()
                    item.update(refreshed)
            conn.close()

    for item in results:
        item.pop("live_ingredients", None)

    pass_n = sum(1 for r in results if r.get("status") == "pass")
    fail_n = len(results) - pass_n
    samples = [r for r in results if r.get("status") == "pass"][:5]
    fail_samples = [r for r in results if r.get("status") != "pass"][:12]

    return {
        "creator_id": creator_id,
        "catalog_path": str(catalog_path),
        "catalog_count": len(urls),
        "extra_in_db_count": len(extra_in_db),
        "extra_in_db_sample": extra_in_db[:20],
        "pass": pass_n,
        "fail": fail_n,
        "status_counts": _count_status(results),
        "pass_samples": samples,
        "fail_samples": fail_samples,
        "repaired": repaired,
        "recipes": results,
    }


def _count_status(results: list[dict]) -> dict[str, int]:
    out: dict[str, int] = {}
    for row in results:
        key = row.get("status") or "unknown"
        out[key] = out.get(key, 0) + 1
    return out


def run_mvp_audit(
    *,
    recipes_db: Path | None = None,
    creators: list[str] | None = None,
    limit: int | None = None,
    workers: int = 8,
    repair: bool = False,
    fetch: FetchFn = fetch_html,
    parse: ParseFn = parse_live_recipe,
) -> dict:
    db = Path(recipes_db or DEFAULT_DB)
    ids = creators or list(CREATORS.keys())
    by_creator = []
    for creator_id in ids:
        by_creator.append(
            audit_creator(
                creator_id,
                recipes_db=db,
                fetch=fetch,
                parse=parse,
                limit=limit,
                workers=workers,
                repair=repair,
            )
        )
        # be polite between creators
        time.sleep(0.2)
    total_pass = sum(c["pass"] for c in by_creator)
    total_fail = sum(c["fail"] for c in by_creator)
    total_catalog = sum(c["catalog_count"] for c in by_creator)
    return {
        "schema_version": 1,
        "audited_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "mvp": "source_url + ingredients exact 1:1",
        "recipes_db": str(db),
        "catalog_total": total_catalog,
        "pass": total_pass,
        "fail": total_fail,
        "all_pass": total_fail == 0,
        "creators": by_creator,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="MVP source audit: catalog + ingredients 1:1.")
    parser.add_argument("--db", type=Path, default=DEFAULT_DB)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--creator", action="append", dest="creators")
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--workers", type=int, default=8)
    parser.add_argument("--repair", action="store_true")
    parser.add_argument(
        "--summary-only",
        action="store_true",
        help="Write report without per-recipe list (smaller file).",
    )
    args = parser.parse_args()
    report = run_mvp_audit(
        recipes_db=args.db,
        creators=args.creators,
        limit=args.limit,
        workers=args.workers,
        repair=args.repair,
    )
    if args.summary_only:
        for creator in report["creators"]:
            creator.pop("recipes", None)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    summary = {
        "out": str(args.out),
        "catalog_total": report["catalog_total"],
        "pass": report["pass"],
        "fail": report["fail"],
        "all_pass": report["all_pass"],
        "by_creator": {
            c["creator_id"]: {
                "catalog": c["catalog_count"],
                "pass": c["pass"],
                "fail": c["fail"],
                "status_counts": c["status_counts"],
                "extra_in_db": c["extra_in_db_count"],
            }
            for c in report["creators"]
        },
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
