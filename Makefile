.PHONY: api-install api-test api-lint mobile-install mobile-test mobile-typecheck mobile-build

api-install:
	python3 -m pip install -r backend/requirements.txt

api-test:
	pytest

api-lint:
	ruff check backend/app backend/tests

mobile-install:
	cd apps/mobile && npm ci

mobile-test:
	cd apps/mobile && npm test

mobile-typecheck:
	cd apps/mobile && npm run typecheck

mobile-build:
	cd apps/mobile && npm run build
