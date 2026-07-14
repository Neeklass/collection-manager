"""
Example 7 — Market pricing (Cardmarket + TCGplayer).

The pricing data is included on the raw REST card response but is NOT
mapped by the Python SDK yet (v2.3.0). So we fetch the raw JSON via a
tiny helper in ``_pricing_api.py``.

Structure:
  pricing:
    cardmarket:      # EUR, updated daily
      updated, unit, avg, low, trend, avg1, avg7, avg30
      avg-holo, low-holo, trend-holo, avg1-holo, avg7-holo, avg30-holo
    tcgplayer:       # USD, updated hourly
      updated, unit
      normal   : lowPrice, midPrice, highPrice, marketPrice, directLowPrice
      reverse  : (same fields)
      holo     : (same fields)

Any provider or variant may be absent if the card isn't listed.
"""

import sys

from _pricing_api import fetch_pricing

sys.stdout.reconfigure(encoding="utf-8")


def _fmt(value, unit: str) -> str:
    return "—" if value is None else f"{value:>7.2f} {unit}"


def print_cardmarket(cm: dict) -> None:
    unit = cm.get("unit", "EUR")
    print(f"  Updated: {cm.get('updated')}")
    print(f"  Standard        avg={_fmt(cm.get('avg'), unit)}  "
          f"low={_fmt(cm.get('low'), unit)}  trend={_fmt(cm.get('trend'), unit)}")
    print(f"                  1d ={_fmt(cm.get('avg1'), unit)}  "
          f"7d ={_fmt(cm.get('avg7'), unit)}  30d  ={_fmt(cm.get('avg30'), unit)}")
    if any(k in cm for k in ("avg-holo", "low-holo", "trend-holo")):
        print(f"  Holo            avg={_fmt(cm.get('avg-holo'), unit)}  "
              f"low={_fmt(cm.get('low-holo'), unit)}  trend={_fmt(cm.get('trend-holo'), unit)}")
        print(f"                  1d ={_fmt(cm.get('avg1-holo'), unit)}  "
              f"7d ={_fmt(cm.get('avg7-holo'), unit)}  30d  ={_fmt(cm.get('avg30-holo'), unit)}")


def print_tcgplayer(tp: dict) -> None:
    unit = tp.get("unit", "USD")
    print(f"  Updated: {tp.get('updated')}")
    for variant in ("normal", "reverse", "holo"):
        v = tp.get(variant)
        if not v:
            continue
        print(f"  {variant.capitalize():<8}       "
              f"low ={_fmt(v.get('lowPrice'), unit)}  "
              f"mid ={_fmt(v.get('midPrice'), unit)}  "
              f"high={_fmt(v.get('highPrice'), unit)}")
        print(f"                  market={_fmt(v.get('marketPrice'), unit)}  "
              f"directLow={_fmt(v.get('directLowPrice'), unit)}")


def show_prices(card_id: str) -> None:
    print(f"\n=== Pricing for {card_id} ===")
    pricing = fetch_pricing(card_id)
    if not pricing:
        print("  (no marketplace listings)")
        return

    if "cardmarket" in pricing:
        print("\nCardmarket (EUR):")
        print_cardmarket(pricing["cardmarket"])
    else:
        print("\nCardmarket: not listed")

    if "tcgplayer" in pricing:
        print("\nTCGplayer (USD):")
        print_tcgplayer(pricing["tcgplayer"])
    else:
        print("\nTCGplayer: not listed")


def main() -> None:
    # A few interesting cards to look up
    for card_id in ("swsh3-136", "swsh3-20", "base1-4", "swsh12-160"):
        show_prices(card_id)


if __name__ == "__main__":
    main()
