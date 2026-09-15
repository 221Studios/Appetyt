#!/usr/bin/env python3
"""YouTube descriptions → page URLs → Schema.org JSON-LD. No transcript yet."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.crawl_recipes import (
    existing_source_urls,
    fetch_text,
    recipe_quality,
)
from scripts.import_creators import SEED_PATH, load_seed
from scripts.schema_recipe import parse_recipe_html, save_recipe
from scripts.youtube_links import extract_page_urls

YTDLP = ROOT / ".venv" / "bin" / "yt-dlp"
if not YTDLP.exists():
    YTDLP = Path("yt-dlp")
GAPS_PATH = ROOT / "data" / "creators_gaps.json"
PROGRESS_PATH = ROOT / "data" / "raw" / "youtube_progress.json"
YT_SKIP_KEYS = ("wrong_identity", "youtube_handle_not_found", "youtube_com_only")


def _gap_skip() -> set[str]:
    payload = json.loads(GAPS_PATH.read_text(encoding="utf-8"))
    skip: set[str] = set()
    for key in YT_SKIP_KEYS:
        skip.update(payload.get(key) or [])
    return skip


def youtube_creators(seed_path: Path | None = None) -> list[tuple]:
    skip = _gap_skip()
    rows = []
    for row in load_seed(seed_path or SEED_PATH):
        creator_id, name, cat, _primary, _web, youtube_url, channel_id, lang = row
        if creator_id in skip or not channel_id:
            continue
        rows.append((creator_id, name, cat, channel_id, youtube_url, lang))
    order = {
        "chef_pl": 0,
        "influencer_pl": 1,
        "chef_global": 2,
        "influencer_global": 3,
    }
    rows.sort(key=lambda row: (order.get(row[2], 9), row[0]))
    return rows


def channel_videos_url(channel_id: str, youtube_url: str | None = None) -> str:
    if youtube_url:
        return youtube_url.rstrip("/") + "/videos"
    return f"https://www.youtube.com/channel/{channel_id}/videos"


def list_video_ids(channel_id: str, limit: int, youtube_url: str | None = None) -> list[str]:
    cmd = [
        str(YTDLP),
        "--flat-playlist",
        "--playlist-end",
        str(limit),
        "--print",
        "%(id)s",
        channel_videos_url(channel_id, youtube_url),
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
    if proc.returncode != 0:
        print(f"yt-dlp list fail {channel_id}: {proc.stderr[-400:]}", flush=True)
        return []
    ids = []
    for line in proc.stdout.splitlines():
        vid = line.strip()
        if vid:
            ids.append(vid)
    return ids


def video_meta(video_id: str) -> dict | None:
    cmd = [
        str(YTDLP),
        "--skip-download",
        "-J",
        f"https://www.youtube.com/watch?v={video_id}",
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=90)
    if proc.returncode != 0:
        return None
    try:
        return json.loads(proc.stdout)
    except json.JSONDecodeError:
        return None


def ingest_creator(
    creator_id: str,
    channel_id: str,
    max_videos: int,
    delay_secs: float,
    youtube_url: str | None = None,
    db_path: Path | None = None,
) -> dict:
    known = existing_source_urls(db_path)
    video_ids = list_video_ids(channel_id, max_videos, youtube_url)
    saved = 0
    skipped_ld = 0
    skipped_exist = 0
    skipped_quality = 0
    no_links = 0
    videos = 0
    for video_id in video_ids:
        videos += 1
        meta = video_meta(video_id)
        if not meta:
            continue
        title = (meta.get("title") or "").strip()
        desc = meta.get("description") or ""
        urls = extract_page_urls(desc)
        if not urls:
            no_links += 1
            continue
        for url in urls:
            if url in known:
                skipped_exist += 1
                continue
            time.sleep(delay_secs)
            try:
                html = fetch_text(url)
            except (UnicodeEncodeError, ValueError, OSError):
                continue
            if not html:
                continue
            recipe = parse_recipe_html(html, url)
            if recipe is None:
                skipped_ld += 1
                continue
            reason = recipe_quality(recipe)
            if reason:
                skipped_quality += 1
                continue
            save_recipe(recipe, creator_id=creator_id, db_path=db_path)
            known.add(recipe["source_url"])
            saved += 1
            print(
                f"saved {creator_id} {saved} {recipe['title']} <- {video_id} {title[:60]}",
                flush=True,
            )
        print(
            f"try yt {creator_id} {videos}/{len(video_ids)} saved={saved} links={len(urls)} no_ld={skipped_ld}",
            flush=True,
        )
    return {
        "creator_id": creator_id,
        "videos": videos,
        "saved": saved,
        "no_links": no_links,
        "skipped_ld": skipped_ld,
        "skipped_exist": skipped_exist,
        "skipped_quality": skipped_quality,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--creator-id")
    parser.add_argument("--max-videos", type=int, default=25)
    parser.add_argument("--max-creators", type=int)
    parser.add_argument("--delay", type=float, default=0.3)
    args = parser.parse_args()
    rows = youtube_creators()
    if args.creator_id:
        rows = [row for row in rows if row[0] == args.creator_id]
        if not rows:
            raise SystemExit(f"no youtube channel for {args.creator_id}")
    done: set[str] = set()
    if PROGRESS_PATH.exists():
        try:
            prev = json.loads(PROGRESS_PATH.read_text(encoding="utf-8"))
            done = {item["creator_id"] for item in prev if item.get("creator_id")}
        except (json.JSONDecodeError, TypeError):
            prev = []
    else:
        prev = []
    if not args.creator_id:
        rows = [row for row in rows if row[0] not in done]
    else:
        prev = [item for item in prev if item.get("creator_id") != args.creator_id]
    if args.max_creators is not None:
        rows = rows[: args.max_creators]
    results = list(prev)
    PROGRESS_PATH.parent.mkdir(parents=True, exist_ok=True)
    for creator_id, name, cat, channel_id, _yt_url, _lang in rows:
        print(f"yt start {creator_id} {cat} {channel_id}", flush=True)
        result = ingest_creator(
            creator_id,
            channel_id,
            max_videos=args.max_videos,
            delay_secs=args.delay,
            youtube_url=_yt_url,
        )
        results.append(result)
        PROGRESS_PATH.write_text(
            json.dumps(results, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"yt done {json.dumps(result, ensure_ascii=False)}", flush=True)
    print(json.dumps({"results": results}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
