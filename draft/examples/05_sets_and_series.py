"""
Example 5 — Browse sets and series.

- A *series* is a large era (e.g. "Sword & Shield").
- A *set* belongs to a series (e.g. "Darkness Ablaze" is set "swsh3").
- Each set has a list of cards.
"""

import sys

from tcgdexsdk import TCGdex

sys.stdout.reconfigure(encoding="utf-8")


def main() -> None:
    sdk = TCGdex("en")

    # Get a specific set and list the first 10 cards in it
    set_data = sdk.set.getSync("swsh3")
    print(f"Set: {set_data.name}   ({set_data.cardCount.total} cards)")
    print(f"Released: {set_data.releaseDate}")
    print(f"Series:   {set_data.serie.name}\n")

    print("First 10 cards in the set:")
    for c in set_data.cards[:10]:
        print(f"  {c.id:<15} #{c.localId:<4} {c.name}")

    # List every set that exists
    print("\nTotal number of sets in the DB:")
    all_sets = sdk.set.listSync()
    print(f"  {len(all_sets)} sets")

    # List every series
    print("\nAll series:")
    for s in sdk.serie.listSync():
        print(f"  {s.id:<10} {s.name}")


if __name__ == "__main__":
    main()
