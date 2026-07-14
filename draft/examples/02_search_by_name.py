"""
Example 2 — Search for cards by name.

`sdk.card.list(query)` returns a list of *CardResume* objects (lightweight:
just id + name + image). To get full details, call `sdk.card.getSync(id)`
on any result.

The Query builder is fluent — chain filters like:
    Query().equal("name", "Pikachu")
    Query().contains("name", "chu")     # substring, case-insensitive
"""

import sys

from tcgdexsdk import TCGdex, Query

sys.stdout.reconfigure(encoding="utf-8")


def main() -> None:
    sdk = TCGdex("en")

    # Exact match on name
    print("=== All cards named exactly 'Furret' ===")
    furrets = sdk.card.listSync(Query().equal("name", "Furret"))
    for c in furrets[:10]:
        print(f"  {c.id:<15} {c.name}")
    print(f"  ...({len(furrets)} total)\n")

    # Substring / case-insensitive match
    print("=== Cards whose name contains 'chu' (first 10) ===")
    chus = sdk.card.listSync(Query().contains("name", "chu"))
    for c in chus[:10]:
        print(f"  {c.id:<15} {c.name}")
    print(f"  ...({len(chus)} total)")


if __name__ == "__main__":
    main()
