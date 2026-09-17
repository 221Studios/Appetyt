#!/usr/bin/env python3
"""Discover recipe URLs from sitemaps, then parse Schema.org JSON-LD."""

from __future__ import annotations

import argparse
import gzip
import json
import re
import socket
import sqlite3
import sys
import time
import urllib.request
import xml.etree.ElementTree as ET
from http.client import IncompleteRead
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse

socket.setdefaulttimeout(20)

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.html_recipe import parse_html_recipe
from scripts.import_creators import SEED_PATH, load_seed
from scripts.n3xusapi_recipe import parse_via_n3xusapi
from scripts.schema_recipe import (
    DB_PATH,
    USER_AGENT,
    parse_recipe_html,
    save_recipe,
)

GAPS_PATH = ROOT / "data" / "creators_gaps.json"
PROGRESS_PATH = ROOT / "data" / "raw" / "crawl_progress.json"

RECIPE_PATH_RE = re.compile(
    r"/(recipes?|przepis(?:y)?|recept(?:e|en|er)?|recettes?|ricette|"
    r"rezepte?|cooking)(/|$)",
    re.IGNORECASE,
)
SKIP_PATH_RE = re.compile(
    r"/(tag|tags|category|categories|author|page|wp-json|wp-content|"
    r"kategoria|tagi|autor|feed|comments)(/|$)",
    re.IGNORECASE,
)
HREF_RE = re.compile(r"""href\s*=\s*["']([^"'#]+)""", re.I)
INDEX_PATH_RE = re.compile(
    r"/(recipes?|przepis(?:y)?|blog|blogs/(?:przepisy|recipes)|archive)(/|$)",
    re.I,
)


def _local_tag(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def origin_of(url: str) -> str:
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}"


def sitemap_key(url: str) -> str:
    parsed = urlparse(url)
    host = parsed.netloc.lower().removeprefix("www.")
    return host + parsed.path.rstrip("/")


def looks_like_recipe_url(url: str) -> bool:
    path = urlparse(url).path or "/"
    return RECIPE_PATH_RE.search(path) is not None


def usable_page_url(url: str) -> bool:
    path = urlparse(url).path or "/"
    if path in ("", "/"):
        return False
    if path.rstrip("/").endswith("/recipes/all"):
        return False
    return SKIP_PATH_RE.search(path) is None


def path_depth(url: str) -> int:
    return len([part for part in urlparse(url).path.split("/") if part])


def parse_sitemap_xml(xml_text: str) -> tuple[str, list[str]]:
    root = ET.fromstring(xml_text)
    kind = _local_tag(root.tag)
    locs: list[str] = []
    if kind == "sitemapindex":
        for node in root:
            if _local_tag(node.tag) != "sitemap":
                continue
            for child in node:
                if _local_tag(child.tag) == "loc" and child.text:
                    locs.append(child.text.strip())
        return "index", locs
    if kind == "urlset":
        for node in root:
            if _local_tag(node.tag) != "url":
                continue
            for child in node:
                if _local_tag(child.tag) == "loc" and child.text:
                    locs.append(child.text.strip())
        return "urlset", locs
    raise ValueError(f"not a sitemap: {kind}")


def sitemap_urls_from_robots(robots_text: str) -> list[str]:
    urls = []
    for line in robots_text.splitlines():
        if line.lower().startswith("sitemap:"):
            url = line.split(":", 1)[1].strip()
            if url:
                urls.append(url)
    return urls


def fetch_bytes(url: str, timeout: int = 30) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as response:
        raw = response.read()
    if url.endswith(".gz") or raw[:2] == b"\x1f\x8b":
        raw = gzip.decompress(raw)
    return raw


def fetch_text(url: str, timeout: int = 30) -> str | None:
    try:
        raw = fetch_bytes(url, timeout=timeout)
    except (
        HTTPError,
        URLError,
        TimeoutError,
        IncompleteRead,
        gzip.BadGzipFile,
        OSError,
    ):
        return None
    return raw.decode("utf-8", errors="replace")


def skip_creator_ids(
    path: Path | None = None, *, allow_no_jsonld: bool = False
) -> set[str]:
    payload = json.loads((path or GAPS_PATH).read_text(encoding="utf-8"))
    skip: set[str] = set()
    keys = [
        "wrong_identity",
        "site_is_not_recipes",
        "not_cooking",
        "aggregators_skip",
        "media_skip",
        "sitemap_bloated",
    ]
    if not allow_no_jsonld:
        keys.append("no_recipe_jsonld")
        keys.append("no_sitemap")
    for key in keys:
        skip.update(payload.get(key) or [])
    return skip


def record_gap(bucket: str, creator_id: str, path: Path | None = None) -> None:
    gaps_path = path or GAPS_PATH
    payload = json.loads(gaps_path.read_text(encoding="utf-8"))
    ids = payload.setdefault(bucket, [])
    if creator_id in ids:
        return
    ids.append(creator_id)
    gaps_path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"gap {bucket} {creator_id}", flush=True)


def website_creators(
    seed_path: Path | None = None, *, allow_no_jsonld: bool = False
) -> list[tuple]:
    skip = skip_creator_ids(allow_no_jsonld=allow_no_jsonld)
    rows = []
    for row in load_seed(seed_path or SEED_PATH):
        creator_id, _name, _cat, primary, website_url, *_rest = row
        if primary != "website" or not website_url:
            continue
        if creator_id in skip:
            continue
        rows.append(row)
    return rows


def rank_urls(urls: list[str]) -> list[str]:
    seen: set[str] = set()
    ranked = []
    for url in urls:
        if url in seen:
            continue
        seen.add(url)
        ranked.append(url)
    ranked.sort(key=lambda u: (0 if looks_like_recipe_url(u) else 1, -path_depth(u), u))
    return ranked


def same_site(url: str, website_url: str) -> bool:
    a = urlparse(url).netloc.lower().removeprefix("www.")
    b = urlparse(website_url).netloc.lower().removeprefix("www.")
    return bool(a) and a == b


def extract_links(html: str, base: str) -> list[str]:
    links: list[str] = []
    for href in HREF_RE.findall(html):
        absolute = urljoin(base, href.strip())
        if absolute.startswith("http"):
            links.append(absolute.split("#")[0])
    return links


def collect_listing_urls(website_url: str, max_index_pages: int = 40) -> list[str]:
    found: list[str] = []
    seen_idx: set[str] = set()
    queue = [website_url]
    while queue and len(seen_idx) < max_index_pages:
        url = queue.pop(0)
        if url in seen_idx:
            continue
        seen_idx.add(url)
        html = fetch_text(url)
        if not html:
            continue
        for link in extract_links(html, url):
            if not same_site(link, website_url):
                continue
            path = urlparse(link).path.lower()
            query = urlparse(link).query.lower()
            if "page=" in query or re.search(r"/page/\d+", path):
                queue.append(link)
            if INDEX_PATH_RE.search(path) and not looks_like_recipe_url(link):
                queue.append(link)
            found.append(link)
    return found


def pick_candidates(pages: list[str]) -> list[str]:
    ranked = rank_urls(pages)
    usable = [url for url in ranked if usable_page_url(url)]
    recipe_like = [url for url in usable if looks_like_recipe_url(url)]
    if len(recipe_like) >= 20:
        return recipe_like
    return usable


def recipe_quality(recipe: dict) -> str | None:
    from scripts.recipe_junk import junk_reason

    return junk_reason(recipe)


def existing_source_urls(db_path: Path | None = None) -> set[str]:
    path = db_path or DB_PATH
    if not path.exists():
        return set()
    conn = sqlite3.connect(path)
    try:
        rows = conn.execute("SELECT source_url FROM recipes").fetchall()
    except sqlite3.OperationalError:
        return set()
    finally:
        conn.close()
    return {row[0] for row in rows}


def quality_report(db_path: Path | None = None) -> dict:
    path = db_path or DB_PATH
    conn = sqlite3.connect(path)
    try:
        total = conn.execute("SELECT COUNT(*) FROM recipes").fetchone()[0]
        by_creator = conn.execute(
            """
            SELECT creator_id, COUNT(*) FROM recipes
            GROUP BY creator_id ORDER BY COUNT(*) DESC
            """
        ).fetchall()
        weak = conn.execute(
            """
            SELECT COUNT(*) FROM recipes
            WHERE json_array_length(ingredients_json) < 3
            """
        ).fetchone()[0]
        no_time = conn.execute(
            """
            SELECT COUNT(*) FROM recipes
            WHERE prep_minutes IS NULL AND cook_minutes IS NULL
              AND total_minutes IS NULL
            """
        ).fetchone()[0]
        avg_ing = conn.execute(
            "SELECT AVG(json_array_length(ingredients_json)) FROM recipes"
        ).fetchone()[0]
    finally:
        conn.close()
    return {
        "recipes": total,
        "few_ingredients": weak,
        "no_time": no_time,
        "avg_ingredients": round(avg_ing or 0, 2),
        "by_creator": [{"creator_id": c, "n": n} for c, n in by_creator],
    }


def discover_sitemap_seeds(website_url: str) -> list[str]:
    parsed = urlparse(website_url)
    hosts = [parsed.netloc]
    host = parsed.netloc
    if host.startswith("www."):
        hosts.append(host[4:])
    else:
        hosts.append("www." + host)
    seeds: list[str] = []
    seen: set[str] = set()
    for host_name in hosts:
        origin = f"{parsed.scheme}://{host_name}"
        robots = fetch_text(urljoin(origin + "/", "robots.txt"))
        if robots:
            for url in sitemap_urls_from_robots(robots):
                if url not in seen:
                    seen.add(url)
                    seeds.append(url)
        for path in ("sitemap.xml", "sitemap_index.xml"):
            url = urljoin(origin + "/", path)
            if url not in seen:
                seen.add(url)
                seeds.append(url)
    return seeds


def collect_page_urls(
    website_url: str,
    want: int = 0,
    max_sitemaps: int = 25,
) -> list[str]:
    pages: list[str] = []
    queue = discover_sitemap_seeds(website_url)
    seen_maps: set[str] = set()
    opened = 0
    page_cap = None if want <= 0 else max(want * 12, 400)
    while queue and opened < max_sitemaps:
        if page_cap is not None and len(pages) >= page_cap:
            break
        sitemap_url = queue.pop(0)
        if sitemap_url.endswith(".gz"):
            continue
        key = sitemap_key(sitemap_url)
        if key in seen_maps:
            continue
        seen_maps.add(key)
        print(f"fetch sitemap {sitemap_url}", flush=True)
        xml_text = fetch_text(sitemap_url)
        if not xml_text or "<" not in xml_text:
            continue
        try:
            kind, locs = parse_sitemap_xml(xml_text)
        except (ET.ParseError, ValueError):
            continue
        opened += 1
        print(f"sitemap {opened} {sitemap_url} urls={len(pages)}", flush=True)
        if kind == "index":
            child = []
            for loc in locs:
                if sitemap_key(loc) not in seen_maps:
                    child.append(loc)

            def sitemap_score(url: str) -> int:
                lower = url.lower()
                if any(token in lower for token in ("recipe", "przepis", "post")):
                    return 0
                if any(token in lower for token in ("category", "tag", "author", "page")):
                    return 2
                return 1

            child.sort(key=sitemap_score)
            queue = child + queue
            print(f"sitemap index {sitemap_url} children={len(locs)}", flush=True)
            continue
        pages.extend(locs)
    listing = collect_listing_urls(website_url)
    return pick_candidates(pages + listing)


def _unlimited(limit: int) -> bool:
    return limit <= 0


def crawl_creator(
    creator_id: str,
    website_url: str,
    limit: int,
    db_path: Path | None = None,
    delay_secs: float = 0.4,
    dry_run: bool = False,
    html_fallback: bool = False,
) -> dict:
    known = existing_source_urls(db_path)
    candidates = collect_page_urls(website_url, want=limit)
    saved = 0
    skipped_ld = 0
    skipped_exist = 0
    skipped_quality = 0
    fetch_fail = 0
    tried = 0
    for url in candidates:
        if not _unlimited(limit) and (saved >= limit or tried >= limit):
            break
        if url in known:
            skipped_exist += 1
            continue
        if dry_run:
            tried += 1
            continue
        tried += 1
        if tried % 20 == 0:
            print(
                f"try {creator_id} {tried}/{len(candidates)} saved={saved} skip_ld={skipped_ld}",
                flush=True,
            )
        time.sleep(delay_secs)
        html = fetch_text(url)
        if not html:
            fetch_fail += 1
            continue
        recipe = parse_recipe_html(html, url)
        if recipe is None and html_fallback:
            recipe = parse_html_recipe(html, url) or parse_via_n3xusapi(url)
        if recipe is None:
            skipped_ld += 1
            if (
                not html_fallback
                and tried >= 15
                and saved == 0
                and len(candidates) < 40
            ):
                print(f"abort {creator_id} no JSON-LD Recipe in first {tried} pages", flush=True)
                break
            continue
        reason = recipe_quality(recipe)
        if reason:
            skipped_quality += 1
            continue
        save_recipe(recipe, creator_id=creator_id, db_path=db_path)
        known.add(recipe["source_url"])
        saved += 1
        print(
            f"saved {creator_id} {saved} {recipe['title']}",
            flush=True,
        )
    if saved == 0 and not dry_run and not html_fallback:
        if len(candidates) == 0:
            record_gap("no_sitemap", creator_id)
        elif skipped_ld >= 15:
            record_gap("no_recipe_jsonld", creator_id)
    return {
        "creator_id": creator_id,
        "candidates": len(candidates),
        "tried": tried,
        "saved": saved,
        "skipped_ld": skipped_ld,
        "skipped_exist": skipped_exist,
        "skipped_quality": skipped_quality,
        "fetch_fail": fetch_fail,
        "dry_run_urls": candidates[:50] if dry_run else [],
    }


def _write_progress(results: list[dict]) -> None:
    PROGRESS_PATH.parent.mkdir(parents=True, exist_ok=True)
    PROGRESS_PATH.write_text(
        json.dumps(results, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def crawl_all(
    limit_per_creator: int,
    max_creators: int | None = None,
    creator_id: str | None = None,
    db_path: Path | None = None,
    delay_secs: float = 0.4,
    dry_run: bool = False,
    exclude: list[str] | None = None,
    html_fallback: bool = False,
    only_no_jsonld: bool = False,
) -> list[dict]:
    skip_extra = set(exclude or [])
    allow_no_jsonld = html_fallback or only_no_jsonld
    rows = [
        row
        for row in website_creators(allow_no_jsonld=allow_no_jsonld)
        if row[0] not in skip_extra
    ]
    if only_no_jsonld:
        gaps = json.loads(GAPS_PATH.read_text(encoding="utf-8"))
        want = set(gaps.get("no_recipe_jsonld") or [])
        rows = [row for row in rows if row[0] in want]
    if creator_id:
        rows = [row for row in rows if row[0] == creator_id]
        if not rows:
            raise ValueError(f"no crawlable website creator: {creator_id}")
    if max_creators is not None:
        rows = rows[:max_creators]
    results = []
    if PROGRESS_PATH.exists() and not creator_id:
        try:
            prev = json.loads(PROGRESS_PATH.read_text(encoding="utf-8"))
            if isinstance(prev, list):
                results = [item for item in prev if isinstance(item, dict) and item.get("creator_id")]
        except (json.JSONDecodeError, OSError, TypeError):
            results = []
    done = {item["creator_id"] for item in results}
    if not creator_id:
        rows = [row for row in rows if row[0] not in done]
    for row in rows:
        cid, _name, _cat, _primary, website_url, *_rest = row
        print(f"crawl start {cid} {website_url}", flush=True)
        result = crawl_creator(
            cid,
            website_url,
            limit=limit_per_creator,
            db_path=db_path,
            delay_secs=delay_secs,
            dry_run=dry_run,
            html_fallback=html_fallback,
        )
        results.append(result)
        _write_progress(results)
        print(f"crawl done {json.dumps(result, ensure_ascii=False)}", flush=True)
    return results


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--creator-id", help="one creator, e.g. jamie_oliver")
    parser.add_argument(
        "--limit",
        type=int,
        default=5,
        help="recipes per creator; 0 = all recipe URLs from sitemaps",
    )
    parser.add_argument("--max-creators", type=int)
    parser.add_argument("--delay", type=float, default=0.35)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument(
        "--html-fallback",
        action="store_true",
        help="after JSON-LD miss: HTML parse, then n3xusAPI",
    )
    parser.add_argument(
        "--only-no-jsonld",
        action="store_true",
        help="only creators listed in creators_gaps no_recipe_jsonld",
    )
    parser.add_argument(
        "--exclude",
        nargs="*",
        default=[],
        help="creator ids to skip this run",
    )
    parser.add_argument("--report", action="store_true", help="print quality stats and exit")
    args = parser.parse_args()
    if args.report:
        print(json.dumps(quality_report(), ensure_ascii=False, indent=2))
        return
    results = crawl_all(
        limit_per_creator=args.limit,
        max_creators=args.max_creators,
        creator_id=args.creator_id,
        delay_secs=args.delay,
        dry_run=args.dry_run,
        exclude=args.exclude,
        html_fallback=args.html_fallback,
        only_no_jsonld=args.only_no_jsonld,
    )
    report = quality_report()
    print(json.dumps({"results": results, "quality": report}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
