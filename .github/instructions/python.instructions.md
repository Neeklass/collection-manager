---
name: 'Python Standards'
description: 'Coding conventions for Python projects'
applyTo: '**/*.py'
---

# General Coding Standards

This also applies [General Coding Standards](general-coding-standards.instructions.md).

# Python coding standards

- Follow the PEP 8 style guide.
- Use type hints for all function signatures.
- Write docstrings for public functions.
- Use 4 spaces for indentation.
- Prefer f-strings for string formatting.
- Keep functions small and focused on a single responsibility.
- Use meaningful and descriptive variable names.
- Prefer `pathlib` over `os.path`.
- Use `logging` instead of `print` for application output.
- Raise specific exceptions instead of generic `Exception`.
- Handle exceptions explicitly and avoid silent failures.
- Prefer list, dict, and set comprehensions where appropriate.
- Use `dataclasses` for structured data when suitable.
- Avoid mutable default arguments.
- Keep imports grouped and sorted (standard library, third-party, local).
- Follow the DRY (Don't Repeat Yourself) principle.
- Write unit-testable code and avoid unnecessary side effects.
- Use context managers (`with`) for files and resources.
- Format code with Black and lint with Ruff.
