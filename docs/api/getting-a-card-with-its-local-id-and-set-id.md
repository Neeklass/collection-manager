
Getting a Card with it's local ID and set ID
Request

    PHP
    Javascript
    Typescript
    Java
    Kotlin
    cURL

https://api.tcgdex.net/v2/en/sets/swsh3/136

See how to prepare your URLs
Response
200 Response

The request return a Card object

{
  "category": "Pokemon",
  "id": "swsh3-136",
  "illustrator": "tetsuya koizumi",
  "image": "https://assets.tcgdex.net/en/swsh/swsh3/136",
  "localId": "136",
  "name": "Furret",
  "rarity": "Uncommon",
  "set": {
    "cardCount": {
      "official": 189,
      "total": 201
    },
    "id": "swsh3",
    "logo": "https://assets.tcgdex.net/en/swsh/swsh3/logo",
    "name": "Darkness Ablaze",
    "symbol": "https://assets.tcgdex.net/univ/swsh/swsh3/symbol"
  },
  "variants": {
    "firstEdition": false,
    "holo": false,
    "normal": true,
    "reverse": true,
    "wPromo": false
  },
  "hp": 110,
  "types": [
    "Colorless"
  ],
  "evolveFrom": "Sentret",
  "description": "It makes a nest to suit its long and skinny body. The nest is impossible for other Pokémon to enter.",
  "stage": "Stage1",
  "attacks": [
    {
    "cost": [
      "Colorless"
    ],
    "name": "Feelin' Fine",
    "effect": "Draw 3 cards."
    },
    {
    "cost": [
      "Colorless"
    ],
    "name": "Tail Smash",
    "effect": "Flip a coin. If tails, this attack does nothing.",
    "damage": 90
    }
  ],
  "weaknesses": [
    {
      "type": "Fighting",
      "value": "×2"
    }
  ],
  "retreat": 1,
  "regulationMark": "D",
  "legal": {
    "standard": true,
    "expanded": true
  }
}

404 Response

The card was not found :( it will return a global error message (not translated)

{
  "error": "Endpoint or id not found"
}
