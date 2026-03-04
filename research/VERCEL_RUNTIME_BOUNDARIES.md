# Vercel Runtime Boundaries

Last updated: 2026-03-04

## Route Mapping

| Route | Runtime | Source |
| --- | --- | --- |
| `/` and non-API pages | Next.js App Router | `app/` |
| `/api/convert` | Vercel Python Function | `api/convert.py` |

## Runtime Guardrails

- `vercel.json` sets `api/convert.py` max duration to 30 seconds.
- Vercel request/response payload limit is 4.5 MB, so conversion requests must carry file references (for example `fileKey`) and not file bytes.
- `api/convert.py` actively rejects payloads containing file-byte fields:
  - `fileBytes`
  - `fileBase64`
  - `fileData`
  - `fileContent`
  - `rawFile`

## Preview Validation Procedure

Run:

```bash
./scripts/verify-preview-runtime.sh https://<preview-domain>
```

Expected checks:

1. `/` serves the Next.js UI stub.
2. `/api/convert` GET returns the Python health payload.
3. `/api/convert` POST rejects embedded file bytes with HTTP 400.
4. `/api/convert` POST with `fileKey` returns the conversion stub with HTTP 501.
