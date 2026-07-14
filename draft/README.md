# Pokémon Card Explorer (tcgdex-sdk)

A beginner-friendly playground for querying Pokémon Trading Card Game data
using the [tcgdex-sdk](https://pypi.org/project/tcgdex-sdk/).

## Setup

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Run

Each file in `examples/` is standalone. Run any of them with:

```powershell
python examples\01_get_single_card.py
python examples\02_search_by_name.py
python examples\03_advanced_queries.py
python examples\04_download_image.py
python examples\05_sets_and_series.py
python examples\06_change_language.py
python examples\07_pricing.py
python examples\08_price_watchlist.py
```

Or run the main entry point:

```powershell
python main.py
```

## What is TCGdex?

TCGdex is a free, open, community-driven Pokémon TCG database. The Python
SDK wraps its HTTP API so you can:

- Fetch a card by its ID (e.g. `swsh3-136`)
- Search / filter across all cards with a fluent `Query()` builder
- Download card artwork
- Browse sets (e.g. "Darkness Ablaze") and series (e.g. "Sword & Shield")
- Get data in multiple languages

## Sync vs async

Every endpoint has two versions:

| Async (in an `async def`) | Sync (anywhere) |
| ------------------------- | --------------- |
| `await sdk.card.get(id)`  | `sdk.card.getSync(id)` |
| `await sdk.card.list(q)`  | `sdk.card.listSync(q)` |

For simplicity the examples in this repo use the **sync** API — no
`asyncio` boilerplate needed. Switch to `await ... .get(...)` inside an
`async def main(): ...` when you're ready.

## Finding card IDs

A card ID looks like `<set-id>-<local-id>`, e.g. `swsh3-136` = Set
"swsh3" (Darkness Ablaze), card #136. You can discover IDs by:

1. Listing a set's cards (see `05_sets_and_series.py`).
2. Searching by name (see `02_search_by_name.py`).
3. Browsing https://tcgdex.dev/

## Market pricing

TCGdex exposes market prices (Cardmarket EUR + TCGplayer USD) under a
`pricing` field in the card response. The Python SDK (v2.3.0) doesn't
map this field onto its Card model yet, so `examples/07_pricing.py` and
`examples/08_price_watchlist.py` use a tiny helper (`_pricing_api.py`)
that fetches the raw JSON via `urllib` from:

```
https://api.tcgdex.net/v2/<lang>/cards/<card-id>
```

Available fields:

- `pricing.cardmarket` — EUR, updated daily
  - `avg`, `low`, `trend`, `avg1`, `avg7`, `avg30`
  - `avg-holo`, `low-holo`, `trend-holo`, `avg1-holo`, `avg7-holo`, `avg30-holo`
- `pricing.tcgplayer` — USD, updated hourly
  - `normal`, `reverse`, `holo` — each has `lowPrice`, `midPrice`,
    `highPrice`, `marketPrice`, `directLowPrice`

Any provider or variant is simply omitted if the card isn't listed there,
so always use `.get(...)` and check for `None`.
