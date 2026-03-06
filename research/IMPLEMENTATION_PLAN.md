# Implementation Plan (MVP -> Future Pandoc)

Last updated: 2026-03-02

## Phase 1: MVP with MarkItDown

1. Build the basic product shell in Next.js

- Landing page, converter page, and result page.
- Keep UX simple: upload, convert, copy/download Markdown.

2. Implement secure upload + conversion flow

- Upload file directly from browser to object storage.
- Send storage reference to a Python function that runs `markitdown`.
- Return normalized Markdown output and basic metadata.

3. Add reliability and cost guardrails

- File size/type validation before upload.
- Rate limits and abuse protection.
- Timeouts + friendly error handling.

4. Instrument format-level analytics

- Track requested format, success/failure, latency, and file size.
- Use this data to choose future migration targets.

### Prototype Gate

- Product-shell work does not start until the committed DOCX/PPTX/XLSX/PDF smoke corpus and negative fixture pass in both `pnpm test` and `pnpm test:browser`.

## Phase 2: Prepare for Multi-Engine Routing

1. Introduce a converter router

- `convert(file) -> provider` where provider is initially always `markitdown`.
- Keep output contract stable (same response schema regardless of provider).

2. Add regression test corpus

- Store representative files per format.
- Snapshot expected Markdown behavior and compare on changes.

## Future Development: pandoc.wasm Migration

1. Start with one high-volume, low-risk format

- Usually `docx` or `xlsx` first, based on real traffic.

2. Move formats incrementally

- Migrate only after quality + performance checks pass.
- Keep `markitdown` as server fallback for difficult/edge files.

## Exit Criteria for Each Format Migration

- Equal or better conversion quality on test corpus.
- Lower server compute usage per conversion.
- No increase in user-visible error rate.
