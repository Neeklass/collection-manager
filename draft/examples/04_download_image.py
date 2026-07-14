"""
Example 4 — Download a card's artwork.

Every card has a .get_image_url(quality, extension) helper that returns
a full URL, and .get_image(...) which downloads the bytes directly.

Quality values: "low" | "high"           (or Quality.LOW / Quality.HIGH)
Extension values: "png" | "jpg" | "webp" (or Extension.PNG / .JPG / .WEBP)
"""

from pathlib import Path

from tcgdexsdk import TCGdex
from tcgdexsdk.enums import Extension, Quality


def main() -> None:
    sdk = TCGdex("en")

    card = sdk.card.getSync("swsh3-136")

    url = card.get_image_url(Quality.HIGH, Extension.PNG)
    print(f"Image URL: {url}")

    out_dir = Path(__file__).resolve().parent.parent / "downloads"
    out_dir.mkdir(exist_ok=True)
    out_file = out_dir / f"{card.id}.png"

    image_bytes = card.get_image(Quality.HIGH, Extension.PNG).read()
    out_file.write_bytes(image_bytes)

    print(f"Saved {len(image_bytes):,} bytes -> {out_file}")


if __name__ == "__main__":
    main()
