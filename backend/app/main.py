from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import get_settings
from .routers import auth, creators, discover, ingredients, recipes, stores, submissions


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Appetyt API",
        version="1.0.0",
        description="Recipes, nutrition and indicative shopping costs for Appetyt.",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=settings.cors_allow_credentials,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )
    app.include_router(auth.router, prefix="/api/v1")
    app.include_router(recipes.router, prefix="/api/v1")
    app.include_router(discover.router, prefix="/api/v1")
    app.include_router(creators.router, prefix="/api/v1")
    app.include_router(ingredients.router, prefix="/api/v1")
    app.include_router(stores.router, prefix="/api/v1")
    app.include_router(submissions.router, prefix="/api/v1")
    app.include_router(submissions.admin_router, prefix="/api/v1")
    app.mount(
        "/recipe-images",
        StaticFiles(directory=str(settings.recipe_image_dir), check_dir=False),
        name="recipe-images",
    )

    @app.get("/healthz", tags=["system"])
    def healthz() -> dict[str, str]:
        return {"status": "ok", "service": "appetyt-api"}

    return app


app = create_app()
