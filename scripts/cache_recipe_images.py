"""Download, optimize and store creator recipe images for the Appetyt app.

The source page and source image are discovered separately.  The source image
is fetched through n3xusAPI, converted to a bounded WebP thumbnail, and then
served to the app from our own ``/recipe-images`` asset path.  The creator
page URL remains the canonical outbound link in the recipe catalog.
"""

from __future__ import annotations

import argparse
import base64
import json
import re
import shutil
import subprocess
import tempfile
import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CATALOG = ROOT / "cheftable-przepiśnik" / "public" / "recipes.json"
DEFAULT_SOURCES = ROOT / "data" / "recipe_image_sources.jsonl"
DEFAULT_OUTPUT = ROOT / "data" / "recipe_image_cache.jsonl"
DEFAULT_REPORT = ROOT / "data" / "recipe_image_cache_report.json"
DEFAULT_STORAGE = ROOT / "data" / "recipe-images"
DEFAULT_PUBLIC_STORAGE = ROOT / "cheftable-przepiśnik" / "public" / "recipe-images"
DEFAULT_API = "http://127.0.0.1:8000"
SKILL_VERSION = "local-7"
MAX_SOURCE_BYTES = 15 * 1024 * 1024
IMAGE_NAME_RE = re.compile(r"^[a-z0-9][a-z0-9_-]{0,119}$")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _request_json(api_base: str, image_url: str, *, timeout: int) -> tuple[dict[str, Any], str | None]:
    body = json.dumps({"url": image_url}).encode("utf-8")
    request = Request(
        f"{api_base.rstrip('/')}/v1/scrape/image",
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Idempotency-Key": f"appetyt-cache-image-{uuid.uuid4().hex}",
            "X-N3xusAPI-Skill-Version": SKILL_VERSION,
        },
    )
    with urlopen(request, timeout=timeout) as response:
        payload = json.loads(response.read().decode("utf-8"))
    request_id = payload.get("requestId") if isinstance(payload, dict) else None

    for _ in range(30):
        next_info = payload.get("next") if isinstance(payload, dict) else None
        if not isinstance(next_info, dict):
            break
        time.sleep(min(float(next_info.get("afterSecs") or 1), 10))
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
    if payload.get("status") != "succeeded":
        error = payload.get("error") or {}
        raise ValueError(str(error.get("hint") or error or "image fetch failed"))
    return payload, request_id


def _safe_filename(recipe_id: str) -> str:
    if IMAGE_NAME_RE.fullmatch(recipe_id):
        return recipe_id
    return re.sub(r"[^a-z0-9_-]+", "-", recipe_id.lower()).strip("-")[:120] or "recipe"


def _optimized_webp(source: bytes, output_path: Path) -> tuple[int, int, int]:
    """Convert one source image into a bounded, stripped WebP thumbnail."""

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="appetyt-image-") as temporary:
        input_path = Path(temporary) / "source-image"
        converted_path = Path(temporary) / "optimized.webp"
        input_path.write_bytes(source)
        command = [
            "magick",
            "-limit",
            "area",
            "100MP",
            "-limit",
            "width",
            "10000",
            "-limit",
            "height",
            "10000",
            f"{input_path}[0]",
            "-auto-orient",
            "-strip",
            "-resize",
            "720x720>",
            "-quality",
            "78",
            f"webp:{converted_path}",
        ]
        result = subprocess.run(command, capture_output=True, text=True, timeout=60)
        if result.returncode != 0 or not converted_path.exists():
            detail = (result.stderr or result.stdout or "ImageMagick conversion failed").strip()
            raise RuntimeError(detail[-500:])
        shutil.copyfile(converted_path, output_path)

    identify = subprocess.run(
        ["magick", "identify", "-format", "%w %h %b", str(output_path)],
        capture_output=True,
        text=True,
        timeout=15,
        check=True,
    ).stdout.strip()
    width, height, size_text = identify.split(" ", 2)
    size_match = re.match(r"(\d+)", size_text)
    return int(width), int(height), int(size_match.group(1)) if size_match else output_path.stat().st_size


def _copy_to_public(source_path: Path, public_path: Path) -> None:
    public_path.parent.mkdir(parents=True, exist_ok=True)
    temporary = public_path.with_suffix(".tmp")
    shutil.copyfile(source_path, temporary)
    temporary.replace(public_path)


def _load_latest(path: Path) -> dict[str, dict[str, Any]]:
    if not path.exists():
        return {}
    latest: dict[str, dict[str, Any]] = {}
    with path.open(encoding="utf-8") as handle:
        for line in handle:
            try:
                item = json.loads(line)
            except json.JSONDecodeError:
                continue
            if isinstance(item, dict) and item.get("id"):
                latest[str(item["id"])] = item
    return latest


def cache_one(
    recipe: dict[str, Any],
    source: dict[str, Any],
    *,
    api_base: str,
    storage: Path,
    public_storage: Path,
    timeout: int,
) -> dict[str, Any]:
    recipe_id = str(recipe.get("id") or source.get("id") or "")
    source_image_url = source.get("source_image_url")
    record: dict[str, Any] = {
        "id": recipe_id,
        "creator_id": recipe.get("creator_id"),
        "title": recipe.get("title"),
        "source_url": recipe.get("source_url"),
        "source_image_url": source_image_url,
        "status": "error",
        "image_url": None,
        "checked_at": _now(),
    }
    if source.get("status") != "found" or not isinstance(source_image_url, str):
        record["status"] = "missing_source_image"
        return record

    try:
        payload, request_id = _request_json(api_base, source_image_url, timeout=timeout)
        record["request_id"] = request_id
        output = payload.get("output")
        if not isinstance(output, dict) or not isinstance(output.get("base64"), str):
            raise ValueError("n3xusAPI image response has no binary output")
        source_bytes = base64.b64decode(output["base64"], validate=True)
        if not source_bytes or len(source_bytes) > MAX_SOURCE_BYTES:
            raise ValueError("image payload is empty or exceeds the 15 MB limit")

        filename = f"{_safe_filename(recipe_id)}.webp"
        storage_path = storage / filename
        public_path = public_storage / filename
        width, height, size_bytes = _optimized_webp(source_bytes, storage_path)
        _copy_to_public(storage_path, public_path)
        record.update(
            {
                "status": "cached",
                "image_url": f"/recipe-images/{filename}",
                "content_type": output.get("contentType"),
                "source_final_url": output.get("finalUrl"),
                "source_size_bytes": len(source_bytes),
                "width": width,
                "height": height,
                "size_bytes": size_bytes,
            }
        )
    except (HTTPError, URLError, TimeoutError, OSError, ValueError, RuntimeError, subprocess.SubprocessError) as exc:
        record["error"] = f"{type(exc).__name__}: {exc}"
    return record


def write_report(path: Path, records: list[dict[str, Any]], total: int, output_path: Path) -> dict[str, Any]:
    by_status: dict[str, int] = {}
    by_creator: dict[str, dict[str, int]] = {}
    total_bytes = 0
    for item in records:
        status = str(item.get("status") or "unknown")
        by_status[status] = by_status.get(status, 0) + 1
        creator = str(item.get("creator_id") or "unknown")
        creator_stats = by_creator.setdefault(creator, {})
        creator_stats[status] = creator_stats.get(status, 0) + 1
        total_bytes += int(item.get("size_bytes") or 0)
    report = {
        "generated_at": _now(),
        "total_catalog_recipes": total,
        "processed_records": len(records),
        "by_status": by_status,
        "by_creator": by_creator,
        "optimized_storage_bytes": total_bytes,
        "records_path": str(output_path),
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--sources", type=Path, default=DEFAULT_SOURCES)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    parser.add_argument("--storage", type=Path, default=DEFAULT_STORAGE)
    parser.add_argument("--public-storage", type=Path, default=DEFAULT_PUBLIC_STORAGE)
    parser.add_argument("--api-base", default=DEFAULT_API)
    parser.add_argument("--workers", type=int, default=3)
    parser.add_argument("--timeout", type=int, default=90)
    parser.add_argument("--limit", type=int, default=0, help="0 = all recipes")
    parser.add_argument("--refresh", action="store_true", help="recache already stored images")
    args = parser.parse_args()

    catalog = json.loads(args.catalog.read_text(encoding="utf-8"))
    recipes = [item for item in catalog if isinstance(item, dict)]
    sources = _load_latest(args.sources)
    existing = {} if args.refresh else _load_latest(args.output)
    pending = []
    for recipe in recipes:
        recipe_id = str(recipe.get("id"))
        existing_record = existing.get(recipe_id)
        source_record = sources.get(recipe_id, {})
        if (
            existing_record is None
            or existing_record.get("status") == "error"
            or (
                source_record.get("status") == "found"
                and existing_record.get("status") != "cached"
            )
        ):
            pending.append(recipe)
    if args.limit > 0:
        pending = pending[: args.limit]

    args.storage.mkdir(parents=True, exist_ok=True)
    args.public_storage.mkdir(parents=True, exist_ok=True)
    print(
        json.dumps(
            {
                "catalog": len(recipes),
                "source_records": len(sources),
                "already_cached": sum(item.get("status") == "cached" for item in existing.values()),
                "pending": len(pending),
                "workers": args.workers,
                "api_base": args.api_base,
            },
            ensure_ascii=False,
        )
    )

    lock = threading.Lock()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("a", encoding="utf-8") as output:
        with ThreadPoolExecutor(max_workers=max(1, args.workers)) as executor:
            futures = {
                executor.submit(
                    cache_one,
                    recipe,
                    sources.get(str(recipe.get("id")), {}),
                    api_base=args.api_base,
                    storage=args.storage,
                    public_storage=args.public_storage,
                    timeout=args.timeout,
                ): recipe
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
                        f"processed {index}/{len(futures)}: {result.get('status')} "
                        f"{result.get('creator_id')} {result.get('title')}",
                        flush=True,
                    )

    records = [existing[str(recipe.get("id"))] for recipe in recipes if str(recipe.get("id")) in existing]
    report = write_report(args.report, records, len(recipes), args.output)
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
