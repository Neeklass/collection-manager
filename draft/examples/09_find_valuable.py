"""
Example 9 — Find valuable cards (CLI).

Query the SDK for a shortlist of cards, then fetch Cardmarket prices for
each and show the most valuable ones. Because pricing is per-card (no
server-side price filter), always narrow the shortlist first with a name
or set — otherwise you'd hammer the API with tens of thousands of calls.

Usage (from the repo root):
    python examples\09_find_valuable.py --name Charizard
    python examples\09_find_valuable.py --name Pikachu --min 50
    python examples\09_find_valuable.py --set base1
    python examples\09_find_valuable.py --set swsh3 --min 20 --top 25
    python examples\09_find_valuable.py --name Umbreon --metric avg30

Metrics (Cardmarket, EUR):
    trend   current trend price (default)
    avg     all-time average
    low     current lowest listing
    avg7    7-day average
    avg30   30-day average

For each card we take the max of the "standard" and the "-holo" variant
of the chosen metric, so holo-only cards still show up.
"""

import argparse
import sys

from tcgdexsdk import Query, TCGdex

from _pricing_api import fetch_pricing

sys.stdout.reconfigure(encoding="utf-8")


def price_for(pricing: dict, metric: str) -> float | None:
    cm = pricing.get("cardmarket") or {}
    candidates = [cm.get(metric), cm.get(f"{metric}-holo")]
    values = [v for v in candidates if isinstance(v, (int, float))]
    return max(values) if values else None


def find(name: str | None, set_id: str | None, min_price: float,
         top: int, metric: str) -> None:
    sdk = TCGdex("en")

    q = Query()
    label_parts = []
    if name:
        q = q.equal("name", name)
        label_parts.append(f"name='{name}'")
    if set_id:
        q = q.equal("set.id", set_id)
        label_parts.append(f"set='{set_id}'")
    label = ", ".join(label_parts) or "ALL CARDS (careful!)"

    results = sdk.card.listSync(q)
    print(f"Query: {label}  →  {len(results)} card(s). "
          f"Fetching prices (this can take a moment)...\n")

    rows = []
    for c in results:
        price = price_for(fetch_pricing(c.id), metric)
        if price is None or price < min_price:
            continue
        rows.append((price, c.id, c.name))

    rows.sort(key=lambda r: -r[0])

    if not rows:
        print(f"No cards matched with {metric} >= {min_price:.2f} EUR.")
        return

    header_price = f"{metric} EUR"
    print(f"{'Card ID':<15} {header_price:>12}   Name")
    print("-" * 55)
    for price, cid, cname in rows[:top]:
        print(f"{cid:<15} {price:>12.2f}   {cname}")

    print(f"\nShown {min(top, len(rows))} of {len(rows)} matching card(s).")


def main() -> None:
    p = argparse.ArgumentParser(description="Find valuable Pokémon cards.")
    p.add_argument("--name", help="Pokémon name (exact match)")
    p.add_argument("--set", dest="set_id", help="Set id, e.g. base1, swsh3")
    p.add_argument("--min", dest="min_price", type=float, default=0.0,
                   help="Minimum price in EUR (default 0)")
    p.add_argument("--top", type=int, default=20,
                   help="How many rows to display (default 20)")
    p.add_argument("--metric", default="trend",
                   choices=["trend", "avg", "low", "avg7", "avg30"],
                   help="Which Cardmarket price field to rank on")
    args = p.parse_args()

    if not args.name and not args.set_id:
        p.error("Provide --name and/or --set (pricing is per-card, "
                "so we need a shortlist first).")

    find(args.name, args.set_id, args.min_price, args.top, args.metric)


if __name__ == "__main__":
    main()
