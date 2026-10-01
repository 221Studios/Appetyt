from pathlib import Path
from urllib.parse import parse_qs, urlparse

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import sessionmaker

from app import auth as auth_service
from app.config import get_settings
from app.db import get_session
from app.main import app
from app.models import Base, OAuthState, User, UserSession


def make_auth_client(tmp_path: Path, monkeypatch) -> tuple[TestClient, sessionmaker]:
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "test-google-client")
    monkeypatch.setenv("GOOGLE_CLIENT_SECRET", "test-google-secret")
    monkeypatch.setenv("GOOGLE_REDIRECT_URI", "http://testserver/api/v1/auth/google/callback")
    monkeypatch.setenv("AUTH_FRONTEND_URL", "http://frontend.test")
    monkeypatch.setenv("AUTH_COOKIE_SECURE", "false")
    monkeypatch.setenv("ENVIRONMENT", "test")
    get_settings.cache_clear()

    engine = create_engine(f"sqlite:///{tmp_path / 'auth.sqlite'}", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    session_factory = sessionmaker(bind=engine, expire_on_commit=False)

    def override_session():
        with session_factory() as session:
            yield session

    app.dependency_overrides[get_session] = override_session
    return TestClient(app), session_factory


def test_google_start_creates_pkce_state_and_redirect(tmp_path: Path, monkeypatch) -> None:
    client, session_factory = make_auth_client(tmp_path, monkeypatch)
    response = client.get("/api/v1/auth/google/start", follow_redirects=False)

    assert response.status_code == 303
    location = response.headers["location"]
    params = parse_qs(urlparse(location).query)
    assert params["client_id"] == ["test-google-client"]
    assert params["scope"] == ["openid"]
    assert params["code_challenge_method"] == ["S256"]
    assert params["state"] == [client.cookies.get("appetyt_oauth_state")]
    assert client.cookies.get("appetyt_oauth_state")

    with session_factory() as session:
        assert session.scalar(select(func.count()).select_from(OAuthState)) == 1

    app.dependency_overrides.clear()
    get_settings.cache_clear()


def test_google_callback_creates_minimal_user_and_persistent_session(
    tmp_path: Path, monkeypatch
) -> None:
    client, session_factory = make_auth_client(tmp_path, monkeypatch)
    start = client.get("/api/v1/auth/google/start", follow_redirects=False)
    params = parse_qs(urlparse(start.headers["location"]).query)
    monkeypatch.setattr(
        auth_service,
        "exchange_google_code",
        lambda settings, code, code_verifier: "fake-id-token",
    )
    monkeypatch.setattr(
        auth_service,
        "verify_google_subject",
        lambda settings, raw_id_token, expected_nonce: "google-subject-only",
    )

    callback = client.get(
        "/api/v1/auth/google/callback",
        params={"code": "google-code", "state": params["state"][0]},
        follow_redirects=False,
    )

    assert callback.status_code == 303
    assert callback.headers["location"] == "http://frontend.test"
    assert client.cookies.get("appetyt_session")
    assert "Max-Age=31536000" in callback.headers["set-cookie"]
    assert client.cookies.get("appetyt_oauth_state") is None
    assert client.get("/api/v1/auth/me").json() == {"authenticated": True, "is_admin": False}

    with session_factory() as session:
        user = session.scalar(select(User))
        assert user is not None
        assert user.google_subject == "google-subject-only"
        assert session.scalar(select(func.count()).select_from(User)) == 1
        assert session.scalar(select(func.count()).select_from(UserSession)) == 1

    app.dependency_overrides.clear()
    get_settings.cache_clear()


def test_mobile_google_callback_hands_off_one_time_code_to_app(
    tmp_path: Path, monkeypatch
) -> None:
    client, session_factory = make_auth_client(tmp_path, monkeypatch)
    start = client.get("/api/v1/auth/google/start?client=mobile", follow_redirects=False)
    params = parse_qs(urlparse(start.headers["location"]).query)
    monkeypatch.setattr(
        auth_service,
        "exchange_google_code",
        lambda settings, code, code_verifier: "fake-id-token",
    )
    monkeypatch.setattr(
        auth_service,
        "verify_google_subject",
        lambda settings, raw_id_token, expected_nonce: "mobile-google-subject",
    )

    callback = client.get(
        "/api/v1/auth/google/callback",
        params={"code": "google-code", "state": params["state"][0]},
        follow_redirects=False,
    )

    assert callback.status_code == 303
    callback_url = urlparse(callback.headers["location"])
    assert callback_url.scheme == "appetyt"
    assert callback_url.netloc == "auth"
    handoff_code = parse_qs(callback_url.query)["code"][0]
    assert client.cookies.get("appetyt_session") is None

    exchange = client.post("/api/v1/auth/mobile/exchange", json={"code": handoff_code})
    assert exchange.status_code == 200
    assert exchange.json() == {"authenticated": True, "is_admin": False}
    assert client.get("/api/v1/auth/me").json() == {"authenticated": True, "is_admin": False}

    replay = client.post("/api/v1/auth/mobile/exchange", json={"code": handoff_code})
    assert replay.status_code == 400

    with session_factory() as session:
        assert session.scalar(select(func.count()).select_from(UserSession)) == 1

    app.dependency_overrides.clear()
    get_settings.cache_clear()


def test_oauth_state_is_bound_to_browser_cookie(tmp_path: Path, monkeypatch) -> None:
    client, _ = make_auth_client(tmp_path, monkeypatch)
    client.get("/api/v1/auth/google/start", follow_redirects=False)

    response = client.get(
        "/api/v1/auth/google/callback",
        params={"code": "google-code", "state": "attacker-state"},
        follow_redirects=False,
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "OAuth state validation failed"
    app.dependency_overrides.clear()
    get_settings.cache_clear()


def test_logout_all_and_account_deletion_revoke_sessions(tmp_path: Path, monkeypatch) -> None:
    client, session_factory = make_auth_client(tmp_path, monkeypatch)
    start = client.get("/api/v1/auth/google/start", follow_redirects=False)
    state = parse_qs(urlparse(start.headers["location"]).query)["state"][0]
    monkeypatch.setattr(auth_service, "exchange_google_code", lambda *args: "fake-id-token")
    monkeypatch.setattr(auth_service, "verify_google_subject", lambda *args: "google-subject")
    client.get(
        "/api/v1/auth/google/callback",
        params={"code": "google-code", "state": state},
        follow_redirects=False,
    )

    with session_factory() as session:
        user = session.scalar(select(User))
        assert user is not None
        auth_service.create_user_session(session, user, get_settings())
        session.commit()
        assert session.scalar(select(func.count()).select_from(UserSession)) == 2

    logout_all = client.post("/api/v1/auth/logout-all")
    assert logout_all.status_code == 204
    assert client.get("/api/v1/auth/me").json() == {"authenticated": False, "is_admin": False}
    with session_factory() as session:
        assert session.scalar(select(func.count()).select_from(UserSession)) == 0

    # Recreate one session to prove account deletion also removes the account itself.
    with session_factory() as session:
        user = session.scalar(select(User))
        assert user is not None
        raw_token = auth_service.create_user_session(session, user, get_settings())
        session.commit()
    client.cookies.set(get_settings().auth_cookie_name, raw_token)

    deleted = client.delete("/api/v1/auth/account")
    assert deleted.status_code == 204
    with session_factory() as session:
        assert session.scalar(select(func.count()).select_from(User)) == 0
        assert session.scalar(select(func.count()).select_from(UserSession)) == 0

    app.dependency_overrides.clear()
    get_settings.cache_clear()
