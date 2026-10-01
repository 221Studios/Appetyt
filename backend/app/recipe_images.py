"""Safe, local image assets for published recipe-link covers."""

from __future__ import annotations

import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import BinaryIO, Protocol
from urllib.parse import urljoin

import httpx

from .config import Settings
from .submissions import SubmissionError, _assert_public_host, normalize_url

MAX_SOURCE_BYTES = 15 * 1024 * 1024


class RecipeImageStore(Protocol):
    def from_url(self, source_url: str, key: str) -> str:
        """Download, validate and store an image as an app-owned asset."""

    def from_upload(self, source: BinaryIO, key: str) -> str:
        """Validate and store an administrator-provided image."""


class LocalRecipeImageStore:
    def __init__(self, settings: Settings) -> None:
        self.root = settings.recipe_image_dir / "submissions"
        self.root.mkdir(parents=True, exist_ok=True)

    def from_url(self, source_url: str, key: str) -> str:
        url = normalize_url(source_url)
        headers = {"User-Agent": "AppetytRecipeSubmissionImage/1.0", "Accept": "image/*"}
        try:
            with httpx.Client(timeout=15.0, follow_redirects=False, headers=headers) as client:
                for _ in range(6):
                    _assert_public_host(url)
                    response = client.get(url)
                    if 300 <= response.status_code < 400:
                        location = response.headers.get("location")
                        if not location:
                            raise SubmissionError(
                                "image_redirect_invalid", "The selected cover returned an invalid redirect"
                            )
                        url = normalize_url(urljoin(url, location))
                        continue
                    response.raise_for_status()
                    content_type = response.headers.get("content-type", "").split(";", 1)[0].lower()
                    if not content_type.startswith("image/"):
                        raise SubmissionError("image_not_image", "The selected cover is not an image")
                    if len(response.content) > MAX_SOURCE_BYTES:
                        raise SubmissionError("image_too_large", "The selected cover exceeds the size limit")
                    return self._store_bytes(response.content, key)
        except SubmissionError:
            raise
        except httpx.HTTPError as exc:
            raise SubmissionError("image_fetch_failed", "The recipe image could not be fetched") from exc
        raise SubmissionError("image_too_many_redirects", "The selected cover redirected too many times")

    def from_upload(self, source: BinaryIO, key: str) -> str:
        payload = source.read(MAX_SOURCE_BYTES + 1)
        if len(payload) > MAX_SOURCE_BYTES:
            raise SubmissionError("image_too_large", "The uploaded cover exceeds the size limit")
        return self._store_bytes(payload, key)

    def _store_bytes(self, payload: bytes, key: str) -> str:
        if not payload:
            raise SubmissionError("image_empty", "The cover image is empty")
        safe_key = "".join(char for char in key if char.isalnum() or char in {"-", "_"})[:120]
        if not safe_key:
            raise SubmissionError("image_key_invalid", "The cover image key is invalid")
        output = self.root / f"{safe_key}.webp"
        with tempfile.TemporaryDirectory(prefix="appetyt-image-") as temporary:
            source_path = Path(temporary) / "source-image"
            converted_path = Path(temporary) / "cover.webp"
            source_path.write_bytes(payload)
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
                f"{source_path}[0]",
                "-auto-orient",
                "-strip",
                "-resize",
                "720x720>",
                "-quality",
                "78",
                f"webp:{converted_path}",
            ]
            try:
                result = subprocess.run(command, capture_output=True, text=True, timeout=60)
            except (OSError, subprocess.SubprocessError) as exc:
                raise SubmissionError("image_processing_failed", "The cover could not be processed") from exc
            if result.returncode != 0 or not converted_path.exists():
                raise SubmissionError("image_processing_failed", "The cover could not be processed")
            output.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(converted_path, output)
        return f"/recipe-images/submissions/{safe_key}.webp"
