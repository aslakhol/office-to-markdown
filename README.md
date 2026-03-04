# office-to-markdown

Bootstrap foundation for `officetomarkdown.com`.

## Stack

- Next.js (TypeScript) for product/UI.
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
- `api/convert.py`: Python conversion endpoint stub.
- `vercel.json`: Vercel function guardrails for Python runtime boundaries.
- `.env.example`: environment variable template.
- `scripts/verify-preview-runtime.sh`: preview smoke check for UI + Python stubs.
- `research/`: planning and technical research notes.

## Notes

- The `/api/convert` Python endpoint is a stub and intentionally returns `501` until conversion engine logic is implemented.
- UploadThing integration and shared API contracts are planned in follow-up issues.

## Runtime boundaries

| Route | Runtime | Source | Boundary |
| --- | --- | --- | --- |
| `/` and non-API pages | Next.js (App Router) | `app/` | UI/SEO only |
| `/api/convert` | Vercel Python Function | `api/convert.py` | Accept file reference payloads only (no raw file bytes) |

- Vercel body limit guardrail: request/response payloads must stay under 4.5 MB.
- `api/convert.py` rejects byte-like fields (`fileBytes`, `fileBase64`, `fileData`, `fileContent`, `rawFile`) to enforce reference-only conversion requests.
- `vercel.json` pins the Python endpoint max duration to `30s`.

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
