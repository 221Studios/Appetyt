"""Pull non-YouTube page URLs out of a video description."""

from __future__ import annotations

import re
from urllib.parse import urlparse

URL_RE = re.compile(r"https?://[^\s<>\"')\]]+", re.IGNORECASE)
SKIP_HOST_PARTS = (
    "youtube.com",
    "youtu.be",
    "instagram.com",
    "facebook.com",
    "fb.com",
    "fb.watch",
    "tiktok.com",
    "twitter.com",
    "x.com",
    "patreon.com",
    "discord.gg",
    "discord.com",
    "spotify.com",
    "music.apple.com",
    "play.google.com",
    "apps.apple.com",
    "ko-fi.com",
    "linktr.ee",
)


def extract_page_urls(text: str) -> list[str]:
    found: list[str] = []
    seen: set[str] = set()
    for match in URL_RE.finditer(text or ""):
        url = match.group(0).rstrip(".,;:!?")
        url = "".join(ch for ch in url if ch.isascii())
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https") or not parsed.netloc:
            continue
        host = urlparse(url).netloc.lower()
        if any(part in host for part in SKIP_HOST_PARTS):
            continue
        if url in seen:
            continue
        seen.add(url)
        found.append(url)
    return found
