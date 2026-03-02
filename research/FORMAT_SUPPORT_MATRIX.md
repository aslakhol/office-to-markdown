# Format Support Matrix (No Third-Party API, No LibreOffice Service)

Last updated: 2026-03-02

## Scope
This compares only the options still in scope:
- `MarkItDown` (server-side Python, on your infra)
- `pandoc.wasm` (client-side)
- Browser JS pipeline (`mammoth.js` + `turndown` + `turndown-plugin-gfm` + `SheetJS`)

Excluded by request:
- Third-party conversion APIs
- Separate LibreOffice/`unoserver` service

## Legend
- `YES` = native/officially supported input
- `PARTIAL` = support exists but with important caveats (mapping loss, or narrow implementation)
- `NO` = not supported as an input format in that toolchain

## Full Lists Per Option

### 1) MarkItDown (core converters in source)

#### File extension-level formats
- `.pdf`
- `.pptx`
- `.docx`
- `.xlsx`
- `.xls`
- `.csv`
- `.epub`
- `.ipynb`
- `.msg`
- `.zip`
- `.jpg`, `.jpeg`, `.png`
- `.wav`, `.mp3`, `.m4a`, `.mp4`
- `.html`, `.htm`
- `.rss`, `.atom`
- `.txt`, `.text`, `.md`, `.markdown`, `.json`, `.jsonl`

#### URL/input patterns handled by dedicated converters
- Generic HTML pages
- Wikipedia article URLs
- YouTube watch URLs
- Bing SERP URLs

#### Important dependency notes
- `pdf`, `docx`, `pptx`, `xlsx`, `xls`, `outlook`, `audio-transcription`, `youtube-transcription` are optional dependency groups.
- If those deps are missing, converter registration exists but conversion can fail at runtime with missing dependency errors.

### 2) pandoc.wasm (full input-format list from official web app selector)

`asciidoc`, `biblatex`, `bibtex`, `commonmark`, `commonmark_x`, `creole`, `csljson`, `csv`, `djot`, `docbook`, `docx`, `dokuwiki`, `endnotexml`, `epub`, `fb2`, `gfm`, `haddock`, `html`, `ipynb`, `jats`, `jira`, `json`, `latex`, `man`, `markdown`, `markdown_github`, `markdown_mmd`, `markdown_phpextra`, `markdown_strict`, `mediawiki`, `muse`, `native`, `odt`, `opml`, `org`, `pptx`, `ris`, `rst`, `rtf`, `t2t`, `textile`, `tikiwiki`, `tsv`, `twiki`, `typst`, `vimwiki`, `xlsx`, `xml`

### 3) Browser JS pipeline

#### `mammoth.js` input
- `.docx`

#### `turndown` input
- HTML strings/DOM (for HTML -> Markdown)

#### `SheetJS` Community Edition read formats (as documented)
- Excel 2007+ XML (`.xlsx`, `.xlsm`)
- Excel 2007+ Binary (`.xlsb`)
- Excel 2003-2004 XML (`SpreadsheetML` XML)
- Excel 97-2004 (`.xls` BIFF8)
- Excel 5.0/95 (`.xls` BIFF5)
- Excel 4.0 (`.xls`/`.xlw` BIFF4)
- Excel 3.0 (`.xls` BIFF3)
- Excel 2.0/2.1 / Multiplan 4.x DOS (`.xls` BIFF2)
- Delimiter-separated values (`.csv`/`.txt`)
- DIF (`.dif`)
- SYLK (`.slk`/`.sylk`)
- PRN (`.prn`)
- UTF-16 text (`.txt`)
- NUMBERS
- WPS ET
- ODS
- FODS
- UOS1/UOS2
- DBF
- Lotus 1-2-3 (`.wk1`, `.wk3`)
- Lotus 1-2-3 (`.wks`, `.wk2`, `.wk4`, `.123`)
- Quattro Pro (`.wq1`, `.wq2`, `.wb1`, `.wb2`, `.wb3`, `.qpw`)
- Works spreadsheet (`.wks`)
- Works spreadsheet (`.xlr`)
- HTML tables
- RTF tables
- ETH

## Matrix (Tools on X-axis, Formats on Y-axis)

| Format | MarkItDown | pandoc.wasm | Browser JS Pipeline |
|---|---|---|---|
| PDF | YES | NO | NO |
| DOCX | YES | YES | YES |
| DOC (legacy) | NO | NO | NO |
| PPTX | YES | YES | NO |
| PPT (legacy) | NO | NO | NO |
| XLSX | YES | YES | YES |
| XLSM | NO | NO | YES |
| XLSB | NO | NO | YES |
| XLS (BIFF family) | YES | NO | YES |
| ODT | NO | YES | NO |
| ODS/FODS | NO | NO | YES |
| CSV | YES | YES | YES |
| TSV | PARTIAL (as plain text) | YES | PARTIAL (parse manually or treat as text) |
| RTF | NO | YES | YES (table-oriented via SheetJS) |
| HTML/HTM | YES | YES | YES |
| EPUB | YES | YES | NO |
| FB2 | NO | YES | NO |
| IPYNB | YES | YES | NO |
| JSON/JSONL | YES | YES (json/csljson) | PARTIAL (manual transform) |
| XML (general) | PARTIAL (plain text unless specialized) | YES | PARTIAL (SpreadsheetML in SheetJS) |
| RSS/Atom | YES | NO | NO |
| ZIP container | YES (iterates contents) | NO | NO |
| Outlook MSG | YES | NO | NO |
| JPG/JPEG/PNG | YES | NO | NO |
| WAV/MP3/M4A/MP4 audio input | YES | NO | NO |
| YouTube URL | YES | NO | NO |
| Wikipedia URL | YES | NO | NO |
| Bing SERP URL | YES | NO | NO |
| Markdown dialects (GFM/CommonMark/etc) | YES (as plain text for `.md`) | YES (many dialect readers) | YES (HTML -> MD direction; no general MD parser in this stack) |
| AsciiDoc | NO | YES | NO |
| LaTeX | NO | YES | NO |
| reStructuredText | NO | YES | NO |
| Org | NO | YES | NO |
| Textile / MediaWiki / DokuWiki / etc | NO | YES | NO |

## Practical read on the matrix for officetomarkdown.com

- `MarkItDown` wins on mixed binary/non-office input breadth (images, audio, msg, zip, URL-specialized handlers).
- `pandoc.wasm` wins on client-side breadth for text/markup + key office formats (`docx/pptx/xlsx/odt/rtf/ipynb/epub`).
- Browser JS pipeline can be excellent for `docx + spreadsheet-heavy` flows, but does not natively cover `pptx/pdf/msg/zip/audio/image` as a full Office-to-Markdown solution.

## Sources

- MarkItDown README: https://raw.githubusercontent.com/microsoft/markitdown/main/README.md
- MarkItDown converter list: https://raw.githubusercontent.com/microsoft/markitdown/main/packages/markitdown/src/markitdown/converters/__init__.py
- MarkItDown converters (extension/mime rules): https://github.com/microsoft/markitdown/tree/main/packages/markitdown/src/markitdown/converters
- Pandoc web app selector (input format list): https://pandoc.org/try/
- Pandoc 3.9 release (WASM support): https://github.com/jgm/pandoc/releases/tag/3.9
- Mammoth.js README: https://raw.githubusercontent.com/mwilliamson/mammoth.js/master/README.md
- Turndown README: https://raw.githubusercontent.com/mixmark-io/turndown/master/README.md
- Turndown GFM plugin README: https://raw.githubusercontent.com/mixmark-io/turndown-plugin-gfm/master/README.md
- SheetJS format support table: https://docs.sheetjs.com/docs/miscellany/formats
