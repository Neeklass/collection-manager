---
name: 'TypeScript & Next.js Standards'
description: 'Coding conventions for TypeScript and Next.js projects'
applyTo: '**/*.{ts,tsx}'
---

# General Coding Standards

This also applies [General Coding Standards](general-coding-standards.instructions.md).

# TypeScript & Next.js coding standards

- Use strict TypeScript mode.
- Prefer `type` over `interface` unless declaration merging is required.
- Avoid `any`; use `unknown` or proper types instead.
- Use explicit return types for exported functions.
- Keep functions small and focused on a single responsibility.
- Prefer functional components over class components.
- Use React hooks instead of class lifecycle methods.
- Follow the App Router conventions when using Next.js.
- Prefer Server Components unless client-side interactivity is required.
- Add `"use client"` only when necessary.
- Use `async/await` instead of promise chaining.
- Handle errors explicitly and provide meaningful error messages.
- Prefer `const` over `let`; avoid `var`.
- Use ES module imports and organize imports consistently.
- Keep components reusable and avoid deeply nested JSX.
- Extract repeated logic into custom hooks or utility functions.
- Use descriptive variable and function names.
- Avoid magic numbers; extract constants.
- Format code with Prettier.
- Follow ESLint rules without disabling them unless absolutely necessary.
