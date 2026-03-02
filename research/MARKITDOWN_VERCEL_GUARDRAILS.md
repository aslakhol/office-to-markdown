# MarkItDown + Vercel Guardrails

Purpose: practical constraints and pitfalls to avoid while building `officetomarkdown.com` with Next.js + Python Vercel Functions + `markitdown`.

## 1) Architecture Guardrails

- Use Next.js on Vercel for UI/SEO pages and upload UX.
- Use a Python Vercel Function for conversion (`markitdown`).
- Use direct browser upload to storage (Vercel Blob or S3-style signed upload), then pass only the file reference to conversion.

Why this matters:
- Keeps requests small and avoids Vercel function payload failures.

## 2) Hard Vercel Limits You Must Design Around

- Vercel Function request/response body limit: **4.5 MB**.
- Python function bundle limit is larger than Node, but still finite; large dependency sets increase cold starts and deployment size.
- Python runtime is supported on Vercel, but docs still frame it as permissioned/beta-style runtime.

Do not:
- Send user file bytes through your function body.

Do:
- Upload directly to storage.
- Pass only storage key/URL to conversion API.

## 3) Dependency and Packaging Guardrails

- `markitdown` has optional dependency groups; install only what you need first.
- Start with minimal groups for MVP formats (for example: `pdf`, `docx`, `pptx`, `xlsx`), not `[all]` unless needed.
- Keep requirements pinned and reproducible.

Why this matters:
- Smaller bundle -> faster cold starts -> fewer timeout/latency surprises.

## 4) Conversion API Design Guardrails

- Keep one stable response schema from day one:
  - `markdown`
  - `detected_format` / `input_format`
  - `warnings`
  - `error_code` (typed)
  - `timings`
- Make conversion idempotent for retry safety (same file key, same conversion path).

Typed error categories to keep:
- `unsupported_format`
- `missing_dependency`
- `payload_too_large` (pre-check path)
- `conversion_failed`
- `storage_read_failed`
- `timeout`

## 5) File Handling Guardrails

- Validate extension + mime before conversion.
- Enforce explicit file size caps at upload step.
- Set object TTL/lifecycle cleanup in storage (privacy + cost).
- Never trust client-declared mime only.

## 6) Performance and Reliability Guardrails

- Log per-step timings:
  - upload complete
  - storage fetch
  - markitdown conversion
  - response serialization
- Track success/failure by format.
- Maintain a small regression corpus of real files per target format.
- Test cold-start behavior before launch.

## 7) Security and Abuse Guardrails

- Use signed upload URLs with short expiry.
- Apply rate limits at API boundary.
- Reject disallowed file types early.
- Avoid keeping original files longer than needed.

## 8) MVP Scope Guardrails

- Keep MVP format scope explicit and small (the formats you actually want to support on day one).
- Add formats only when you have test samples + monitoring for that format.
- Do not optimize for every edge case before launch.

## 9) Launch Checklist (Short)

- [ ] Direct-to-storage upload implemented
- [ ] Conversion endpoint accepts file reference only
- [ ] Size/type validation in place
- [ ] Minimal dependency set installed
- [ ] Typed errors returned to UI
- [ ] Per-format metrics and logs enabled
- [ ] Storage TTL cleanup enabled
- [ ] Regression corpus run on deploy

## Sources

- MarkItDown repository: https://github.com/microsoft/markitdown
- MarkItDown pyproject (deps/extras): https://raw.githubusercontent.com/microsoft/markitdown/main/packages/markitdown/pyproject.toml
- MarkItDown core import of `magika`: https://raw.githubusercontent.com/microsoft/markitdown/main/packages/markitdown/src/markitdown/_markitdown.py
- Magika pyproject (`onnxruntime`): https://raw.githubusercontent.com/google/magika/main/python/pyproject.toml
- Vercel function limits: https://vercel.com/docs/functions/limitations
- Vercel body-limit workaround note: https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions
- Vercel Python runtime: https://vercel.com/docs/functions/runtimes/python
- Vercel Next.js + Flask example: https://github.com/vercel/examples/tree/main/python/nextjs-flask
