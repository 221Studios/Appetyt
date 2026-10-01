"""Recipe-link submission workflow and public-page metadata extraction."""

from __future__ import annotations

import html as html_lib
import ipaddress
import json
import re
import socket
from dataclasses import dataclass
from datetime import datetime, timezone
from html.parser import HTMLParser
from typing import TYPE_CHECKING, Any, Protocol
from urllib.parse import urljoin, urlsplit, urlunsplit
from uuid import uuid4

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Recipe, RecipeSubmission, RecipeSubmissionAttempt, User

if TYPE_CHECKING:
    from .recipe_images import RecipeImageStore

SUBMISSION_PARSER_VERSION = "recipe-link-v1"
MAX_PAGE_BYTES = 2 * 1024 * 1024
MAX_REDIRECTS = 5
ALLOWED_CONTENT_TYPES = {"text/html", "application/xhtml+xml"}
ADULT_TERMS = (
    "porn",
    "porno",
    "pornografia",
    "xxx",
    "adult video",
    "adult content",
    "hentai",
    "nude",
    "onlyfans",
    "escort",
)


class SubmissionError(ValueError):
    def __init__(self, code: str, detail: str) -> None:
        super().__init__(detail)
        self.code = code
        self.detail = detail


@dataclass(frozen=True)
class FetchedPage:
    final_url: str
    status_code: int
    content_type: str | None
    body: bytes


@dataclass(frozen=True)
class RecipeMetadata:
    title: str | None
    author: str | None
    image_url: str | None
    canonical_url: str | None
    provenance: dict[str, str]
    recipe_signals: dict[str, bool]
    content_flags: list[str]
    recipe_confidence: float


class PageFetcher(Protocol):
    def fetch(self, url: str) -> FetchedPage:
        """Fetch one public HTML page without following an unsafe redirect."""


class _PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.title_parts: list[str] = []
        self.body_parts: list[str] = []
        self.meta: dict[str, str] = {}
        self.canonical_url: str | None = None
        self.jsonld_parts: list[str] = []
        self.image_candidates: list[str] = []
        self._in_title = False
        self._in_jsonld = False
        self._current_jsonld: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {key.lower(): value or "" for key, value in attrs}
        tag = tag.lower()
        if tag == "title":
            self._in_title = True
        elif tag == "script" and values.get("type", "").lower().split(";", 1)[0] == "application/ld+json":
            self._in_jsonld = True
            self._current_jsonld = []
        elif tag == "meta":
            key = (values.get("property") or values.get("name") or "").lower()
            content = values.get("content", "").strip()
            if key and content:
                self.meta.setdefault(key, content)
        elif tag == "link" and "canonical" in values.get("rel", "").lower().split():
            href = values.get("href", "").strip()
            if href:
                self.canonical_url = href
        elif tag == "img":
            source = values.get("src") or values.get("data-src") or values.get("data-lazy-src")
            if not source and values.get("srcset"):
                source = values["srcset"].split(",", 1)[0].strip().split(" ", 1)[0]
            classes = f"{values.get('class', '')} {values.get('itemprop', '')}".lower()
            if source and (
                "recipe" in classes or "hero" in classes or "main" in classes or "image" in classes
            ):
                self.image_candidates.append(source)

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag == "title":
            self._in_title = False
        elif tag == "script" and self._in_jsonld:
            self._in_jsonld = False
            value = "".join(self._current_jsonld).strip()
            if value:
                self.jsonld_parts.append(value)
            self._current_jsonld = []

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self.title_parts.append(data)
        elif self._in_jsonld:
            self._current_jsonld.append(data)
        elif data.strip():
            self.body_parts.append(data)


def normalize_url(value: str) -> str:
    candidate = value.strip()
    parsed = urlsplit(candidate)
    if parsed.scheme.lower() not in {"http", "https"}:
        raise SubmissionError("invalid_scheme", "Only public HTTP(S) pages are supported")
    if not parsed.hostname or parsed.username or parsed.password:
        raise SubmissionError("invalid_url", "The URL must contain a public hostname without credentials")
    try:
        host = parsed.hostname.encode("idna").decode("ascii").lower()
        port = parsed.port
    except (UnicodeError, ValueError) as exc:
        raise SubmissionError("invalid_url", "The URL hostname or port is invalid") from exc
    if port not in {None, 80, 443}:
        raise SubmissionError("invalid_port", "Only default HTTP(S) ports are supported")
    netloc = host
    if port is not None:
        netloc = f"{host}:{port}"
    path = parsed.path or "/"
    return urlunsplit((parsed.scheme.lower(), netloc, path, parsed.query, ""))


def _assert_public_host(url: str) -> None:
    parsed = urlsplit(url)
    host = parsed.hostname or ""
    if host.lower() in {"localhost", "localhost.localdomain"} or host.lower().endswith(".local"):
        raise SubmissionError("private_host", "Private and local hosts are not allowed")
    try:
        literal = ipaddress.ip_address(host)
        addresses = [literal]
    except ValueError:
        try:
            addresses = [
                ipaddress.ip_address(item[4][0])
                for item in socket.getaddrinfo(
                    host,
                    parsed.port or (443 if parsed.scheme == "https" else 80),
                    type=socket.SOCK_STREAM,
                )
            ]
        except OSError as exc:
            raise SubmissionError("dns_failed", "The source hostname could not be resolved") from exc
    if not addresses or any(not address.is_global for address in addresses):
        raise SubmissionError("private_host", "The source hostname resolves to a private address")


class HttpxPageFetcher:
    def __init__(self, *, timeout: float = 15.0, max_bytes: int = MAX_PAGE_BYTES) -> None:
        self.timeout = timeout
        self.max_bytes = max_bytes

    def fetch(self, url: str) -> FetchedPage:
        current = normalize_url(url)
        headers = {"User-Agent": "AppetytRecipeSubmission/1.0", "Accept": "text/html,application/xhtml+xml"}
        with httpx.Client(timeout=self.timeout, follow_redirects=False, headers=headers) as client:
            for _ in range(MAX_REDIRECTS + 1):
                _assert_public_host(current)
                try:
                    response = client.get(current)
                except httpx.HTTPError as exc:
                    raise SubmissionError("fetch_failed", "The source page could not be fetched") from exc
                if 300 <= response.status_code < 400:
                    location = response.headers.get("location")
                    if not location:
                        raise SubmissionError(
                            "redirect_without_location", "The source returned an invalid redirect"
                        )
                    current = normalize_url(urljoin(current, location))
                    continue
                content_type = (
                    response.headers.get("content-type", "").split(";", 1)[0].strip().lower() or None
                )
                if response.status_code >= 400:
                    raise SubmissionError("http_error", f"The source returned HTTP {response.status_code}")
                if content_type not in ALLOWED_CONTENT_TYPES:
                    raise SubmissionError("unsupported_content_type", "The source is not an HTML page")
                body = response.content
                if len(body) > self.max_bytes:
                    raise SubmissionError("page_too_large", "The source page exceeds the size limit")
                return FetchedPage(current, response.status_code, content_type, body)
        raise SubmissionError("too_many_redirects", "The source redirected too many times")


def _clean(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    cleaned = html_lib.unescape(re.sub(r"\s+", " ", value)).strip()
    return cleaned or None


def _jsonld_nodes(value: Any) -> list[dict[str, Any]]:
    if isinstance(value, list):
        nodes: list[dict[str, Any]] = []
        for item in value:
            nodes.extend(_jsonld_nodes(item))
        return nodes
    if not isinstance(value, dict):
        return []
    nodes = [value]
    graph = value.get("@graph")
    if graph is not None:
        nodes.extend(_jsonld_nodes(graph))
    return nodes


def _is_recipe_node(node: dict[str, Any]) -> bool:
    types = node.get("@type", [])
    if isinstance(types, str):
        types = [types]
    return any(str(item).lower() == "recipe" for item in types)


def _first_name(value: Any) -> str | None:
    if isinstance(value, list):
        for item in value:
            name = _first_name(item)
            if name:
                return name
        return None
    if isinstance(value, dict):
        return _clean(value.get("name"))
    return _clean(value)


def _first_image(value: Any, page_url: str) -> str | None:
    if isinstance(value, list):
        for item in value:
            image = _first_image(item, page_url)
            if image:
                return image
        return None
    if isinstance(value, dict):
        value = value.get("url") or value.get("contentUrl") or value.get("thumbnailUrl")
    if not isinstance(value, str) or not value.strip():
        return None
    return urljoin(page_url, value.strip())


def extract_recipe_metadata(html: str, page_url: str) -> RecipeMetadata:
    parser = _PageParser()
    parser.feed(html)
    parsed_jsonld: list[dict[str, Any]] = []
    for raw in parser.jsonld_parts:
        try:
            parsed_jsonld.extend(_jsonld_nodes(json.loads(raw)))
        except (TypeError, json.JSONDecodeError):
            continue

    recipe_node = next((node for node in parsed_jsonld if _is_recipe_node(node)), None)
    jsonld_ingredients = bool(recipe_node and recipe_node.get("recipeIngredient"))
    jsonld_instructions = bool(recipe_node and recipe_node.get("recipeInstructions"))
    title = _clean(recipe_node.get("name")) if recipe_node else None
    author = _first_name(recipe_node.get("author")) if recipe_node else None
    image_url = _first_image(recipe_node.get("image"), page_url) if recipe_node else None
    provenance: dict[str, str] = {}
    if title:
        provenance["title"] = "jsonld:Recipe.name"
    if author:
        provenance["author"] = "jsonld:Recipe.author.name"
    if image_url:
        provenance["image"] = "jsonld:Recipe.image"

    if not title:
        title = _clean(parser.meta.get("og:title")) or _clean("".join(parser.title_parts))
        if title:
            provenance["title"] = "meta:og:title" if parser.meta.get("og:title") else "html:title"
    if not author:
        author = _clean(parser.meta.get("author")) or _clean(parser.meta.get("article:author"))
        if author:
            provenance["author"] = "meta:author"
    if not image_url:
        image_url = (
            _first_image(parser.meta.get("og:image"), page_url)
            or _first_image(parser.meta.get("twitter:image"), page_url)
            or _first_image(parser.image_candidates, page_url)
        )
        if image_url:
            provenance["image"] = "meta:og:image" if parser.meta.get("og:image") else "html:img"

    body_text = " ".join(parser.body_parts[:200]).lower()
    metadata_text = " ".join(
        value.lower() for value in [title or "", author or "", parser.meta.get("description", ""), body_text]
    )
    content_flags = []
    if any(term in metadata_text for term in ADULT_TERMS):
        content_flags.append("adult_keywords")
    has_ingredient_signal = jsonld_ingredients or bool(re.search(r"\bingredient|składnik", metadata_text))
    has_instruction_signal = jsonld_instructions or bool(
        re.search(r"instruction|directions|method|przygot", metadata_text)
    )
    if recipe_node and jsonld_ingredients and jsonld_instructions:
        confidence = 1.0
    elif recipe_node:
        confidence = 0.7
    elif has_ingredient_signal and has_instruction_signal:
        confidence = 0.8
    elif has_ingredient_signal or has_instruction_signal:
        confidence = 0.4
    else:
        confidence = 0.0
    if confidence < 0.5:
        content_flags.append("missing_recipe_signals")

    canonical = parser.canonical_url or parser.meta.get("og:url")
    canonical_url = urljoin(page_url, canonical) if canonical else page_url
    recipe_signals = {
        "jsonld_recipe": recipe_node is not None,
        "recipe_ingredients": jsonld_ingredients,
        "recipe_instructions": jsonld_instructions,
        "title_found": title is not None,
        "author_found": author is not None,
        "image_found": image_url is not None,
    }
    return RecipeMetadata(
        title=title,
        author=author,
        image_url=image_url,
        canonical_url=canonical_url,
        provenance=provenance,
        recipe_signals=recipe_signals,
        content_flags=content_flags,
        recipe_confidence=confidence,
    )


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _json_dict(value: str | None) -> dict[str, Any]:
    if not value:
        return {}
    try:
        loaded = json.loads(value)
    except json.JSONDecodeError:
        return {}
    return loaded if isinstance(loaded, dict) else {}


def _json_list(value: str | None) -> list[str]:
    if not value:
        return []
    try:
        loaded = json.loads(value)
    except json.JSONDecodeError:
        return []
    return [str(item) for item in loaded] if isinstance(loaded, list) else []


def process_submission(
    session: Session, submission: RecipeSubmission, fetcher: PageFetcher | None = None
) -> None:
    fetcher = fetcher or HttpxPageFetcher()
    submission.status = "processing"
    submission.updated_at = _now()
    attempt_number = len(submission.attempts) + 1
    attempt = RecipeSubmissionAttempt(
        submission=submission,
        attempt_number=attempt_number,
        created_at=_now(),
    )
    session.add(attempt)
    try:
        page = fetcher.fetch(submission.normalized_url)
        html = page.body.decode("utf-8", errors="replace")
        metadata = extract_recipe_metadata(html, page.final_url)
        attempt.final_url = metadata.canonical_url or page.final_url
        attempt.http_status = page.status_code
        attempt.content_type = page.content_type
        attempt.extracted_title = metadata.title
        attempt.extracted_author = metadata.author
        attempt.source_image_url = metadata.image_url
        attempt.provenance_json = json.dumps(metadata.provenance, ensure_ascii=False)
        attempt.recipe_signals_json = json.dumps(metadata.recipe_signals, ensure_ascii=False)
        attempt.content_flags_json = json.dumps(metadata.content_flags, ensure_ascii=False)
        attempt.recipe_confidence = metadata.recipe_confidence
        attempt.parser_version = SUBMISSION_PARSER_VERSION

        submission.final_url = attempt.final_url
        submission.http_status = page.status_code
        submission.content_type = page.content_type
        submission.extracted_title = metadata.title
        submission.extracted_author = metadata.author
        submission.source_image_url = metadata.image_url
        submission.provenance_json = attempt.provenance_json
        submission.recipe_signals_json = attempt.recipe_signals_json
        submission.content_flags_json = attempt.content_flags_json
        submission.recipe_confidence = metadata.recipe_confidence
        submission.parser_version = SUBMISSION_PARSER_VERSION
        submission.last_error = None
        submission.status = "awaiting_review"
    except SubmissionError as exc:
        attempt.error_code = exc.code
        attempt.error_detail = exc.detail
        submission.last_error = f"{exc.code}: {exc.detail}"
        submission.status = "failed"
    finally:
        submission.updated_at = _now()


def publish_submission(
    session: Session,
    submission: RecipeSubmission,
    admin: User,
    *,
    title: str | None = None,
    author_name: str | None = None,
    image_url: str | None = None,
    admin_note: str | None = None,
    image_store: RecipeImageStore | None = None,
) -> Recipe:
    if submission.status == "approved" and submission.published_recipe is not None:
        return submission.published_recipe
    if submission.status != "awaiting_review":
        raise SubmissionError("invalid_state", "Only a submission awaiting review can be approved")

    final_title = _clean(title) or _clean(submission.title_override) or _clean(submission.extracted_title)
    if not final_title:
        raise SubmissionError("missing_title", "A title is required before approval")
    final_url = submission.final_url or submission.normalized_url
    final_author = (
        _clean(author_name) or _clean(submission.author_override) or _clean(submission.extracted_author)
    )
    final_image_source = (
        _clean(image_url) or _clean(submission.image_override_url) or _clean(submission.source_image_url)
    )
    final_image = final_image_source
    if (
        image_store is not None
        and final_image_source
        and not final_image_source.startswith("/recipe-images/")
    ):
        try:
            final_image = image_store.from_url(final_image_source, f"{submission.id}-cover")
        except SubmissionError:
            if image_url or submission.image_override_url:
                raise
            final_image = None
    recipe = Recipe(
        id=f"user-submission-{uuid4().hex}",
        title=final_title,
        subtitle=None,
        category="Zewnętrzne",
        cuisine=None,
        creator_id=None,
        source_url=final_url,
        source_kind="user_submitted_link",
        source_author_name=final_author,
        cover_image_url=final_image,
        source_updated_at=_now(),
        duration_minutes=None,
        servings=None,
        calories_per_serving=None,
        protein_per_serving=None,
        fat_per_serving=None,
        carbs_per_serving=None,
    )
    session.add(recipe)
    submission.title_override = final_title
    submission.author_override = final_author
    submission.image_override_url = final_image
    submission.admin_note = _clean(admin_note)
    submission.status = "approved"
    submission.reviewed_at = _now()
    submission.reviewed_by_user_id = admin.id
    submission.published_recipe = recipe
    session.flush()
    return recipe


def submission_payload(submission: RecipeSubmission) -> dict[str, Any]:
    latest = submission.attempts[-1] if submission.attempts else None
    return {
        "id": submission.id,
        "status": submission.status,
        "submitted_url": submission.submitted_url,
        "created_at": submission.created_at,
        "updated_at": submission.updated_at,
        "reviewed_at": submission.reviewed_at,
        "rejection_reason": submission.rejection_reason,
        "published_recipe_id": submission.published_recipe_id,
        "latest_attempt": attempt_payload(latest) if latest else None,
    }


def attempt_payload(attempt: RecipeSubmissionAttempt | None) -> dict[str, Any] | None:
    if attempt is None:
        return None
    return {
        "attempt_number": attempt.attempt_number,
        "created_at": attempt.created_at,
        "final_url": attempt.final_url,
        "http_status": attempt.http_status,
        "content_type": attempt.content_type,
        "extracted_title": attempt.extracted_title,
        "extracted_author": attempt.extracted_author,
        "source_image_url": attempt.source_image_url,
        "provenance": _json_dict(attempt.provenance_json),
        "recipe_signals": _json_dict(attempt.recipe_signals_json),
        "content_flags": _json_list(attempt.content_flags_json),
        "recipe_confidence": attempt.recipe_confidence,
        "parser_version": attempt.parser_version,
        "error_code": attempt.error_code,
        "error_detail": attempt.error_detail,
    }


def admin_submission_payload(submission: RecipeSubmission) -> dict[str, Any]:
    payload = submission_payload(submission)
    payload.update(
        {
            "submitted_by_user_id": submission.submitted_by_user_id,
            "final_url": submission.final_url,
            "extracted_title": submission.extracted_title,
            "extracted_author": submission.extracted_author,
            "source_image_url": submission.source_image_url,
            "recipe_confidence": submission.recipe_confidence,
            "content_flags": _json_list(submission.content_flags_json),
            "title_override": submission.title_override,
            "author_override": submission.author_override,
            "image_override_url": submission.image_override_url,
            "admin_note": submission.admin_note,
        }
    )
    return payload


def find_submission_for_user(session: Session, submission_id: str, user_id: str) -> RecipeSubmission | None:
    return session.scalar(
        select(RecipeSubmission)
        .where(RecipeSubmission.id == submission_id, RecipeSubmission.submitted_by_user_id == user_id)
    )
