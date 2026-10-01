import base64
from datetime import datetime, timezone
from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import auth as auth_service
from app.config import get_settings
from app.db import get_session
from app.main import app
from app.models import Base, Recipe, RecipeSubmission, User
from app.seed import seed_database
from app.submissions import FetchedPage, extract_recipe_metadata, process_submission


def make_client(tmp_path: Path) -> tuple[TestClient, sessionmaker]:
    engine = create_engine(
        f"sqlite:///{tmp_path / 'submissions.sqlite'}",
        connect_args={"check_same_thread": False},
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


def login_user(
    client: TestClient,
    session_factory: sessionmaker,
    google_subject: str,
    *,
    is_admin: bool = False,
) -> str:
    with session_factory() as session:
        user = User(
            google_subject=google_subject,
            created_at=datetime.now(timezone.utc),
            is_admin=is_admin,
        )
        session.add(user)
        session.flush()
        token = auth_service.create_user_session(session, user, get_settings())
        session.commit()
    client.cookies.set(get_settings().auth_cookie_name, token)
    return token


def test_logged_in_user_can_submit_and_read_own_recipe_link(tmp_path: Path) -> None:
    client, session_factory = make_client(tmp_path)
    login_user(client, session_factory, "submitter")

    response = client.post(
        "/api/v1/recipe-submissions",
        json={"url": "https://example.com/recipes/soup"},
    )

    assert response.status_code == 202
    payload = response.json()
    assert payload["status"] == "submitted"
    assert payload["submitted_url"] == "https://example.com/recipes/soup"
    assert payload["published_recipe_id"] is None

    own = client.get(f"/api/v1/recipe-submissions/{payload['id']}")
    assert own.status_code == 200
    assert own.json()["id"] == payload["id"]
    assert own.json()["latest_attempt"] is None

    app.dependency_overrides.clear()


def test_recipe_submission_requires_google_login(tmp_path: Path) -> None:
    client, _ = make_client(tmp_path)

    response = client.post(
        "/api/v1/recipe-submissions",
        json={"url": "https://example.com/recipes/soup"},
    )

    assert response.status_code == 401
    app.dependency_overrides.clear()


def test_admin_can_approve_extracted_submission_and_recipe_is_rateable(tmp_path: Path) -> None:
    client, session_factory = make_client(tmp_path)
    login_user(client, session_factory, "submitter")
    created = client.post(
        "/api/v1/recipe-submissions",
        json={"url": "https://example.com/recipes/soup"},
    ).json()
    submission_id = created["id"]

    with session_factory() as session:
        submission = session.get(RecipeSubmission, submission_id)
        assert submission is not None
        submission.status = "awaiting_review"
        submission.extracted_title = "Zupa testowa"
        submission.extracted_author = "Autor źródła"
        submission.final_url = "https://example.com/recipes/soup"
        session.commit()

    admin_client = TestClient(app)
    login_user(admin_client, session_factory, "admin", is_admin=True)
    admin_view = admin_client.get(f"/api/v1/admin/recipe-submissions/{submission_id}")
    assert admin_view.status_code == 200
    assert admin_view.json()["extracted_title"] == "Zupa testowa"

    approved = admin_client.post(
        f"/api/v1/admin/recipe-submissions/{submission_id}/approve",
        json={"title": "Zupa testowa po korekcie", "author_name": "Autor ręczny"},
    )

    assert approved.status_code == 200
    recipe_id = approved.json()["published_recipe_id"]
    detail = admin_client.get(f"/api/v1/recipes/{recipe_id}")
    assert detail.status_code == 200
    assert detail.json()["title"] == "Zupa testowa po korekcie"
    assert detail.json()["source_author_name"] == "Autor ręczny"
    assert detail.json()["source_kind"] == "user_submitted_link"
    assert detail.json()["is_external_link"] is True
    assert detail.json()["ingredients"] == []
    assert detail.json()["steps"] == []
    assert detail.json()["costs"] == []

    rating = admin_client.put(f"/api/v1/recipes/{recipe_id}/rating", json={"score": 9})
    assert rating.status_code == 200
    assert rating.json()["average_score"] == 9

    app.dependency_overrides.clear()


def test_admin_can_correct_title_author_and_image_before_approval(tmp_path: Path) -> None:
    client, session_factory = make_client(tmp_path)
    login_user(client, session_factory, "submitter")
    created = client.post(
        "/api/v1/recipe-submissions",
        json={"url": "https://example.com/recipes/soup"},
    ).json()

    with session_factory() as session:
        submission = session.get(RecipeSubmission, created["id"])
        assert submission is not None
        submission.status = "awaiting_review"
        submission.extracted_title = "Automatyczny tytuł"
        submission.extracted_author = "Automatyczny autor"
        submission.source_image_url = "https://example.com/images/auto.jpg"
        submission.final_url = "https://example.com/recipes/soup"
        session.commit()

    admin_client = TestClient(app)
    login_user(admin_client, session_factory, "admin", is_admin=True)
    uploaded = admin_client.post(
        f"/api/v1/admin/recipe-submissions/{created['id']}/image",
        files={
            "image": (
                "manual.png",
                base64.b64decode(
                    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
                ),
                "image/png",
            )
        },
    )
    assert uploaded.status_code == 200

    approved = admin_client.post(
        f"/api/v1/admin/recipe-submissions/{created['id']}/approve",
        json={
            "title": "Tytuł poprawiony ręcznie",
            "author_name": "Autor poprawiony ręcznie",
        },
    )

    assert approved.status_code == 200
    detail = admin_client.get(f"/api/v1/recipes/{approved.json()['published_recipe_id']}").json()
    assert detail["title"] == "Tytuł poprawiony ręcznie"
    assert detail["source_author_name"] == "Autor poprawiony ręcznie"
    assert detail["cover_image_url"].startswith("/recipe-images/submissions/")

    app.dependency_overrides.clear()


def test_account_deletion_keeps_approved_submission_and_recipe_without_submitter(tmp_path: Path) -> None:
    client, session_factory = make_client(tmp_path)
    login_user(client, session_factory, "submitter")
    created = client.post(
        "/api/v1/recipe-submissions",
        json={"url": "https://example.com/recipes/soup"},
    ).json()

    with session_factory() as session:
        submission = session.get(RecipeSubmission, created["id"])
        assert submission is not None
        submission.status = "awaiting_review"
        submission.extracted_title = "Zupa testowa"
        submission.final_url = "https://example.com/recipes/soup"
        session.commit()

    admin_client = TestClient(app)
    login_user(admin_client, session_factory, "admin", is_admin=True)
    approved = admin_client.post(
        f"/api/v1/admin/recipe-submissions/{created['id']}/approve",
        json={"title": "Zupa testowa", "author_name": "Autor"},
    ).json()
    recipe_id = approved["published_recipe_id"]

    client.delete("/api/v1/auth/account")

    with session_factory() as session:
        submission = session.get(RecipeSubmission, created["id"])
        assert submission is not None
        assert submission.status == "approved"
        assert submission.submitted_by_user_id is None
        assert session.get(Recipe, recipe_id) is not None

    app.dependency_overrides.clear()


def test_recipe_metadata_prefers_recipe_json_ld_and_flags_non_recipe_content() -> None:
    html = """
    <html><head>
      <title>Strona tytułowa</title>
      <meta property="og:title" content="Meta tytuł">
      <meta property="og:image" content="https://example.com/images/meta.jpg">
      <link rel="canonical" href="https://example.com/recipes/pasta">
      <script type="application/ld+json">
        {
          "@type":"Recipe",
          "name":"Makaron testowy",
          "author":{"@type":"Person","name":"Jan Kucharz"},
          "image":["https://example.com/images/recipe.jpg"],
          "recipeIngredient":["100 g mąki"],
          "recipeInstructions":["Wymieszaj składniki."]
        }
      </script>
    </head><body>Przepis na makaron.</body></html>
    """

    result = extract_recipe_metadata(html, "https://example.com/old")

    assert result.title == "Makaron testowy"
    assert result.author == "Jan Kucharz"
    assert result.image_url == "https://example.com/images/recipe.jpg"
    assert result.canonical_url == "https://example.com/recipes/pasta"
    assert result.recipe_confidence == 1.0
    assert result.content_flags == []
    assert result.provenance["title"] == "jsonld:Recipe.name"

    non_recipe = extract_recipe_metadata(
        "<html><head><title>Adult video</title></head><body>xxx adult content</body></html>",
        "https://example.com/adult",
    )
    assert non_recipe.recipe_confidence == 0.0
    assert "missing_recipe_signals" in non_recipe.content_flags
    assert "adult_keywords" in non_recipe.content_flags


def test_process_submission_records_extraction_attempt() -> None:
    html = """
    <script type="application/ld+json">{"@type":"Recipe","name":"Chleb","author":"Ola","image":"https://example.com/chleb.jpg","recipeIngredient":["mąka"],"recipeInstructions":["Upiecz."]}</script>
    """

    class FakeFetcher:
        def fetch(self, url: str) -> FetchedPage:
            return FetchedPage(
                final_url=url,
                status_code=200,
                content_type="text/html",
                body=html.encode("utf-8"),
            )

    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, expire_on_commit=False)
    with factory() as session:
        user = User(google_subject="worker-user", created_at=datetime.now(timezone.utc))
        session.add(user)
        session.flush()
        submission = RecipeSubmission(
            submitted_by_user_id=user.id,
            submitted_url="https://example.com/chleb",
            normalized_url="https://example.com/chleb",
            status="submitted",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        session.add(submission)
        session.flush()

        process_submission(session, submission, FakeFetcher())
        session.commit()

        refreshed = session.get(RecipeSubmission, submission.id)
        assert refreshed is not None
        assert refreshed.status == "awaiting_review"
        assert refreshed.extracted_title == "Chleb"
        assert refreshed.extracted_author == "Ola"
        assert refreshed.recipe_confidence == 1.0
        assert len(refreshed.attempts) == 1
