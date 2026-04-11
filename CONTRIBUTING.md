# Contributing to Pravah

Thanks for contributing. This project is still evolving, so small, focused pull requests are the easiest to review and merge.

## Before You Start

- Open an issue first for bugs, larger features, or architectural changes.
- Use the issue templates so maintainers can triage work quickly.
- Keep changes scoped to one clear improvement when possible.
- Check for existing discussions before starting duplicate work.

## Local Setup

```bash
npm install
npm run dev
```

Create a local `.env` file before starting the app.

Run the auth backend separately when working on authenticated flows:

```bash
npm run auth:server
```

## Development Guidelines

- Use clear names and keep changes easy to review.
- Avoid committing secrets, generated credentials, or local runtime data.
- Update documentation when behavior, setup, or developer workflow changes.
- Prefer incremental fixes over broad unrelated refactors.
- Prefer one issue per pull request unless the changes are tightly coupled.

## Suggested Contributor Tasks

If you are looking for a first contribution, these are good places to start:

- Documentation cleanup, setup fixes, and README improvements.
- Bug fixes in the auth flow, builder flow, or integration adapters.
- Small UI and accessibility improvements in the React frontend.
- Missing env var handling, validation, or error messaging.
- Test coverage for workflow actions, API adapters, and local server behavior.
- Integration-specific fixes for one service at a time, rather than broad cross-service refactors.

## How We Decide Contributor Tasks

Use the following rule of thumb when deciding whether something should be opened as a contributor issue or kept as maintainer work:

- Contributor tasks should be self-contained and small enough to finish in one pull request.
- The work should have a clear success condition, such as a UI fix, a docs update, or a bug that can be reproduced locally.
- The task should not require production access, secret rotation, or architecture decisions that affect multiple services.
- If an issue needs more than one distinct change, split it into separate tasks before labeling it for contributors.
- If the work is blocked by unclear product direction or security-sensitive behavior, keep it as a maintainer issue until it is refined.

Good signs that an issue belongs to contributors:

- It has a reproducible problem statement or a concrete improvement request.
- It is limited to one app area, one integration, or one documentation change.
- It can be verified with local testing or a clear checklist.

Good signs that an issue should stay with maintainers first:

- It changes cross-service behavior or shared infrastructure.
- It needs new labels, workflows, secrets, or release coordination.
- It requires product decisions that are not yet settled.

## Pull Requests

- Explain what changed and why.
- Include screenshots for UI changes when helpful.
- Mention any environment variables, migrations, or manual verification steps.
- Ensure linting and builds pass locally before opening the PR.
- Link the issue or task that the pull request resolves.

## Code Style

- TypeScript and React code should match existing project conventions.
- Keep modules focused and avoid unnecessary dependencies.
- Add comments only where they improve clarity.
