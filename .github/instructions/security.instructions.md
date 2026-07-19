---
name: 'Security Standards'
description: 'Security guidelines for local development and future Azure deployment'
applyTo: '**/*'
---

# General Coding Standards

This also applies [General Coding Standards](general-coding-standards.instructions.md).

# Security standards

- Security by default.
- Never hardcode secrets, API keys or credentials.
- Read secrets from environment variables.
- Never commit secrets to version control.
- Validate and sanitize all external input.
- Use parameterized queries; never build SQL with string concatenation.
- Escape or sanitize output where required.
- Apply the principle of least privilege.
- Log security-relevant events without exposing sensitive data.
- Do not log passwords, tokens, API keys or personal data.
- Prefer short-lived access tokens.
- Hash passwords using modern password hashing algorithms.
- Verify authorization separately from authentication.
- Fail securely and return generic error messages to clients.
- Keep dependencies up to date.

# Local development

- The application should run completely locally.
- Use local services whenever possible.
- Avoid cloud-specific implementations unless required.
- Keep infrastructure abstractions independent from Azure.
- Mock external services when appropriate.

# Azure readiness

- Design services to be cloud-ready.
- Read configuration exclusively from environment variables.
- Keep authentication providers replaceable.
- Prefer managed identities over stored credentials when running in Azure.
- Design storage access through abstractions to allow Azure Storage later.
- Design authentication to support Microsoft Entra ID in the future.
- Ensure services are stateless where possible.
- Make applications container-friendly.
