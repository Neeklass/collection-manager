# GitHub Copilot Instructions

## Project Goal

Build a web application for managing and valuing a large Pokémon card collection.

The primary user currently manages over **16,000 cards** in Excel. The application should make adding, searching and managing cards significantly faster and more convenient than a spreadsheet.

The application should also estimate the current value of the collection using data from TCGdex.

## Priorities

1. Excellent user experience for adding cards quickly.
2. Fast search and filtering.
3. Accurate collection statistics and valuation.
4. Maintainable architecture.
5. Local-first development.

## External Resources

### TCGdex

- Website: https://tcgdex.dev/
- GitHub: https://github.com/tcgdex/cards-database

Use TCGdex as the primary source for Pokémon card metadata.

## Database

An old database schema exists as a starting point:

`/draft/old/db/db_creation.sql`

Treat this schema as inspiration only. It may be redesigned if a better data model is appropriate.

## Infrastructure

Initially, everything should run locally.

Cloud infrastructure is **not** a priority during early development.

After the application is working locally, infrastructure should be provisioned with Terraform and deployed to Azure.

## User Experience

The application's biggest competitor is the current Excel spreadsheet.

When proposing features or implementations, prioritize workflows that allow users to add cards with the fewest possible clicks and the least amount of typing.

A good solution is one that enables users to catalog large numbers of cards quickly and efficiently, even if it means postponing less important features.

Design the application with future support for barcode scanning, camera scanning and other fast input methods in mind.

## General Guidelines

- Prefer simple, maintainable solutions.
- Keep business logic independent from infrastructure.
- Design components to be testable.
- Avoid unnecessary complexity.
- Suggest improvements if they significantly improve maintainability or user experience.
- Challenge design decisions if there is a significantly better alternative, and explain the trade-offs.

## Test Data

A real-world Excel export is available for development and testing:

`/data/2026-07-10_Pokemon.xlsx`

This file represents the current workflow and should be used to:

- Understand how the collection is currently managed.
- Design a faster and more intuitive data entry workflow.
- Validate import functionality.
- Test search, filtering and collection statistics.
- Ensure the application performs well with a large collection (~16,000 cards).

The Excel file is intended for development and testing only. Do not treat its structure as the application's target data model.

## Collection Scope

The application should support more than individual Pokémon cards.

It should also support sealed products such as booster packs, booster boxes, Elite Trainer Boxes (ETBs), collection boxes, tins, promotional products and other collectibles.

Not every item will be available through TCGdex or another pricing API.

Design the data model so that collection items can exist without external metadata or market prices. Users should be able to create and manage custom items manually, including optional purchase price, estimated value and notes.

The data model should be flexible enough to support additional collectible types in the future without major schema changes.
