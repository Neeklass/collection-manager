"""
Example 8 — Price watchlist.

Combines the SDK's search with the raw-JSON pricing helper: given a
Pokémon name, find every card printing and print the Cardmarket trend
price, sorted from most expensive to cheapest.
"""

import sys

from tcgdexsdk import Query, TCGdex

from _pricing_api import fetch_pricing

sys.stdout.reconfigure(encoding="utf-8")


def price_report(name: str, top: int = 15) -> None:
    sdk = TCGdex("en")

    results = sdk.card.listSync(Query().equal("name", name))
    print(f"Found {len(results)} printings of '{name}'. Fetching prices...\n")

    rows = []
    for c in results:
        pricing = fetch_pricing(c.id)
        cm = pricing.get("cardmarket") or {}
        # prefer holo trend if present, else standard trend
        price = cm.get("trend-holo") or cm.get("trend")
        rows.append((price, c.id, c.name))

    # sort None to the bottom, then by price descending
    rows.sort(key=lambda r: (r[0] is None, -(r[0] or 0)))

    print(f"{'Card ID':<15} {'Trend (EUR)':>12}   Name")
    print("-" * 55)
    for price, cid, cname in rows[:top]:
        p = "—" if price is None else f"{price:>10.2f}"
        print(f"{cid:<15} {p:>12}   {cname}")


def main() -> None:
    price_report("Charizard")


if __name__ == "__main__":
    main()
