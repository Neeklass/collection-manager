
Getting a single Serie
Request

    PHP
    Javascript
    Typescript
    Java
    Kotlin
    cURL

https://api.tcgdex.net/v2/en/series/swsh

See how to prepare your URLs
Sample Response
200 Response

The request returns a Serie object

{
  "id": "swsh",
  "logo": "https://assets.tcgdex.net/en/swsh/swshp/logo",
  "name": "Sword & Shield",
  "sets": [
    {
      "cardCount": {
        "official": 107,
        "total": 166
      },
      "id": "swshp",
      "logo": "https://assets.tcgdex.net/en/swsh/swshp/logo",
      "name": "SWSH Black Star Promos",
      "symbol": "https://assets.tcgdex.net/univ/swsh/swshp/symbol"
    },
    // ...
    {
      "cardCount": {
        "official": 159,
        "total": 230
      },
      "id": "swsh12.5",
      "logo": "https://assets.tcgdex.net/en/swsh/swsh12.5/logo",
      "name": "Crown Zenith"
    }
  ]
}

404 Response

The serie was not found :( it will return a global error message (not translated)

{
  "error": "Endpoint or id not found"
}
