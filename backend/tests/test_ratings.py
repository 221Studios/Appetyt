from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app import auth as auth_service
from app.config import get_settings
from app.db import get_session
from app.main import app
from app.models import Base, RecipeRating, User
from app.seed import seed_database


def make_rating_client(tmp_path: Path) -> tuple[TestClient, sessionmaker]:
    engine = create_engine(
        f"sqlite:///{tmp_path / 'ratings.sqlite'}", connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(engine)
    session_factory = sessionmaker(bind=engine, expire_on_commit=False)
    with session_factory() as session:
        seed_database(session, tmp_path)

    def override_session():
        with session_factory() as session:
            yield session

    app.dependency_overrides[get_session] = override_session
    return TestClient(app), session_factory


def login_user(client: TestClient, session_factory: sessionmaker, google_subject: str) -> str:
    with session_factory() as session:
        user = User(google_subject=google_subject, created_at=auth_service.utcnow())
        session.add(user)
        session.flush()
        raw_token = auth_service.create_user_session(session, user, get_settings())
        session.commit()
    client.cookies.set(get_settings().auth_cookie_name, raw_token)
    return raw_token


def test_public_rating_summary_is_empty_for_unrated_recipe(tmp_path: Path) -> None:
    client, _ = make_rating_client(tmp_path)

    response = client.get("/api/v1/recipes/carbonara-test/rating")

    assert response.status_code == 200
    assert response.json() == {
        "recipe_id": "carbonara-test",
        "average_score": None,
        "rating_count": 0,
        "distribution": {str(score): 0 for score in range(1, 11)},
        "viewer_score": None,
    }

    app.dependency_overrides.clear()


def test_logged_in_user_can_set_and_update_one_rating(tmp_path: Path) -> None:
    client, session_factory = make_rating_client(tmp_path)
    login_user(client, session_factory, "google-rating-user")

    first = client.put("/api/v1/recipes/carbonara-test/rating", json={"score": 9})
    assert first.status_code == 200
    assert first.json()["average_score"] == 9
    assert first.json()["rating_count"] == 1
    assert first.json()["distribution"]["9"] == 1
    assert first.json()["viewer_score"] == 9

    second = client.put("/api/v1/recipes/carbonara-test/rating", json={"score": 7})
    assert second.status_code == 200
    assert second.json()["average_score"] == 7
    assert second.json()["rating_count"] == 1
    assert second.json()["distribution"]["7"] == 1
    assert second.json()["distribution"]["9"] == 0
    assert second.json()["viewer_score"] == 7

    app.dependency_overrides.clear()


def test_rating_write_requires_login_and_rejects_scores_outside_one_to_ten(tmp_path: Path) -> None:
    client, session_factory = make_rating_client(tmp_path)

    anonymous = client.put("/api/v1/recipes/carbonara-test/rating", json={"score": 8})
    assert anonymous.status_code == 401

    login_user(client, session_factory, "google-validation-user")
    assert client.put("/api/v1/recipes/carbonara-test/rating", json={"score": 0}).status_code == 422
    assert client.put("/api/v1/recipes/carbonara-test/rating", json={"score": 11}).status_code == 422
    assert client.put("/api/v1/recipes/carbonara-test/rating", json={"score": 5.5}).status_code == 422

    app.dependency_overrides.clear()


def test_same_google_account_shares_rating_across_sessions(tmp_path: Path) -> None:
    client, session_factory = make_rating_client(tmp_path)
    second_client = TestClient(app)
    first_token = login_user(client, session_factory, "google-shared-account")
    with session_factory() as session:
        user = session.scalar(select(User).where(User.google_subject == "google-shared-account"))
        assert user is not None
        second_token = auth_service.create_user_session(session, user, get_settings())
        session.commit()

    client.put("/api/v1/recipes/carbonara-test/rating", json={"score": 9})
    second_client.cookies.set(get_settings().auth_cookie_name, second_token)
    assert second_client.get("/api/v1/recipes/carbonara-test/rating").json()["viewer_score"] == 9

    second_client.put("/api/v1/recipes/carbonara-test/rating", json={"score": 6})
    client.cookies.set(get_settings().auth_cookie_name, first_token)
    updated = client.get("/api/v1/recipes/carbonara-test/rating").json()
    assert updated["viewer_score"] == 6
    assert updated["rating_count"] == 1

    app.dependency_overrides.clear()


def test_user_can_delete_own_rating_and_public_aggregate_updates(tmp_path: Path) -> None:
    client, session_factory = make_rating_client(tmp_path)
    login_user(client, session_factory, "google-delete-rating-user")
    client.put("/api/v1/recipes/carbonara-test/rating", json={"score": 8})

    deleted = client.delete("/api/v1/recipes/carbonara-test/rating")

    assert deleted.status_code == 204
    summary = client.get("/api/v1/recipes/carbonara-test/rating").json()
    assert summary["rating_count"] == 0
    assert summary["average_score"] is None
    assert summary["viewer_score"] is None

    app.dependency_overrides.clear()


def test_account_deletion_keeps_rating_in_public_aggregate_without_viewer_access(
    tmp_path: Path,
) -> None:
    client, session_factory = make_rating_client(tmp_path)
    login_user(client, session_factory, "google-anonymize-rating-user")
    client.put("/api/v1/recipes/carbonara-test/rating", json={"score": 10})

    deleted = client.delete("/api/v1/auth/account")

    assert deleted.status_code == 204
    summary = client.get("/api/v1/recipes/carbonara-test/rating").json()
    assert summary["rating_count"] == 1
    assert summary["average_score"] == 10
    assert summary["viewer_score"] is None
    with session_factory() as session:
        rating = session.scalar(select(RecipeRating))
        assert rating is not None
        assert rating.user_id is None

    app.dependency_overrides.clear()
