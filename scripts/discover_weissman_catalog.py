"""Odkryj publiczny katalog URL przepisów Joshuy Weissmana (Webflow /recipes)."""

from __future__ import annotations

import argparse
import json
import re
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable
from urllib.parse import urlparse, urljoin

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUT = ROOT / "data" / "joshua_weissman_catalog.json"
CREATOR_ID = "joshua_weissman"
SITE = "joshuaweissman.com"
DEFAULT_LISTING = "https://www.joshuaweissman.com/recipes"
# Webflow collection pagination query key on /recipes (stable across page loads).
PAGE_PARAM = "ca6c56ae_page"

HREF_RE = re.compile(
    r'href="((?:https://www\.joshuaweissman\.com)?/recipes/[^"?#]+)"',
    re.I,
)
NEXT_RE = re.compile(
    rf'href="\?{re.escape(PAGE_PARAM)}=(\d+)"[^>]*aria-label="Next Page"',
    re.I,
)

FetchFn = Callable[[str], str | None]


def _host(url: str) -> str:
    return urlparse(url).netloc.lower().removeprefix("www.")


def _normalize(url: str) -> str:
    parsed = urlparse(url.split("#")[0].strip())
    path = (parsed.path or "/").rstrip("/")
    netloc = parsed.netloc.lower()
    if netloc in {"joshuaweissman.com", "www.joshuaweissman.com"}:
        netloc = "www.joshuaweissman.com"
    elif not netloc:
        netloc = "www.joshuaweissman.com"
    return f"https://{netloc}{path}"


def classify_weissman_url(url: str) -> tuple[str, str | None]:
    """Zwraca ``(kind, reason)``: recipe | rejected."""
    if _host(url) not in {"", SITE}:
        return "rejected", "off_site"
    path = urlparse(url).path or "/"
    if path.startswith("/recipes/") and path.count("/") >= 2:
        slug = path.rstrip("/").rsplit("/", 1)[-1]
        if slug and slug != "recipes":
            return "recipe", None
    return "rejected", "not_recipe_path"


def default_fetch(url: str, timeout: int = 45) -> str | None:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "AppetytWeissmanCatalog/1.0 (+local; recipe discovery)"},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            return response.read().decode("utf-8", "replace")
    except Exception:
        return None


def discover_weissman_catalog(
    *,
    fetch: FetchFn | None = None,
    listing_url: str = DEFAULT_LISTING,
    page_param: str = PAGE_PARAM,
    max_pages: int = 200,
) -> dict:
    """Zbierz publiczne URL przepisów z paginowanej listy /recipes."""
    fetch_fn = fetch or default_fetch
    recipes: set[str] = set()
    rejected: dict[str, str] = {}
    pages_fetched = 0
    page = 1

    while page <= max_pages:
        url = listing_url if page == 1 else f"{listing_url}?{page_param}={page}"
        html = fetch_fn(url) or ""
        pages_fetched += 1
        if not html:
            rejected[url] = "fetch_failed"
            break

        for href in HREF_RE.findall(html):
            absolute = _normalize(urljoin(listing_url, href))
            kind, reason = classify_weissman_url(absolute)
            if kind == "recipe":
                recipes.add(absolute)
            elif reason:
                rejected.setdefault(absolute, reason)

        next_match = NEXT_RE.search(html)
        if not next_match:
            break
        page = int(next_match.group(1))

    recipe_list = [{"source_url": u} for u in sorted(recipes)]
    return {
        "schema_version": 1,
        "creator_id": CREATOR_ID,
        "retrieved_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "listing_url": listing_url,
        "page_param": page_param,
        "pages_fetched": pages_fetched,
        "recipe_count": len(recipe_list),
        "recipes": recipe_list,
        "rejected": [
            {"source_url": u, "reason": reason}
            for u, reason in sorted(rejected.items())
        ],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Discover Weissman public recipe URLs.")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--listing", default=DEFAULT_LISTING)
    args = parser.parse_args()
    catalog = discover_weissman_catalog(listing_url=args.listing)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n")
    print(
        json.dumps(
            {
                "recipe_count": catalog["recipe_count"],
                "pages_fetched": catalog["pages_fetched"],
                "rejected": len(catalog["rejected"]),
                "path": str(args.out),
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
