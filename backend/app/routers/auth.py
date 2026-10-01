from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from fastapi.responses import RedirectResponse
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from .. import auth as auth_service
from ..config import get_settings
from ..db import get_session
from ..models import User, UserSession
from ..ratings import anonymize_user_ratings
from ..schemas import AuthStatusOut, MobileAuthExchangeIn

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_cookie(
    response: Response,
    name: str,
    value: str,
    max_age: int | None = None,
    *,
    samesite: str | None = None,
) -> None:
    settings = get_settings()
    if max_age is None and name == settings.auth_cookie_name:
        max_age = settings.auth_session_ttl_days * 24 * 60 * 60
    if samesite is None:
        samesite = "none" if name == settings.auth_cookie_name and settings.secure_auth_cookies else "lax"
    response.set_cookie(
        key=name,
        value=value,
        max_age=max_age,
        httponly=True,
        secure=settings.secure_auth_cookies,
        samesite=samesite,
        path="/",
    )


def _clear_cookie(response: Response, name: str) -> None:
    response.delete_cookie(key=name, path="/")


def _current_user(request: Request, session: Session = Depends(get_session)) -> User:
    return auth_service.current_user(request, session, get_settings())


@router.get("/google/start")
def google_start(
    client: str = Query(default="web"),
    session: Session = Depends(get_session),
) -> RedirectResponse:
    settings = get_settings()
    auth_service.require_google_config(settings)
    if client not in {"web", "mobile"}:
        raise HTTPException(status_code=400, detail="Unsupported auth client")
    state = auth_service.random_token()
    nonce = auth_service.random_token()
    code_verifier, challenge = auth_service.create_pkce_pair()
    auth_service.save_oauth_state(
        session,
        state,
        code_verifier,
        nonce,
        is_mobile=client == "mobile",
    )
    response = RedirectResponse(
        auth_service.google_authorization_url(settings, state, nonce, challenge), status_code=303
    )
    _set_cookie(response, settings.auth_state_cookie_name, state, max_age=600)
    return response


@router.get("/google/callback")
def google_callback(
    request: Request,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    session: Session = Depends(get_session),
) -> RedirectResponse:
    settings = get_settings()
    if error:
        raise HTTPException(status_code=400, detail="Google login was cancelled")
    if not code or not state:
        raise HTTPException(status_code=400, detail="Google callback is missing required parameters")
    state_cookie = request.cookies.get(settings.auth_state_cookie_name)
    if not state_cookie or not auth_service.secure_compare(state_cookie, state):
        raise HTTPException(status_code=400, detail="OAuth state validation failed")
    try:
        oauth_state = auth_service.consume_oauth_state(session, state)
        raw_id_token = auth_service.exchange_google_code(settings, code, oauth_state.code_verifier)
        google_subject = auth_service.verify_google_subject(settings, raw_id_token, oauth_state.nonce)
    except auth_service.GoogleOAuthError as exc:
        raise HTTPException(status_code=400, detail="Google login could not be completed") from exc

    user = session.scalar(select(User).where(User.google_subject == google_subject))
    if user is None:
        user = User(google_subject=google_subject, created_at=auth_service.utcnow())
        session.add(user)
        session.flush()
    if oauth_state.is_mobile:
        handoff_code = auth_service.create_mobile_auth_handoff(session, user)
        session.commit()
        response = RedirectResponse(
            f"{settings.auth_mobile_redirect_uri}?code={handoff_code}",
            status_code=303,
        )
        _clear_cookie(response, settings.auth_state_cookie_name)
        return response
    raw_session_token = auth_service.create_user_session(session, user, settings)
    session.commit()

    response = RedirectResponse(settings.auth_frontend_url, status_code=303)
    _set_cookie(response, settings.auth_cookie_name, raw_session_token)
    _clear_cookie(response, settings.auth_state_cookie_name)
    return response


@router.post("/mobile/exchange", response_model=AuthStatusOut)
def mobile_auth_exchange(
    payload: MobileAuthExchangeIn,
    response: Response,
    session: Session = Depends(get_session),
) -> AuthStatusOut:
    user_id = auth_service.consume_mobile_auth_handoff(session, payload.code)
    if user_id is None:
        raise HTTPException(status_code=400, detail="Mobile auth handoff is invalid or expired")
    user = session.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=400, detail="Mobile auth account no longer exists")
    raw_session_token = auth_service.create_user_session(session, user, get_settings())
    session.commit()
    _set_cookie(response, get_settings().auth_cookie_name, raw_session_token)
    return AuthStatusOut(authenticated=True)


@router.get("/me", response_model=AuthStatusOut)
def auth_me(
    request: Request,
    response: Response,
    session: Session = Depends(get_session),
) -> AuthStatusOut:
    settings = get_settings()
    raw_token = request.cookies.get(settings.auth_cookie_name)
    user_session = auth_service.find_user_session(session, raw_token)
    if user_session is None:
        return AuthStatusOut(authenticated=False)
    auth_service.touch_session(session, user_session, settings)
    if raw_token:
        _set_cookie(response, settings.auth_cookie_name, raw_token)
    return AuthStatusOut(authenticated=True)


@router.post("/logout", status_code=204)
def logout(request: Request, response: Response, session: Session = Depends(get_session)) -> None:
    settings = get_settings()
    raw_token = request.cookies.get(settings.auth_cookie_name)
    user_session = auth_service.find_user_session(session, raw_token)
    if user_session is not None:
        session.delete(user_session)
        session.commit()
    _clear_cookie(response, settings.auth_cookie_name)


@router.post("/logout-all", status_code=204)
def logout_all(
    response: Response,
    user: User = Depends(_current_user),
    session: Session = Depends(get_session),
) -> None:
    settings = get_settings()
    session.execute(delete(UserSession).where(UserSession.user_id == user.id))
    session.commit()
    _clear_cookie(response, settings.auth_cookie_name)


@router.delete("/account", status_code=204)
def delete_account(
    response: Response,
    user: User = Depends(_current_user),
    session: Session = Depends(get_session),
) -> None:
    settings = get_settings()
    anonymize_user_ratings(session, user.id)
    session.delete(user)
    session.commit()
    _clear_cookie(response, settings.auth_cookie_name)
