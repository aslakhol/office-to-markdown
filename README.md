# office-to-markdown

Bootstrap foundation for `officetomarkdown.com`.

## Stack

- Next.js (TypeScript) for product/UI.
- UploadThing for signed browser uploads returning storage references.
- Vercel Python function scaffold for conversion runtime.

## Prerequisites

- Node.js 20+
- `pnpm` 8.15.6+
- Python 3.11+

## Quick start

1. Install JavaScript dependencies:

   ```bash
   pnpm install
   ```

2. Configure environment variables:

   ```bash
   cp .env.example .env.local
   ```

3. (Optional) Set up Python dependencies locally for endpoint work:

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

4. Run the app:

   ```bash
   pnpm dev
   ```

5. Run local quality gates:

   ```bash
   pnpm quality
   ```

6. Validate production build:

   ```bash
   pnpm build
   python3 -m py_compile api/convert.py
   ```

## Project layout

- `app/`: Next.js App Router scaffold.
- `app/api/uploadthing/`: UploadThing route handler and upload router.
- `api/convert.py`: Python conversion endpoint stub.
- `vercel.json`: Vercel function guardrails for Python runtime boundaries.
- `.env.example`: environment variable template.
- `scripts/verify-preview-runtime.sh`: preview smoke check for UI + Python stubs.
- `research/`: planning and technical research notes.

## Notes

- The `/api/convert` Python endpoint is a stub and intentionally returns `501` until conversion engine logic is implemented.
- Upload UI uses UploadThing and sends only storage references (`fileKey`) + metadata to `/api/convert`.
- Shared conversion contracts live in `contracts/convert_contract.json` and are consumed by:
  - `contracts/convert_contract.py` for Python runtime validation.
  - `lib/contracts/convert.ts` for frontend/shared TypeScript types.

## Runtime boundaries

| Route | Runtime | Source | Boundary |
| --- | --- | --- | --- |
| `/` and non-API pages | Next.js (App Router) | `app/` | UI/SEO only |
| `/api/uploadthing` | Next.js Route Handler (Node.js) | `app/api/uploadthing/route.ts` | Signed upload orchestration, returns file references |
| `/api/convert` | Vercel Python Function | `api/convert.py` | Accept file reference payloads only (no raw file bytes) |

- Vercel body limit guardrail: request/response payloads must stay under 4.5 MB.
- `api/convert.py` rejects byte-like fields (`fileBytes`, `fileBase64`, `fileData`, `fileContent`, `rawFile`) to enforce reference-only conversion requests.
- `vercel.json` pins the Python endpoint max duration to `30s`.

## Upload assumptions

- UploadThing token is configured via `UPLOADTHING_TOKEN`.
- Browser uploads are signed via `/api/uploadthing`; raw file bytes are sent directly to UploadThing storage.
- UI and route middleware allow DOCX, PPTX, XLSX, and PDF uploads.
- The upload route currently allows up to 32 MB (`blob` route config limit), while convert payload contract validation remains independent.

## Convert API contract

POST `/api/convert` request fields:
- `fileKey` (string)
- `originalFilename` (string)
- `sizeBytes` (non-negative integer)
- `mimeType` (string)
- `idempotencyKey` (string)

POST `/api/convert` response fields:
- `markdown` (string)
- `inputFormat` (string)
- `detectedFormat` (string)
- `warnings` (string[])
- `timings` (object with numeric values)
- `errorCode` (`null` or one of the typed error codes)

Typed `errorCode` categories:
- `unsupported_format`
- `missing_dependency`
- `payload_too_large`
- `conversion_failed`
- `storage_read_failed`
- `timeout`
- `rate_limited`
- `invalid_file`

## Preview verification

Run the preview smoke check against the generated deployment URL:

```bash
./scripts/verify-preview-runtime.sh https://<preview-domain>
```

The script verifies:
- UI route responds with the Next.js scaffold.
- Python healthcheck responds from `/api/convert`.
- Payloads with embedded file bytes are rejected.

## Contributing

- Use `pnpm quality` before opening a PR.
- See [CONTRIBUTING.md](CONTRIBUTING.md) for branch and pull request workflow.
