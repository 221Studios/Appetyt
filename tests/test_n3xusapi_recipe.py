import json
import unittest
from unittest.mock import patch
from urllib.error import URLError

from scripts.n3xusapi_recipe import fetch_markdown, parse_via_n3xusapi


class FakeResponse:
    def __init__(self, payload: dict):
        self._raw = json.dumps(payload).encode("utf-8")

    def read(self):
        return self._raw

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False


class N3xusapiRecipeTests(unittest.TestCase):
    def test_parse_markdown_payload(self):
        payload = {
            "output": [
                {
                    "markdown": "# Zupa\n\n## Składniki\n- 400 g pomidorów\n- 1 cebula\n"
                }
            ]
        }
        with patch("scripts.n3xusapi_recipe.urllib.request.urlopen", return_value=FakeResponse(payload)):
            recipe = parse_via_n3xusapi("https://example.com/zupa")
        self.assertEqual(recipe["title"], "Zupa")
        self.assertGreaterEqual(len(recipe["ingredients"]), 2)

    def test_down_api_returns_none(self):
        with patch("scripts.n3xusapi_recipe.urllib.request.urlopen", side_effect=URLError("down")):
            self.assertIsNone(fetch_markdown("https://example.com/x"))


if __name__ == "__main__":
    unittest.main()
