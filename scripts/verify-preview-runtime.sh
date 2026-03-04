#!/usr/bin/env bash

set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <preview-url>"
  echo "Example: $0 https://office-to-markdown-git-codex-issue-6-abc123-aslakhol.vercel.app"
  exit 1
fi

preview_url="${1%/}"

echo "Checking UI route at ${preview_url}/ ..."
ui_response="$(curl -fsS "${preview_url}/")"
if ! printf "%s" "$ui_response" | grep -q "office-to-markdown"; then
  echo "UI check failed: expected page content not found."
  exit 1
fi

health_tmp="$(mktemp)"
trap 'rm -f "$health_tmp"' EXIT

echo "Checking Python health endpoint at ${preview_url}/api/convert ..."
health_status="$(curl -sS -o "$health_tmp" -w "%{http_code}" "${preview_url}/api/convert")"
if [ "$health_status" != "200" ]; then
  echo "Healthcheck failed: expected 200, got ${health_status}."
  cat "$health_tmp"
  exit 1
fi

python3 - "$health_tmp" <<'PY'
import json
import pathlib
import sys

payload = json.loads(pathlib.Path(sys.argv[1]).read_text())
assert payload.get("status") == "ok", payload
assert payload.get("service") == "convert", payload
PY

boundary_tmp="$(mktemp)"
trap 'rm -f "$health_tmp" "$boundary_tmp"' EXIT

echo "Checking payload boundary (no file bytes in request body) ..."
boundary_status="$(curl -sS -o "$boundary_tmp" -w "%{http_code}" \
  -X POST "${preview_url}/api/convert" \
  -H "Content-Type: application/json" \
  --data '{"fileKey":"uploads/example.docx","originalFilename":"example.docx","sizeBytes":1234,"mimeType":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","idempotencyKey":"preview-check-1","fileBase64":"ZmFrZQ=="}')"

if [ "$boundary_status" != "400" ]; then
  echo "Boundary check failed: expected 400, got ${boundary_status}."
  cat "$boundary_tmp"
  exit 1
fi

python3 - "$boundary_tmp" <<'PY'
import json
import pathlib
import sys

payload = json.loads(pathlib.Path(sys.argv[1]).read_text())
assert payload.get("errorCode") == "invalid_file", payload
assert "file bytes" in payload.get("message", ""), payload
PY

echo "Checking conversion stub response ..."
stub_tmp="$(mktemp)"
trap 'rm -f "$health_tmp" "$boundary_tmp" "$stub_tmp"' EXIT

stub_status="$(curl -sS -o "$stub_tmp" -w "%{http_code}" \
  -X POST "${preview_url}/api/convert" \
  -H "Content-Type: application/json" \
  --data '{"fileKey":"uploads/example.docx","originalFilename":"example.docx","sizeBytes":1234,"mimeType":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","idempotencyKey":"preview-check-2"}')"

if [ "$stub_status" != "501" ]; then
  echo "Stub check failed: expected 501, got ${stub_status}."
  cat "$stub_tmp"
  exit 1
fi

python3 - "$stub_tmp" <<'PY'
import json
import pathlib
import sys

payload = json.loads(pathlib.Path(sys.argv[1]).read_text())
assert payload.get("errorCode") is None, payload
assert payload.get("timings") == {"totalMs": 0}, payload
PY

echo "Preview runtime verification passed."
