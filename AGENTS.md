# Repository Guidelines

## Project Structure & Module Organization
This repository is currently minimal, with no committed source or test directories detected. When you add code, keep a simple, conventional layout such as:

- `src/` for application/library source code
- `tests/` or `__tests__/` for automated tests
- `assets/` for static files (images, fixtures)
- `scripts/` for developer utilities

Document any nonstandard layout here as the project evolves.

## Build, Test, and Development Commands
No build or test commands are present yet. Add a `Makefile`, `package.json`, or equivalent and list the primary workflows. Examples to follow once available:

- `make build` - compile or bundle the project
- `make test` - run the full test suite
- `make lint` - run static analysis/formatting

## Coding Style & Naming Conventions
Until a formatter or linter is introduced, use consistent 2 or 4 space indentation (pick one and enforce it), keep line lengths reasonable, and name files and directories in `kebab-case` or `snake_case` consistently. When tools are added (e.g., `prettier`, `eslint`, `ruff`, `gofmt`), document them here and prefer automated formatting.

## Testing Guidelines
No testing framework is configured yet. When tests are introduced, specify the framework (e.g., `pytest`, `jest`, `go test`) and use descriptive names like `test_user_creation` or `UserCreation.spec.ts`. State any coverage thresholds and how to run targeted tests.

## Commit & Pull Request Guidelines
The commit history is not available in this working tree. Adopt a simple convention such as imperative, scoped messages: `feat(auth): add login handler`. Pull requests should include:

- a clear description of changes and rationale
- linked issues or tickets when applicable
- test evidence (commands run, results)
- screenshots or logs for UI/behavioral changes

## Security & Configuration Tips
If the project introduces secrets or config files, add `.env` examples and document required variables. Never commit secrets; prefer `.env.example` or `config.example.yml`.
