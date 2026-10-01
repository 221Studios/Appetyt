import base64
import hashlib
import hmac
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import httpx
from fastapi import HTTPException, Request
from google.auth import exceptions as google_auth_exceptions
from google.oauth2 import id_token
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from .config import Settings
from .models import MobileAuthHandoff, OAuthState, User, UserSession

GOOGLE_AUTHORIZATION_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
OAUTH_STATE_TTL = timedelta(minutes=10)
MOBILE_AUTH_HANDOFF_TTL = timedelta(minutes=2)


@dataclass
class _HttpxResponse:
    status: int
    data: bytes


class _HttpxRequest:
    """Small google-auth transport adapter that keeps HTTP on the existing httpx dependency."""

    def __call__(
        self,
        url: str,
        method: str = "GET",
        body: bytes | None = None,
        headers: dict[str, str] | None = None,
        timeout: float | None = None,
        **_: object,
    ) -> _HttpxResponse:
        response = httpx.request(
            method,
            url,
            content=body,
            headers=headers,
            timeout=timeout or 10.0,
        )
        return _HttpxResponse(status=response.status_code, data=response.content)


class GoogleOAuthError(Exception):
    """Raised when Google cannot complete or validate the OAuth exchange."""


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def hash_secret(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def secure_compare(left: str, right: str) -> bool:
    return hmac.compare_digest(left, right)


def random_token(size: int = 32) -> str:
    return secrets.token_urlsafe(size)


def create_pkce_pair() -> tuple[str, str]:
    verifier = secrets.token_urlsafe(64)
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode("ascii")).digest()).rstrip(b"=")
    return verifier, challenge.decode("ascii")


def require_google_config(settings: Settings) -> None:
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(status_code=503, detail="Google login is not configured")


def google_authorization_url(settings: Settings, state: str, nonce: str, challenge: str) -> str:
    require_google_config(settings)
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": "openid",
        "state": state,
        "nonce": nonce,
        "code_challenge": challenge,
        "code_challenge_method": "S256",
    }
    return f"{GOOGLE_AUTHORIZATION_URL}?{urlencode(params)}"


def exchange_google_code(settings: Settings, code: str, code_verifier: str) -> str:
    try:
        response = httpx.post(
            GOOGLE_TOKEN_URL,
            data={
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "code": code,
                "code_verifier": code_verifier,
                "grant_type": "authorization_code",
                "redirect_uri": settings.google_redirect_uri,
            },
            timeout=10.0,
        )
        response.raise_for_status()
        payload = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise GoogleOAuthError("Google token exchange failed") from exc
    if not isinstance(payload, dict):
        raise GoogleOAuthError("Google token response was invalid")
    token = payload.get("id_token")
    if not isinstance(token, str) or not token:
        raise GoogleOAuthError("Google did not return an ID token")
    return token


def verify_google_subject(settings: Settings, raw_id_token: str, expected_nonce: str) -> str:
    try:
        claims = id_token.verify_oauth2_token(
            raw_id_token,
            _HttpxRequest(),
            settings.google_client_id,
        )
    except (ValueError, google_auth_exceptions.GoogleAuthError, httpx.HTTPError) as exc:
        raise GoogleOAuthError("Google ID token validation failed") from exc
    if claims.get("nonce") != expected_nonce:
        raise GoogleOAuthError("Google ID token nonce did not match")
    subject = claims.get("sub")
    if not isinstance(subject, str) or not subject:
        raise GoogleOAuthError("Google ID token has no subject")
    return subject


def save_oauth_state(
    session: Session,
    state: str,
    code_verifier: str,
    nonce: str,
    *,
    is_mobile: bool = False,
) -> None:
    now = utcnow()
    session.execute(delete(OAuthState).where(OAuthState.expires_at <= now))
    session.add(
        OAuthState(
            state_hash=hash_secret(state),
            code_verifier=code_verifier,
            nonce=nonce,
            is_mobile=is_mobile,
            created_at=now,
            expires_at=now + OAUTH_STATE_TTL,
        )
    )
    session.commit()


def consume_oauth_state(session: Session, state: str) -> OAuthState:
    row = session.get(OAuthState, hash_secret(state))
    if row is None or as_utc(row.expires_at) <= utcnow():
        if row is not None:
            session.delete(row)
            session.commit()
        raise GoogleOAuthError("OAuth state is invalid or expired")
    session.delete(row)
    session.commit()
    return row


def create_mobile_auth_handoff(session: Session, user: User) -> str:
    now = utcnow()
    session.execute(delete(MobileAuthHandoff).where(MobileAuthHandoff.expires_at <= now))
    raw_code = random_token()
    session.add(
        MobileAuthHandoff(
            code_hash=hash_secret(raw_code),
            user_id=user.id,
            created_at=now,
            expires_at=now + MOBILE_AUTH_HANDOFF_TTL,
        )
    )
    return raw_code


def consume_mobile_auth_handoff(session: Session, raw_code: str) -> str | None:
    row = session.scalar(
        select(MobileAuthHandoff)
        .where(MobileAuthHandoff.code_hash == hash_secret(raw_code))
        .with_for_update()
    )
    if row is None:
        return None
    if as_utc(row.expires_at) <= utcnow():
        session.delete(row)
        session.commit()
        return None
    user_id = row.user_id
    session.delete(row)
    session.flush()
    return user_id


def find_user_session(session: Session, raw_token: str | None) -> UserSession | None:
    if not raw_token:
        return None
    row = session.scalar(
        select(UserSession).where(UserSession.token_hash == hash_secret(raw_token))
    )
    if row is None:
        return None
    if as_utc(row.expires_at) <= utcnow():
        session.delete(row)
        session.commit()
        return None
    return row


def touch_session(session: Session, user_session: UserSession, settings: Settings) -> None:
    now = utcnow()
    user_session.last_seen_at = now
    user_session.expires_at = now + timedelta(days=settings.auth_session_ttl_days)
    session.commit()


def create_user_session(session: Session, user: User, settings: Settings) -> str:
    now = utcnow()
    raw_token = secrets.token_urlsafe(48)
    session.add(
        UserSession(
            user=user,
            token_hash=hash_secret(raw_token),
            created_at=now,
            last_seen_at=now,
            expires_at=now + timedelta(days=settings.auth_session_ttl_days),
        )
    )
    return raw_token


def current_user(request: Request, session: Session, settings: Settings) -> User:
    row = find_user_session(session, request.cookies.get(settings.auth_cookie_name))
    if row is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    touch_session(session, row, settings)
    return row.user


def current_user_if_present(request: Request, session: Session, settings: Settings) -> User | None:
    row = find_user_session(session, request.cookies.get(settings.auth_cookie_name))
    if row is None:
        return None
    touch_session(session, row, settings)
    return row.user
