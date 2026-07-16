"""
Example 6 — Multi-language support.

TCGdex has card data localized in many languages. Pass a language code
(string) or a Language enum value when constructing the SDK, or call
setLanguage(...) on an existing instance.
"""

import sys

from tcgdexsdk import TCGdex, Language

sys.stdout.reconfigure(encoding="utf-8")


def show(sdk: TCGdex, card_id: str) -> None:
    try:
        card = sdk.card.getSync(card_id)
        print(f"  [{sdk.language}] {card.name}")
    except Exception as e:
        print(f"  [{sdk.language}] (not available: {type(e).__name__})")


def main() -> None:
    card_id = "swsh3-136"

    print(f"Card {card_id} in several languages:")
    show(TCGdex("en"), card_id)
    show(TCGdex(Language.FR), card_id)
    show(TCGdex("de"), card_id)
    show(TCGdex("es"), card_id)
    show(TCGdex("it"), card_id)

    # Change language on an existing SDK instance
    sdk = TCGdex()
    sdk.setLanguage(Language.JA)
    show(sdk, card_id)


if __name__ == "__main__":
    main()
