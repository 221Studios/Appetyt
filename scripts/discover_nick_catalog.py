"""Odkryj publiczny katalog URL przepisów Nicka DiGiovanni (nickskitchen.com)."""

from __future__ import annotations

import argparse
import json
import re
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUT = ROOT / "data" / "nick_digiovanni_catalog.json"
CREATOR_ID = "nick_digiovanni"
SITE = "nickskitchen.com"
DEFAULT_SITEMAP_INDEX = "https://nickskitchen.com/sitemap_index.xml"
DEFAULT_POST_SITEMAP = "https://nickskitchen.com/post-sitemap.xml"

LOC_RE = re.compile(r"<loc>\s*([^<\s]+)\s*</loc>", re.I)

# Listing / category / legal pages — not individual recipes.
REJECT_PATHS = {
    "/",
    "/recipes",
    "/recipes/",
    "/about",
    "/about/",
    "/about-nick",
    "/about-nick/",
    "/contact",
    "/contact/",
    "/newsletter",
    "/newsletter/",
    "/subscribe",
    "/subscribe/",
    "/sneak-peek-recipes",
    "/sneak-peek-recipes/",
}

FetchFn = Callable[[str], str | None]


def _host(url: str) -> str:
    return urlparse(url).netloc.lower().removeprefix("www.")


def _normalize(url: str) -> str:
    parsed = urlparse(url.split("#")[0].strip())
    path = parsed.path or "/"
    if path != "/" and not path.endswith("/"):
        if "." not in path.rsplit("/", 1)[-1]:
            path = path + "/"
    netloc = parsed.netloc.lower()
    if netloc in {"nickskitchen.com", "www.nickskitchen.com"}:
        netloc = "nickskitchen.com"
    return f"https://{netloc}{path}"


def classify_nick_url(url: str) -> tuple[str, str | None]:
    """Zwraca ``(kind, reason)``: recipe | rejected.

    Kanoniczne przepisy Nicka to root posts (`/slug/`), nie `/videos/` (tips)
    ani YouTube.
    """
    if _host(url) != SITE:
        return "rejected", "off_site"
    path = urlparse(url).path or "/"
    if path in REJECT_PATHS:
        return "rejected", "listing_or_meta"
    if path.startswith("/videos/") or path.startswith("/video-category/"):
        return "rejected", "video_tip_path"
    if path.startswith("/category/") or path.startswith("/wp-"):
        return "rejected", "taxonomy_or_wp"
    if path.startswith("/recipes/page/"):
        return "rejected", "listing_or_meta"
    # Single-segment root slug: /five-cheese-mac-and-cheese/
    parts = [p for p in path.strip("/").split("/") if p]
    if len(parts) == 1 and parts[0] not in {"recipes", "about", "contact"}:
        return "recipe", None
    return "rejected", "not_recipe_path"


def default_fetch(url: str, timeout: int = 45) -> str | None:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "AppetytNickCatalog/1.0 (+local; recipe discovery)"},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            return response.read().decode("utf-8", "replace")
    except Exception:
        return None


def discover_nick_catalog(
    *,
    fetch: FetchFn | None = None,
    post_sitemap_url: str = DEFAULT_POST_SITEMAP,
) -> dict:
    """Zbierz publiczne URL przepisów Nicka z Yoast post-sitemap."""
    fetch_fn = fetch or default_fetch
    xml = fetch_fn(post_sitemap_url) or ""
    recipes: set[str] = set()
    rejected: dict[str, str] = {}
    for loc in LOC_RE.findall(xml):
        absolute = _normalize(loc)
        kind, reason = classify_nick_url(absolute)
        if kind == "recipe":
            recipes.add(absolute)
        elif reason:
            rejected.setdefault(absolute, reason)

    recipe_list = [{"source_url": u} for u in sorted(recipes)]
    return {
        "schema_version": 1,
        "creator_id": CREATOR_ID,
        "retrieved_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "post_sitemap_url": post_sitemap_url,
        "recipe_count": len(recipe_list),
        "recipes": recipe_list,
        "rejected": [
            {"source_url": u, "reason": reason}
            for u, reason in sorted(rejected.items())
        ],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Discover Nick public recipe URLs.")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--post-sitemap", default=DEFAULT_POST_SITEMAP)
    args = parser.parse_args()
    catalog = discover_nick_catalog(post_sitemap_url=args.post_sitemap)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n")
    print(
        json.dumps(
            {
                "recipe_count": catalog["recipe_count"],
                "rejected": len(catalog["rejected"]),
                "path": str(args.out),
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
