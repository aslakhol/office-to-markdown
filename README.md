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

5. Validate build and lint:

   ```bash
   pnpm lint
   pnpm build
   python3 -m py_compile api/convert.py
   ```

## Project layout

- `app/`: Next.js App Router scaffold.
- `api/convert.py`: Python conversion endpoint stub.
- `.env.example`: environment variable template.
- `research/`: planning and technical research notes.

## Notes

- The `/api/convert` Python endpoint is a stub and intentionally returns `501` until conversion engine logic is implemented.
- UploadThing integration and shared API contracts are planned in follow-up issues.
