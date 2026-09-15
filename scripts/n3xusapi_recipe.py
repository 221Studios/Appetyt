"""Local n3xusAPI scrape → markdown recipe. Failures never kill ingest."""

from __future__ import annotations

import json
import urllib.error
import urllib.request

from scripts.html_recipe import parse_markdown_recipe

DEFAULT_BASE = "http://127.0.0.1:8000"


def fetch_markdown(url: str, base: str = DEFAULT_BASE, timeout: int = 25) -> str | None:
    payload = json.dumps(
        {"urls": url, "contentFormat": "markdown", "maxChars": 25000}
    ).encode("utf-8")
    req = urllib.request.Request(
        f"{base.rstrip('/')}/v1/scrape/website",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            data = json.loads(response.read().decode("utf-8", errors="replace"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, OSError, ValueError):
        return None
    pages = data.get("output") or []
    if not pages or not isinstance(pages, list):
        return None
    markdown = pages[0].get("markdown") if isinstance(pages[0], dict) else None
    if not isinstance(markdown, str) or not markdown.strip():
        return None
    return markdown


def parse_via_n3xusapi(url: str, title_hint: str | None = None, base: str = DEFAULT_BASE) -> dict | None:
    markdown = fetch_markdown(url, base=base)
    if not markdown:
        return None
    return parse_markdown_recipe(markdown, url, title_hint=title_hint)
