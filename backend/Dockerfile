FROM python:3.12-slim

WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends imagemagick \
    && rm -rf /var/lib/apt/lists/*
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt
COPY backend /app/backend
COPY data /app/data
COPY docs /app/docs
ENV PYTHONPATH=/app/backend
CMD ["sh", "-c", "alembic -c /app/backend/alembic.ini upgrade head && python -m app.seed && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
