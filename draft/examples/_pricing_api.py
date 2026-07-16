"""
Small helper to fetch a card's *raw* JSON from the TCGdex REST API.

Why: the Python SDK (v2.3.0) doesn't yet map the `pricing` field onto
its Card model, but the REST API returns it. So for prices we hit REST
directly and read the JSON dict.

Endpoint:  https://api.tcgdex.net/v2/<lang>/cards/<card-id>
"""

from __future__ import annotations

import json
from typing import Any
from urllib.error import HTTPError
from urllib.request import Request, urlopen

BASE_URL = "https://api.tcgdex.net/v2"


def fetch_card_raw(card_id: str, language: str = "en") -> dict[str, Any] | None:
    """Return the raw card JSON as a dict, or None if the card doesn't exist."""
    url = f"{BASE_URL}/{language}/cards/{card_id}"
    req = Request(url, headers={"User-Agent": "card-explorer/1.0"})
    try:
        with urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except HTTPError as e:
        if e.code == 404:
            return None
        raise


def fetch_pricing(card_id: str, language: str = "en") -> dict[str, Any]:
    """Return the `pricing` sub-dict, or {} if card missing / has no listings."""
    data = fetch_card_raw(card_id, language)
    if not data:
        return {}
    return data.get("pricing") or {}
