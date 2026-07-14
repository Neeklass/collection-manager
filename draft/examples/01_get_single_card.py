"""
Example 1 — Fetch a single card by ID.

A card ID looks like "<set-id>-<local-id>", e.g. "swsh3-136" is
card #136 of the Sword & Shield: Darkness Ablaze set.

The SDK exposes both async and sync methods. This example uses the sync
version (getSync) so you don't need any asyncio boilerplate.
"""

import sys

from tcgdexsdk import TCGdex

sys.stdout.reconfigure(encoding="utf-8")


def main() -> None:
    sdk = TCGdex("en")

    card = sdk.card.getSync("lc-68")

    print(f"Name:        {card.name}")
    print(f"ID:          {card.id}")
    print(f"Category:    {card.category}")           # Pokemon / Trainer / Energy
    print(f"HP:          {card.hp}")
    print(f"Types:       {card.types}")
    print(f"Illustrator: {card.illustrator}")
    print(f"Rarity:      {card.rarity}")
    print(f"Set:         {card.set.name} ({card.set.id})")

    if card.attacks:
        print("\nAttacks:")
        for atk in card.attacks:
            cost = "/".join(atk.cost) if atk.cost else "-"
            print(f"  - {atk.name}  cost={cost}  dmg={atk.damage}")
            if atk.effect:
                print(f"      {atk.effect}")


if __name__ == "__main__":
    main()
