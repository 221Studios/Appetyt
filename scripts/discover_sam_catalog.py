"""Odkryj publiczny katalog URL przepisów Sama (thecookingguy.com) ze sitemapy."""

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
DEFAULT_OUT = ROOT / "data" / "sam_the_cooking_guy_catalog.json"
CREATOR_ID = "sam_the_cooking_guy"
SITE = "thecookingguy.com"
DEFAULT_SITEMAP = "https://www.thecookingguy.com/sitemap.xml"

LOC_RE = re.compile(r"<loc>\s*([^<\s]+)\s*</loc>", re.I)

FetchFn = Callable[[str], str | None]


def _host(url: str) -> str:
    return urlparse(url).netloc.lower().removeprefix("www.")


def _normalize(url: str) -> str:
    parsed = urlparse(url.split("#")[0].strip())
    path = parsed.path or "/"
    if path != "/" and not path.endswith("/"):
        if "." not in path.rsplit("/", 1)[-1]:
            path = path + "/"
    # Prefer www host for canonical Sam URLs.
    netloc = parsed.netloc.lower()
    if netloc in {"thecookingguy.com", "www.thecookingguy.com"}:
        netloc = "www.thecookingguy.com"
    return f"https://{netloc}{path}"


def classify_sam_url(url: str) -> tuple[str, str | None]:
    """Zwraca ``(kind, reason)``: recipe | rejected."""
    if _host(url) != SITE:
        return "rejected", "off_site"
    path = urlparse(url).path or "/"
    if path.startswith("/recipes/") and path.count("/") >= 2:
        slug = path.rstrip("/").rsplit("/", 1)[-1]
        if slug and slug not in {"recipes", "search-recipes"}:
            return "recipe", None
    return "rejected", "not_recipe_path"


def default_fetch(url: str, timeout: int = 45) -> str | None:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "AppetytSamCatalog/1.0 (+local; recipe discovery)"},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            return response.read().decode("utf-8", "replace")
    except Exception:
        return None


def discover_sam_catalog(
    *,
    fetch: FetchFn | None = None,
    sitemap_url: str = DEFAULT_SITEMAP,
) -> dict:
    """Zbierz publiczne URL przepisów Sama ze sitemapy."""
    fetch_fn = fetch or default_fetch
    xml = fetch_fn(sitemap_url) or ""
    recipes: set[str] = set()
    rejected: dict[str, str] = {}
    for loc in LOC_RE.findall(xml):
        absolute = _normalize(loc)
        kind, reason = classify_sam_url(absolute)
        if kind == "recipe":
            recipes.add(absolute)
        elif reason:
            rejected.setdefault(absolute, reason)

    recipe_list = [{"source_url": u} for u in sorted(recipes)]
    return {
        "schema_version": 1,
        "creator_id": CREATOR_ID,
        "retrieved_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "sitemap_url": sitemap_url,
        "recipe_count": len(recipe_list),
        "recipes": recipe_list,
        "rejected": [
            {"source_url": u, "reason": reason}
            for u, reason in sorted(rejected.items())
        ],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Discover Sam public recipe URLs.")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--sitemap", default=DEFAULT_SITEMAP)
    args = parser.parse_args()
    catalog = discover_sam_catalog(sitemap_url=args.sitemap)
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
