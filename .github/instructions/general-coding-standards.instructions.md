---
name: 'General Coding Standards'
description: 'General coding conventions applicable across all languages and frameworks'
applyTo: '**/*'
---
# General coding standards

## Code quality

- Write clean, readable and maintainable code.
- Prefer clarity over cleverness.
- Follow the DRY (Don't Repeat Yourself) principle.
- Follow the KISS (Keep It Simple, Stupid) principle.
- Apply the SOLID principles where appropriate.
- Keep functions and methods focused on a single responsibility.
- Avoid deeply nested control flow; return early when possible.
- Prefer composition over inheritance.
- Remove dead code instead of commenting it out.
- Keep files reasonably small and organized.

## Naming

- Use descriptive and meaningful names.
- Avoid abbreviations unless they are widely understood.
- Use consistent naming conventions throughout the project.
- Name functions after what they do.
- Name variables after what they represent.
- Name boolean variables so they read naturally (e.g. `isEnabled`, `hasAccess`, `canEdit`).

## Architecture

- Separate business logic from infrastructure concerns.
- Keep UI, business logic and data access independent.
- Minimize coupling between modules.
- Maximize cohesion within modules.
- Depend on abstractions instead of implementations.

## Error handling

- Handle errors explicitly.
- Fail fast when invalid input is detected.
- Return meaningful error messages without leaking internal details.
- Never silently ignore exceptions.
- Validate all external input.

## Documentation

- Write self-documenting code whenever possible.
- Add comments only when they explain *why*, not *what*.
- Keep documentation synchronized with the implementation.
- Document assumptions and non-obvious decisions.

## Performance

- Optimize for readability before performance.
- Measure performance before optimizing.
- Avoid unnecessary allocations and duplicate work.
- Cache expensive operations only when justified.

## Testing

- Design code to be testable.
- Keep business logic independent from external systems.
- Write deterministic code whenever possible.
- Avoid hidden side effects.

## Dependencies

- Prefer well-maintained and widely adopted libraries.
- Minimize external dependencies.
- Remove unused dependencies promptly.
- Keep dependencies updated.

## Security

- Never hardcode secrets or credentials.
- Validate all external input.
- Follow the project's security guidelines.

## AI-assisted development

- Treat AI-generated code as a starting point, not as the final implementation.
- Review all generated code before committing.
- Verify correctness, security and maintainability.
- Ensure generated code follows the project's architecture and coding standards.
