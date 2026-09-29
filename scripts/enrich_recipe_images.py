"""Find original recipe images on the creators' public recipe pages.

This is the discovery/audit stage only.  The follow-up
``cache_recipe_images.py`` worker downloads verified candidates through
n3xusAPI and stores the app-facing WebP copy in local storage.  The discovery
stage is intentionally resumable: every completed URL is stored as one JSONL
record, so an interrupted run can continue with the same command.

Public pages are fetched through the local n3xusAPI scraper.  This keeps the
source audit in one place and avoids making direct requests to creator sites
from the Appetyt data pipeline.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse, urlunparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CATALOG = ROOT / "cheftable-przepiśnik" / "public" / "recipes.json"
DEFAULT_OUTPUT = ROOT / "data" / "recipe_image_sources.jsonl"
DEFAULT_REPORT = ROOT / "data" / "recipe_image_sources_report.json"
DEFAULT_API = "http://127.0.0.1:8000"
SKILL_VERSION = "local-7"

IMAGE_MARKDOWN_RE = re.compile(r"!\[[^\]]*\]\((https?://[^\s)]+)", re.IGNORECASE)
NON_RECIPE_IMAGE_MARKERS = (
    "avatar",
    "gravatar",
    "favicon",
    "logo",
    "adi-foxx-horizontal-black",
    "icon",
    "profile",
    "youtube.com",
    "youtu.be",
    "youtube",
    "vimeo.com",
    "veneer",
    "holy-grill",
    "play-button",
    "play%20button",
    "search%20magnify",
    "search_magnify",
    "social",
    "facebook",
    "instagram",
    "tiktok",
    "template",
    "vector%20",
    ".svg",
)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _is_recipe_type(value: Any) -> bool:
    if isinstance(value, str):
        return value.lower() == "recipe"
    if isinstance(value, list):
        return any(_is_recipe_type(item) for item in value)
    return False


def _walk_json(value: Any):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from _walk_json(child)
    elif isinstance(value, list):
        for child in value:
            yield from _walk_json(child)


def _as_image_url(value: Any, page_url: str) -> str | None:
    if isinstance(value, str):
        candidate = urljoin(page_url, value.strip())
    elif isinstance(value, dict):
        candidate = _as_image_url(
            value.get("url") or value.get("contentUrl") or value.get("thumbnailUrl"),
            page_url,
        )
        return candidate
    else:
        return None
    parsed = urlparse(candidate)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return None
    lowered = candidate.lower()
    if any(marker in lowered for marker in NON_RECIPE_IMAGE_MARKERS):
        return None
    return urlunparse(parsed)


def _same_page_url(left: str, right: str) -> bool:
    left_parsed = urlparse(left)
    right_parsed = urlparse(right)
    return (
        left_parsed.scheme.lower(),
        left_parsed.netloc.lower(),
        left_parsed.path.rstrip("/") or "/",
        left_parsed.query,
    ) == (
        right_parsed.scheme.lower(),
        right_parsed.netloc.lower(),
        right_parsed.path.rstrip("/") or "/",
        right_parsed.query,
    )


def _add_candidate(candidates: list[str], value: Any, page_url: str) -> None:
    if isinstance(value, list):
        for item in value:
            _add_candidate(candidates, item, page_url)
        return
    candidate = _as_image_url(value, page_url)
    if candidate and candidate not in candidates:
        candidates.append(candidate)


def extract_image_candidates(page: dict[str, Any], source_url: str) -> list[str]:
    """Extract image candidates, preferring the Recipe JSON-LD image."""

    candidates: list[str] = []
    structured_data = page.get("structuredData")
    for node in _walk_json(structured_data):
        if _is_recipe_type(node.get("@type")):
            _add_candidate(candidates, node.get("image"), source_url)
            _add_candidate(candidates, node.get("photo"), source_url)

    # Some publishers expose Recipe and ImageObject as separate JSON-LD nodes.
    for node in _walk_json(structured_data):
        if str(node.get("@type", "")).lower() == "imageobject":
            _add_candidate(
                candidates,
                node.get("contentUrl") or node.get("url") or node.get("thumbnailUrl"),
                source_url,
            )

    # n3xusAPI also exposes publisher-level og:image/twitter:image and the
    # page images as imageUrls.  This is the primary fallback for publishers
    # whose recipe JSON-LD omits the photo (including Foxx's WordPress pages).
    # The generic markers above remove the Foxx logo and tracking pixels; the
    # first remaining image is the page's main recipe/gallery image, while
    # later gallery images are deliberately ignored.
    _add_candidate(candidates, page.get("imageUrls"), source_url)

    # Last-resort page markup.  It is still the creator page, never a guessed
    # stock image or an image generated by the app.
    markdown = page.get("markdown") or page.get("text") or ""
    for value in IMAGE_MARKDOWN_RE.findall(markdown):
        _add_candidate(candidates, value, source_url)
    for key in ("image", "imageUrl", "mainImage", "mainImageUrl"):
        _add_candidate(candidates, page.get(key), source_url)
    return candidates


def _request_json(
    api_base: str,
    source_url: str,
    *,
    timeout: int,
) -> tuple[dict[str, Any], str | None]:
    body = json.dumps(
        {
            "urls": [source_url],
            "contentFormat": "text",
            "maxChars": 12000,
            "maxPages": 1,
            "maxDepth": 0,
        }
    ).encode("utf-8")
    request = Request(
        f"{api_base.rstrip('/')}/v1/scrape/website",
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Idempotency-Key": f"appetyt-recipe-image-{uuid.uuid4().hex}",
            "X-N3xusAPI-Skill-Version": SKILL_VERSION,
        },
    )
    with urlopen(request, timeout=timeout) as response:
        payload = json.loads(response.read().decode("utf-8"))
    request_id = payload.get("requestId") if isinstance(payload, dict) else None

    # The local API normally completes synchronously.  Keep polling support so
    # a slow browser/model response does not get recorded as a false miss.
    for _ in range(30):
        next_info = payload.get("next") if isinstance(payload, dict) else None
        if not isinstance(next_info, dict):
            break
        wait_seconds = float(next_info.get("afterSecs") or 1)
        time.sleep(min(wait_seconds, 10))
        next_url = next_info.get("url")
        if not isinstance(next_url, str):
            break
        poll_request = Request(
            urljoin(f"{api_base.rstrip('/')}/", next_url.lstrip("/")),
            method="GET",
            headers={"Accept": "application/json"},
        )
        with urlopen(poll_request, timeout=timeout) as response:
            payload = json.loads(response.read().decode("utf-8"))
        request_id = request_id or payload.get("requestId")
    if not isinstance(payload, dict):
        raise ValueError("n3xusAPI returned a non-object response")
    return payload, request_id


def _find_page(payload: dict[str, Any], source_url: str) -> dict[str, Any] | None:
    output = payload.get("output")
    if not isinstance(output, list):
        return None
    pages = [item for item in output if isinstance(item, dict)]
    if not pages:
        return None
    for page in pages:
        if page.get("url") == source_url:
            return page
    return pages[0]


def fetch_one(recipe: dict[str, Any], api_base: str, timeout: int) -> dict[str, Any]:
    source_url = str(recipe.get("source_url") or "")
    result: dict[str, Any] = {
        "id": recipe.get("id"),
        "creator_id": recipe.get("creator_id"),
        "title": recipe.get("title"),
        "source_url": source_url,
        "status": "error",
        "source_image_url": None,
        "image_candidates": [],
        "request_id": None,
        "checked_at": _now(),
    }
    if not source_url:
        result["error"] = "missing_source_url"
        return result
    try:
        payload, request_id = _request_json(api_base, source_url, timeout=timeout)
        result["request_id"] = request_id
        page = _find_page(payload, source_url)
        candidates = extract_image_candidates(page, source_url) if page else []
        candidates = [candidate for candidate in candidates if not _same_page_url(candidate, source_url)]
        result["image_candidates"] = candidates
        result["source_image_url"] = candidates[0] if candidates else None
        if candidates:
            result["status"] = "found"
        elif page:
            result["status"] = "missing_image"
        else:
            outcomes = payload.get("urlOutcomes")
            result["status"] = "not_returned"
            result["error"] = outcomes
        result["collection_state"] = (payload.get("source") or {}).get("collectionState")
        return result
    except (HTTPError, URLError, TimeoutError, OSError, ValueError, json.JSONDecodeError) as exc:
        result["error"] = f"{type(exc).__name__}: {exc}"
        return result


def load_existing(path: Path) -> dict[str, dict[str, Any]]:
    if not path.exists():
        return {}
    existing: dict[str, dict[str, Any]] = {}
    with path.open(encoding="utf-8") as handle:
        for line in handle:
            try:
                item = json.loads(line)
            except json.JSONDecodeError:
                continue
            if isinstance(item, dict) and item.get("id"):
                existing[str(item["id"])] = item
    return existing


def has_usable_image(record: dict[str, Any]) -> bool:
    image_url = record.get("source_image_url")
    return (
        record.get("status") == "found"
        and isinstance(image_url, str)
        and image_url.startswith(("http://", "https://"))
        and not _same_page_url(image_url, str(record.get("source_url") or ""))
    )


def write_report(
    path: Path,
    records: list[dict[str, Any]],
    total: int,
    records_path: Path,
) -> dict[str, Any]:
    by_status: dict[str, int] = {}
    by_creator: dict[str, dict[str, int]] = {}
    image_owners: dict[str, list[str]] = {}
    for item in records:
        status = str(item.get("status") or "unknown")
        by_status[status] = by_status.get(status, 0) + 1
        creator = str(item.get("creator_id") or "unknown")
        creator_stats = by_creator.setdefault(creator, {})
        creator_stats[status] = creator_stats.get(status, 0) + 1
        image_url = item.get("source_image_url")
        if isinstance(image_url, str) and image_url:
            image_owners.setdefault(image_url, []).append(str(item.get("id")))
    duplicates = {
        image_url: ids for image_url, ids in image_owners.items() if len(ids) > 1
    }
    report = {
        "generated_at": _now(),
        "total_catalog_recipes": total,
        "processed_records": len(records),
        "by_status": by_status,
        "by_creator": by_creator,
        "duplicate_image_urls": duplicates,
        "duplicate_image_count": len(duplicates),
        "missing_image_ids": [
            item.get("id") for item in records if item.get("status") != "found"
        ],
        "records_path": str(records_path),
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    parser.add_argument("--api-base", default=DEFAULT_API)
    parser.add_argument("--workers", type=int, default=3)
    parser.add_argument("--timeout", type=int, default=90)
    parser.add_argument("--limit", type=int, default=0, help="0 = all recipes")
    parser.add_argument("--creator-id", help="only process one creator")
    parser.add_argument("--refresh", action="store_true", help="recheck already stored records")
    parser.add_argument(
        "--retry-unresolved",
        action="store_true",
        help="recheck stored records whose last status was not found",
    )
    args = parser.parse_args()

    catalog = json.loads(args.catalog.read_text(encoding="utf-8"))
    if not isinstance(catalog, list):
        raise SystemExit("Catalog must be a JSON list")
    existing = {} if args.refresh else load_existing(args.output)
    all_recipes = [recipe for recipe in catalog if isinstance(recipe, dict)]
    recipes = [
        recipe
        for recipe in all_recipes
        if not args.creator_id or recipe.get("creator_id") == args.creator_id
    ]
    pending = [
        recipe
        for recipe in recipes
        if str(recipe.get("id")) not in existing
        or (args.retry_unresolved and not has_usable_image(existing[str(recipe.get("id"))]))
    ]
    if args.limit > 0:
        pending = pending[: args.limit]

    print(
        json.dumps(
            {
                "catalog": len(all_recipes),
                "selected_catalog": len(recipes),
                "already_processed": len(existing),
                "pending": len(pending),
                "workers": args.workers,
                "api_base": args.api_base,
            },
            ensure_ascii=False,
        )
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    lock = threading.Lock()
    with args.output.open("a", encoding="utf-8") as output:
        with ThreadPoolExecutor(max_workers=max(1, args.workers)) as executor:
            futures = {
                executor.submit(fetch_one, recipe, args.api_base, args.timeout): recipe
                for recipe in pending
            }
            for index, future in enumerate(as_completed(futures), start=1):
                result = future.result()
                with lock:
                    output.write(json.dumps(result, ensure_ascii=False) + "\n")
                    output.flush()
                existing[str(result.get("id"))] = result
                if index == 1 or index % 25 == 0 or index == len(futures):
                    print(
                        f"processed {index}/{len(futures)}: "
                        f"{result.get('status')} {result.get('creator_id')} {result.get('title')}",
                        flush=True,
                    )

    latest_records = load_existing(args.output)
    records = [
        latest_records[str(recipe.get("id"))]
        for recipe in all_recipes
        if str(recipe.get("id")) in latest_records
    ]
    report = write_report(args.report, records, len(all_recipes), args.output)
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
