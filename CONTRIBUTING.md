# Contributing

## Local workflow

1. Create a branch from `main`.
2. Make focused, atomic commits.
3. Run quality gates before pushing:

   ```bash
   pnpm quality
   pnpm build
   python3 -m py_compile api/convert.py
   ```

## Pull requests

- Open a PR against `main` with a clear scope and validation notes.
- Keep PRs small enough to review end-to-end.
- Include issue links in the PR body (`Closes #<issue-number>` when done).

## Required checks

The repository CI workflow (`CI / validate`) is intended to be configured as a required status check on `main` branch protection.
