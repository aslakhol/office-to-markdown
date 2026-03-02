# officetomarkdown.com - technical options and cost research

Last updated: 2026-03-02

## Goal
Build a utility site on Vercel that converts Office files to Markdown with low friction and controlled costs.

## 1) Baseline option: Next.js + Python + MarkItDown

### Summary
- Product/UI: Next.js on Vercel.
- Conversion: Python function using `markitdown`.
- Upload flow: browser uploads to object storage, then conversion function reads from storage URL (do not post file bytes through function body).

### Why this is not a true frontend-only solution
- `markitdown` depends on `magika`.
- `magika` depends on `onnxruntime`.
- That dependency chain is not a practical browser/Pyodide path for an MVP.

### Vercel constraints that matter
- Function request/response body max is **4.5 MB**.
- Python function bundle limit is **500 MB** uncompressed.
- Pro usage is billed on active CPU and provisioned memory time.

### Cost profile
- Low fixed cost at low traffic.
- Variable cost grows with conversions (CPU + memory duration).
- Spikes/cold starts are possible if you install broad optional dependencies.

## 2) Alternatives that do NOT use MarkItDown

## Option A: Browser-only conversion with `pandoc.wasm` (strong cost candidate)

### What changed recently
- Pandoc 3.8.3 (published 2025-12-01) added **`pptx` and `xlsx` input** support.
- Pandoc 3.9 adds official WASM support and an app that runs in-browser.
- Release notes explicitly state that once loaded, conversions can run entirely in the browser and do not touch a server.

### Practical implications
- You can run conversion client-side in a Web Worker.
- Vercel backend can be almost static (marketing pages + maybe analytics + abuse controls).
- Marginal conversion compute cost becomes near-zero on your side.

### Tradeoffs
- Initial payload is non-trivial (`pandoc-3.9.wasm.zip` asset is ~16.2 MB).
- Older/low-memory devices will convert slower.
- WASM sandbox limitations apply (release notes mention no system-command execution; limited network-style behavior).

### Cost profile
- Lowest ongoing infra cost among full-feature options.
- Main costs become CDN egress + storage + optional anti-abuse controls.

## Option B: Browser pipeline with JS libraries by format

### Typical stack
- DOCX: `mammoth.js` (DOCX -> HTML) + `turndown` + `turndown-plugin-gfm` (HTML -> Markdown).
- XLSX: `SheetJS` parse, render worksheet tables as Markdown.
- Optional fallback for hard cases: server/API conversion.

### Tradeoffs
- Good for fast MVP on common files.
- Quality can vary on complex layouts.
- `mammoth` warns it performs no sanitization for untrusted input (important security note).
- `mammoth` also notes direct Markdown output is deprecated; HTML->Markdown conversion is recommended.

### Cost profile
- Very low server cost (mostly static hosting).
- Engineering cost shifts to per-format quality handling.

## Option C: Third-party conversion API (no conversion infra to run)

### Typical providers
- CloudConvert
- ConvertAPI

### What pricing models look like
- CloudConvert: free tier up to 10 conversions/day, then credit-based model (typically by conversion minute with base credits by type).
- ConvertAPI: free conversion-second allowance, then monthly plans based on conversion seconds.

### Tradeoffs
- Fastest path to broad format support.
- Minimal operations burden.
- Vendor lock-in + data processing dependencies.
- Unit economics can get expensive at SEO-scale traffic.

### Cost profile
- Low fixed cost.
- Highest marginal/per-conversion risk at scale.

## Option D: Self-host LibreOffice listener service (without MarkItDown)

### Stack
- Keep Next.js on Vercel.
- Run a separate conversion service based on LibreOffice listener mode.
- Use `unoserver` (recommended by unoconv project; unoconv is deprecated).

### Why people use this
- `unoserver` keeps LibreOffice warm instead of starting a full process per conversion.
- Better for heavy/batch conversion throughput than ad hoc CLI conversions.

### Tradeoffs
- You own ops (patching, queueing, retries, monitoring).
- But you avoid per-conversion vendor API pricing.

### Cost profile
- Predictable fixed monthly compute + storage/network.
- Usually better economics than third-party APIs once traffic is steady.

## 3) Cost-first comparison (high-level)

1. Browser-only (`pandoc.wasm` / JS pipeline): lowest marginal cost, best if UX/performance is acceptable.
2. Self-host conversion worker (`unoserver`): predictable fixed cost, more ops.
3. Vercel Python conversion (`markitdown`): simple architecture, but compute costs scale with usage.
4. Third-party conversion APIs: fastest to launch, but potentially the most expensive at high volume.

## 4) Recommendation for officetomarkdown.com

If your primary concern is cost control at SEO traffic scale:

1. Start with **Option A**: browser-side conversion using `pandoc.wasm`.
2. Add a **server fallback path** only for failures/edge files.
3. Gate fallback usage (file size limits, daily quota, optional login) to protect margins.
4. Keep architecture ready for Option D later if fallback volume grows.

This gives you the best chance of preserving the “free utility site” model while still supporting broad Office formats.

## Sources

- MarkItDown repository: https://github.com/microsoft/markitdown
- MarkItDown root README (supported formats, optional deps): https://raw.githubusercontent.com/microsoft/markitdown/main/README.md
- MarkItDown package dependencies (`magika`): https://raw.githubusercontent.com/microsoft/markitdown/main/packages/markitdown/pyproject.toml
- MarkItDown source import of `magika`: https://raw.githubusercontent.com/microsoft/markitdown/main/packages/markitdown/src/markitdown/_markitdown.py
- Magika dependencies (`onnxruntime`): https://raw.githubusercontent.com/google/magika/main/python/pyproject.toml
- Vercel Functions limits (`4.5 MB`, bundle limits, cost model): https://vercel.com/docs/functions/limitations
- Vercel Functions limits (markdown source): https://vercel.com/docs/functions/limitations.md
- Vercel Python runtime docs: https://vercel.com/docs/functions/runtimes/python
- Vercel Python runtime docs (markdown source): https://vercel.com/docs/functions/runtimes/python.md
- Pandoc release 3.8.3 (adds `pptx`/`xlsx` input): https://github.com/jgm/pandoc/releases/tag/3.8.3
- Pandoc release 3.9 (WASM/browser notes): https://github.com/jgm/pandoc/releases/tag/3.9
- Pandoc 3.9 release API payload (contains wasm/browser details): https://api.github.com/repos/jgm/pandoc/releases/tags/3.9
- Pandoc 3.9 assets (includes `pandoc-3.9.wasm.zip` size): https://api.github.com/repos/jgm/pandoc/releases/tags/3.9
- Pandoc web app: https://pandoc.org/try/
- Mammoth.js README (browser input support, markdown deprecation, sanitization warning): https://raw.githubusercontent.com/mwilliamson/mammoth.js/master/README.md
- Turndown README: https://raw.githubusercontent.com/mixmark-io/turndown/master/README.md
- Turndown GFM plugin README: https://raw.githubusercontent.com/mixmark-io/turndown-plugin-gfm/master/README.md
- SheetJS README: https://raw.githubusercontent.com/SheetJS/sheetjs/master/README.md
- CloudConvert pricing: https://cloudconvert.com/pricing
- ConvertAPI pricing: https://www.convertapi.com/pricing
- unoconv README (deprecated; points to unoserver): https://raw.githubusercontent.com/unoconv/unoconv/master/README.adoc
- unoserver README: https://raw.githubusercontent.com/unoconv/unoserver/master/README.rst
