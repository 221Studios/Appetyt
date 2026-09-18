"""Odkryj publiczny katalog URL przepisów Foxxa (adifoxx.pl) — bez paywalla."""

from __future__ import annotations

import argparse
import json
import re
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable
from urllib.parse import urljoin, urlparse

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUT = ROOT / "data" / "foxx_gotuje_catalog.json"
CREATOR_ID = "foxx_gotuje"
SITE = "adifoxx.pl"

HREF_RE = re.compile(r"""href=["']([^"']+)["']""", re.I)
POST_PATH_RE = re.compile(r"^/[^/]+/?$")

LISTING_PATH_RE = re.compile(
    r"^/(blog|author/adi)(/page/\d+)?/?$",
    re.I,
)

SHOP_OR_ACCOUNT_RE = re.compile(
    r"^/(koszyk|cart|checkout|moje-konto|konto|sklep|produkt|product|"
    r"zamowienie|wishlist|ulubione)(/|$)",
    re.I,
)

SITE_META_RE = re.compile(
    r"^/(polityka[^/]*|regulamin[^/]*|faq|kontakt|newsletter|o-sklepie|"
    r"wp-json|xmlrpc\.php|feed|comments|cdn-cgi)(/|$)",
    re.I,
)

FetchFn = Callable[[str], str | None]


def _host(url: str) -> str:
    return urlparse(url).netloc.lower().removeprefix("www.")


def _normalize(url: str) -> str:
    parsed = urlparse(url.split("#")[0].strip())
    path = parsed.path or "/"
    if path != "/" and not path.endswith("/"):
        # keep files like xmlrpc.php without forcing slash; posts get slash
        if "." not in path.rsplit("/", 1)[-1]:
            path = path + "/"
    return f"{parsed.scheme}://{parsed.netloc}{path}"


def classify_foxx_url(url: str) -> tuple[str, str | None]:
    """Zwraca ``(kind, reason)``: recipe | listing | rejected."""
    if _host(url) != SITE:
        return "rejected", "off_site"
    path = urlparse(url).path or "/"
    if LISTING_PATH_RE.match(path):
        return "listing", None
    if SHOP_OR_ACCOUNT_RE.match(path):
        return "rejected", "shop_or_account"
    if SITE_META_RE.match(path):
        return "rejected", "site_meta"
    if path.startswith("/wp-") or path.startswith("/category/") or path.startswith("/tag/"):
        return "rejected", "site_meta"
    if POST_PATH_RE.match(path):
        return "recipe", None
    return "rejected", "not_recipe_path"


def extract_foxx_urls(html: str, base: str) -> dict:
    recipes: set[str] = set()
    listings: set[str] = set()
    rejected: list[tuple[str, str]] = []
    seen_reject: set[str] = set()
    for href in HREF_RE.findall(html or ""):
        absolute = _normalize(urljoin(base, href.strip()))
        if not absolute.startswith("http"):
            continue
        kind, reason = classify_foxx_url(absolute)
        if kind == "recipe":
            recipes.add(absolute)
        elif kind == "listing":
            listings.add(absolute)
        elif reason and absolute not in seen_reject:
            seen_reject.add(absolute)
            rejected.append((absolute, reason))
    return {
        "recipes": sorted(recipes),
        "listings": sorted(listings),
        "rejected": rejected,
    }


def default_fetch(url: str, timeout: int = 30) -> str | None:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "AppetytFoxxCatalog/1.0 (+local; recipe discovery)"},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            return response.read().decode("utf-8", "replace")
    except Exception:
        return None


def discover_foxx_catalog(
    *,
    fetch: FetchFn | None = None,
    seeds: list[str] | None = None,
    max_listing_pages: int = 40,
) -> dict:
    """Przejdź listingi bloga/autora i zbierz publiczne URL przepisów."""
    fetch_fn = fetch or default_fetch
    seed_list = seeds or [
        "https://adifoxx.pl/blog/",
        "https://adifoxx.pl/author/adi/",
    ]
    queue = list(seed_list)
    visited: list[str] = []
    seen_listing: set[str] = set()
    recipes: set[str] = set()
    rejected_map: dict[str, str] = {}

    while queue and len(seen_listing) < max_listing_pages:
        url = _normalize(queue.pop(0))
        if url in seen_listing:
            continue
        kind, _ = classify_foxx_url(url)
        if kind != "listing" and url not in seed_list:
            continue
        seen_listing.add(url)
        html = fetch_fn(url)
        visited.append(url)
        if not html:
            continue
        found = extract_foxx_urls(html, base=url)
        recipes.update(found["recipes"])
        for listing in found["listings"]:
            if listing not in seen_listing:
                queue.append(listing)
        for rejected_url, reason in found["rejected"]:
            rejected_map.setdefault(rejected_url, reason)

    recipe_list = [{"source_url": u} for u in sorted(recipes)]
    return {
        "schema_version": 1,
        "creator_id": CREATOR_ID,
        "retrieved_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "recipe_count": len(recipe_list),
        "listing_pages_visited": visited,
        "recipes": recipe_list,
        "rejected": [
            {"source_url": u, "reason": reason}
            for u, reason in sorted(rejected_map.items())
        ],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Discover Foxx public recipe URLs.")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--max-listing-pages", type=int, default=40)
    args = parser.parse_args()
    catalog = discover_foxx_catalog(max_listing_pages=args.max_listing_pages)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n")
    print(
        {
            "recipe_count": catalog["recipe_count"],
            "listing_pages": len(catalog["listing_pages_visited"]),
            "rejected": len(catalog["rejected"]),
            "path": str(args.out),
        }
    )


if __name__ == "__main__":
    main()
