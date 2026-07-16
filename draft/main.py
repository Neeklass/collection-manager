"""
Entry point — a quick smoke test that the SDK works.

Run:  python main.py
"""

import sys

from tcgdexsdk import TCGdex

sys.stdout.reconfigure(encoding="utf-8")


def main() -> None:
    sdk = TCGdex("en")

    # Fetch one specific card by its ID (set-id + '-' + card number in set)
    card = sdk.card.getSync("swsh3-136")

    print(f"Found: {card.name}")
    print(f"  ID:          {card.id}")
    print(f"  Set:         {card.set.name} ({card.localId}/{card.set.cardCount.total})")
    print(f"  Illustrator: {card.illustrator}")
    print(f"  Rarity:      {card.rarity}")
    if card.hp is not None:
        print(f"  HP:          {card.hp}")

    print("\nExplore more with the scripts in the examples/ folder.")


if __name__ == "__main__":
    main()
