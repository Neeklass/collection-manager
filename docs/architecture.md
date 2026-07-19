# Application architecture

Collection Manager is a local-first modular monolith. The application is
organized into four layers:

```text
src/
  app/             Next.js App Router entrypoints
  web/             web handlers and composition roots
  application/    use cases and ports
  domain/          framework-independent domain types and rules
  infrastructure/ adapters for databases, files, APIs, and system services
```

## Import direction

- `domain` imports only standard-library or domain-local code.
- `application` may import `domain` and define ports for external services.
- `infrastructure` may import `application` ports and external libraries to
  implement those ports.
- `app` contains Next.js entrypoints that delegate to the `web` boundary.
- `web` handlers call application use cases and may wire concrete
  infrastructure adapters at the composition root.
- Domain and application code must not import Next.js, SQLite, Excel parsers,
  TCGdex clients, or other infrastructure implementations.
- Infrastructure must not import web components or route handlers.

Business rules belong in `domain` or `application`, not in route handlers or
infrastructure adapters. A dependency should be passed through an
application-owned port rather than imported directly into a use case.

## Example composition

`src/app/api/health/route.ts` and
`src/web/health/get-health-response.ts` are the smallest composition example:

1. The web route creates an application use case.
2. The use case receives the `ApplicationClock` port.
3. Infrastructure provides the `systemClock` implementation.
4. The response contains the domain-owned `ApplicationHealth` type.

The health endpoint is intentionally not a product feature. It exists to keep
the dependency direction visible and testable before database and collection
behavior are introduced.
