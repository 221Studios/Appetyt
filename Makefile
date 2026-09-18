.PHONY: api-install api-test api-lint scripts-test

api-install:
	python3 -m pip install -r backend/requirements.txt

api-test:
	pytest

api-lint:
	ruff check backend/app backend/tests

scripts-test:
	python3 -m unittest discover -s tests -q
