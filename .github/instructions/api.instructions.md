---
name: 'Data Standards'
description: 'Coding conventions for data models, persistence, serialization and external integrations'
applyTo: '**/*'
---

# General Coding Standards

This also applies [General Coding Standards](general-coding-standards.instructions.md).

# Data standards

- Design data models to be storage-agnostic.
- Separate domain models from persistence models.
- Never couple business logic directly to the database layer.
- Validate all incoming data before processing.
- Use strong typing whenever possible.
- Prefer immutable data structures where appropriate.
- Use consistent naming for entities, fields and identifiers.
- Store timestamps in UTC.
- Use ISO 8601 for serialized date and time values.
- Prefer UUIDs over incremental IDs for externally exposed identifiers.
- Avoid duplicate data; normalize where appropriate.
- Version data contracts when introducing breaking changes.
- Serialize data explicitly; do not rely on framework defaults.
- Keep data access behind repositories or service abstractions.
- Write migrations instead of modifying schemas manually.
- Make data access operations idempotent whenever possible.

## API Reference

See the [API filtering sorting pagination](../../../collection-manager/docs/api/filtering-sorting-pagination.md).
See the [API getting a card with its local id and set id](../../../collection-manager/docs/api/getting-a-card-with-its-local-id-and-set-id.md).
See the [API getting a set](../../../collection-manager/docs/api/getting-a-set.md).
See the [API getting a single card](../../../collection-manager/docs/api/getting-a-single-card.md).
See the [API Getting a single serie](../../../collection-manager/docs/api/getting-a-single-serie.md).
See the [API Getting Started](../../../collection-manager/docs/api/getting-started-using-the-rest-api.md).
See the [API Other Endpoints](../../../collection-manager/docs/api/other-endpoints.md).
See the [API Searching for Cards](../../../collection-manager/docs/api/searching-for-cards.md).
See the [API Searching Series](../../../collection-manager/docs/api/searching-series.md).
See the [API Searching Sets](../../../collection-manager/docs/api/searching-sets.md).

## SDK Reference

See the [SDK Documentation](../../../collection-manager/docs/api/python-sdk.md).
