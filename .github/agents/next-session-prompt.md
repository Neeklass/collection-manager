# Next-session prompt

Continue implementation in `/workspaces/collection-manager`, following
`docs/requirements.md` as the source of truth and
`docs/implementation-backlog.md` as the task order. Implement exactly one
backlog item per pull request.

## Repository state at handoff

The last commit is:

```text
2722a517e81bc0d4a4b591481a8dc29f64bc6fbe Add docs
```

The `HEAD` commit contains 28 changed paths, 1,217 insertions, and 52
deletions:

- `.claude/CLAUDE.md`, `.claude/agents`, `.claude/commands`, and `.claude/rules`
  were deleted.
- `.github/agents/test.agent.md` and `.github/prompts/example.prompt.md` were
  deleted.
- `.github/instructions/backend/python.instructions.md`,
  `.github/instructions/data/api-sdk.instructions.md`, and
  `.github/instructions/frontend/typescript.instructions.md` were deleted.
- `.devcontainer/devcontainer.json` added Node LTS and GitHub CLI features,
  installed the Copilot extension after creation, added Copilot Chat and C++
  tooling, and removed the obsolete Copilot editor setting (lines 1-22).
- `.github/copilot-instructions.md` was replaced with project guidance covering
  the local-first Pokemon collection goal, TCGdex, Excel test data, collection
  scope, UX priorities, and Azure deferral (lines 1-89).
- `.github/instructions/api.instructions.md` was added with storage-agnostic
  data, validation, migration, idempotency, and TCGdex API/SDK references
  (lines 1-45).
- `.github/instructions/general-coding-standards.instructions.md`,
  `python.instructions.md`, `security.instructions.md`, and
  `typescript.instructions.md` were added with repository-wide coding,
  security, Python, and Next.js standards (85, 31, 46, and 32 lines).
- `.gitignore` added the devcontainer lock file and `data/` exclusion (lines
  1-2 in the committed version).
- `README.md` remained `# WIP` in that commit (line 1).
- `docs/api/` added 11 TCGdex API/SDK reference documents, totaling 877 lines:
  filtering/pagination (190), card lookup (89), set lookup (61), single-card
  lookup (89), series lookup (54), getting started (39), other endpoints (62),
  Python SDK (173), card search (36), series search (33), and set search (51).

## Uncommitted implementation since that commit

The working tree contains the following uncommitted foundation work:

- `package.json` (lines 1-31) and `package-lock.json` establish the private
  Next.js 16.2.10, React 19.2.4, strict TypeScript, ESLint, Prettier, and
  Vitest project. Scripts include localhost `dev`/`start`, `format`,
  `format:check`, `lint`, `typecheck`, `test`, and aggregate `check`.
- `tsconfig.json` (lines 1-34) enables strict TypeScript, App Router plugins,
  and the `@/*` alias to `src`.
- `next.config.ts`, `next-env.d.ts`, `eslint.config.mjs`, `.prettierrc.json`,
  and `vitest.config.ts` provide framework, lint, formatting, and test-runner
  configuration. ESLint restricts domain/application/infrastructure imports
  that would violate the architecture.
- `.github/workflows/quality.yml` (lines 1-31) runs `npm ci` and `npm run check`
  on pull requests and pushes to `main` with read-only repository permissions.
- `src/app/layout.tsx` (lines 1-30) defines Collection Manager metadata and
  layout; `src/app/page.tsx` (lines 1-18) provides the initial local-first
  landing page; generated CSS/assets/favicon remain under `src/app/` and
  `public/`.
- `src/app/api/health/route.ts` (lines 1-5) is a thin Next.js route delegating
  to the web boundary.
- `src/web/health/get-health-response.ts` (lines 1-8) composes the health
  application use case with the system clock and returns JSON.
- `src/application/ports/application-clock.ts` (lines 1-3) defines the
  application-owned clock port.
- `src/application/health/get-application-health.ts` (lines 1-14) implements
  the minimal injected-port use case.
- `src/domain/health/application-health.ts` (lines 1-4) defines the
  framework-independent health result.
- `src/infrastructure/time/system-clock.ts` (lines 1-6) implements the
  application clock port.
- `tests/smoke.test.ts` (lines 1-8) verifies the TypeScript test runner;
  `tests/architecture.test.ts` (lines 1-16) verifies injected application
  dependencies.
- `docs/requirements.md` is the approved product, workflow, requirements,
  architecture, data-model, synchronization, schema-critique, and roadmap
  document.
- `docs/implementation-backlog.md` is the prioritized one-PR checklist. F01,
  F02, and F03 are marked complete; F04 is the next task.
- `docs/architecture.md` (lines 1-45) documents the modular-monolith layers and
  import direction.
- `README.md` (lines 1-14) documents local startup at `127.0.0.1:3000`.
- `.gitignore` (lines 1-9) excludes Node, Next.js, environment, build, and
  coverage artifacts.
- `.github/agents/next-session-prompt.md` is this handoff file.

F01, F02, and F03 are complete. The local app has passed formatting, linting,
strict type checking, Vitest, production build, and the health endpoint smoke
check during the implementation sessions.

## Open work

Start with **F04 — Add validated local configuration**. It must centralize and
validate environment configuration for the local data directory, database path,
application URL, and log level; fail fast without leaking secrets; keep safe
localhost defaults; and include a safe example environment file and tests.

After F04, continue the foundation sequence with F05 SQLite/migrations, F06
domain value objects, F07 catalog persistence, F08 collection persistence, F09
default collection seeding, F10 repositories, and F11 backups. Do not implement
TCGdex synchronization, workbook import, quick entry, search, or valuation
before their backlog dependencies are complete.

No database, catalog model, TCGdex client, Excel importer, collection-entry
workflow, search UI, or valuation feature has been implemented yet.
