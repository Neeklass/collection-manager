"""
Example 3 — Advanced queries.

The Query builder supports:
  .equal(field, value)         exact match
  .contains(field, value)      substring, case-insensitive
  .greaterThan(field, value)   numeric >
  .lessThan(field, value)      numeric <
  .isNull(field)               field is missing / null
  .notNull(field)              field is present
  .sort(field, "asc"|"desc")   ordering
  .paginate(page, itemsPerPage)
"""

import sys

from tcgdexsdk import TCGdex, Query

sys.stdout.reconfigure(encoding="utf-8")


def main() -> None:
    sdk = TCGdex("en")

    # High-HP Pokémon, sorted by HP descending
    print("=== Top 10 tanks (HP > 200) ===")
    tanks = sdk.card.listSync(
        Query().greaterThan("hp", 200).sort("hp", "desc").paginate(page=1, itemsPerPage=10)
    )
    for c in tanks:
        print(f"  {c.id:<15} {c.name}")

    # Cards illustrated by someone whose name contains "ban"
    print("\n=== Cards illustrated by someone with 'ban' in their name (first 10) ===")
    ban_cards = sdk.card.listSync(
        Query().contains("illustrator", "ban").paginate(page=1, itemsPerPage=10)
    )
    for c in ban_cards:
        print(f"  {c.id:<15} {c.name}")

    # Cards with abilities but no attacks
    print("\n=== Cards with abilities but no attacks (first 10) ===")
    ability_only = sdk.card.listSync(
        Query()
        .isNull("attacks")
        .notNull("abilities")
        .paginate(page=1, itemsPerPage=10)
    )
    for c in ability_only:
        print(f"  {c.id:<15} {c.name}")


if __name__ == "__main__":
    main()
