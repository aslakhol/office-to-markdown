"""Conversion endpoint for Vercel Python runtime."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from functools import lru_cache
from http import HTTPStatus
import os
from pathlib import Path
from tempfile import NamedTemporaryFile
from time import perf_counter
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import urlopen

from flask import Flask, Request, jsonify, request

from contracts.convert_contract import (
    REQUEST_PROHIBITED_BYTE_FIELDS,
    REQUEST_REQUIRED_FIELDS,
    ConvertErrorCode,
    is_convert_error_code,
)

app = Flask(__name__)

SUPPORTED_FORMATS = {"docx", "pptx", "xlsx", "pdf"}
SUPPORTED_MIME_TYPES = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
}


@dataclass(slots=True)
class ApiError:
    errorCode: ConvertErrorCode
    message: str


@dataclass(slots=True)
class ConvertResponse:
    markdown: str
    inputFormat: str
    detectedFormat: str
    warnings: list[str]
    timings: dict[str, int]
    errorCode: ConvertErrorCode | None


def _json_error(error_code: ConvertErrorCode, message: str, status: HTTPStatus):
    if not is_convert_error_code(error_code):
        raise ValueError("Unexpected error code")

    payload = asdict(ApiError(errorCode=error_code, message=message))
    return jsonify(payload), status.value


def _timed_ms(start: float) -> int:
    return int(round((perf_counter() - start) * 1000))


def _extract_payload(incoming_request: Request) -> dict[str, Any]:
    payload = incoming_request.get_json(silent=True)
    if payload is None:
        return {}
    if not isinstance(payload, dict):
        raise TypeError("JSON payload must be an object")
    return payload


def _validate_reference_only_payload(payload: dict[str, Any]) -> str | None:
    forbidden_fields = [
        field for field in REQUEST_PROHIBITED_BYTE_FIELDS if field in payload
    ]
    if forbidden_fields:
        fields = ", ".join(forbidden_fields)
        return f"Request payload must not include file bytes. Remove fields: {fields}"
    return None


def _validate_contract_payload(payload: dict[str, Any]) -> str | None:
    missing_fields = [field for field in REQUEST_REQUIRED_FIELDS if field not in payload]
    if missing_fields:
        return f"Missing required field(s): {', '.join(missing_fields)}"

    unexpected_fields = [field for field in payload if field not in REQUEST_REQUIRED_FIELDS]
    if unexpected_fields:
        return (
            "Unexpected field(s): "
            + ", ".join(unexpected_fields)
            + ". Request must match the convert contract."
        )

    string_fields = ("fileKey", "originalFilename", "mimeType", "idempotencyKey")
    invalid_strings = [
        field
        for field in string_fields
        if not isinstance(payload.get(field), str) or not payload[field].strip()
    ]
    if invalid_strings:
        return (
            "Field(s) must be non-empty strings: "
            + ", ".join(invalid_strings)
        )

    size_bytes = payload.get("sizeBytes")
    if isinstance(size_bytes, bool) or not isinstance(size_bytes, int) or size_bytes < 0:
        return "Field sizeBytes must be a non-negative integer."

    return None


def _get_max_file_size_bytes() -> int:
    size_mb = int(os.getenv("CONVERT_MAX_FILE_SIZE_MB", "25"))
    return size_mb * 1024 * 1024


def _get_request_timeout_seconds() -> float:
    timeout_ms = int(os.getenv("CONVERT_REQUEST_TIMEOUT_MS", "30000"))
    return timeout_ms / 1000


def _detect_input_format(payload: dict[str, Any]) -> str | None:
    original_filename = str(payload["originalFilename"])
    extension = Path(original_filename).suffix.lower().lstrip(".")
    if extension in SUPPORTED_FORMATS:
        return extension

    mime_type = str(payload["mimeType"]).lower()
    return SUPPORTED_MIME_TYPES.get(mime_type)


def _resolve_uploadthing_url(file_key: str) -> str:
    base_url = os.getenv("UPLOADTHING_FILE_URL_BASE", "https://utfs.io/f").rstrip("/")
    return f"{base_url}/{quote(file_key, safe='')}"


def _resolve_fixture_path(file_key: str) -> Path | None:
    fixture_root = app.config.get("LOCAL_FIXTURE_ROOT")
    if not fixture_root or not file_key.startswith("fixture://"):
        return None

    root = Path(fixture_root).resolve()
    candidate = (root / file_key.removeprefix("fixture://")).resolve()
    candidate.relative_to(root)
    return candidate


def _download_source_file(file_key: str, original_filename: str) -> tuple[Path, int]:
    fixture_path = _resolve_fixture_path(file_key)
    suffix = Path(original_filename).suffix or ""

    if fixture_path is not None:
        if not fixture_path.exists():
            raise FileNotFoundError(f"Fixture not found for fileKey {file_key}.")

        temporary_file = NamedTemporaryFile(delete=False, suffix=suffix)
        try:
            data = fixture_path.read_bytes()
            temporary_file.write(data)
            return Path(temporary_file.name), len(data)
        finally:
            temporary_file.close()

    url = _resolve_uploadthing_url(file_key)
    timeout_seconds = _get_request_timeout_seconds()

    temporary_file = NamedTemporaryFile(delete=False, suffix=suffix)
    try:
        with urlopen(url, timeout=timeout_seconds) as response:
            data = response.read()
        temporary_file.write(data)
        return Path(temporary_file.name), len(data)
    finally:
        temporary_file.close()


@lru_cache(maxsize=1)
def _get_markitdown_converter():
    from markitdown import MarkItDown

    return MarkItDown(enable_plugins=False)


def _normalize_markdown(markdown: str) -> str:
    return markdown.replace("\r\n", "\n").strip()


def _convert_file(source_path: Path) -> str:
    converter = _get_markitdown_converter()
    result = converter.convert(str(source_path))
    return _normalize_markdown(result.text_content)


@app.post("/")
def convert_document():
    request_started = perf_counter()
    try:
        payload = _extract_payload(request)
    except TypeError as exc:
        return _json_error("invalid_file", str(exc), HTTPStatus.BAD_REQUEST)

    payload_error = _validate_reference_only_payload(payload)
    if payload_error:
        return _json_error("invalid_file", payload_error, HTTPStatus.BAD_REQUEST)

    contract_error = _validate_contract_payload(payload)
    if contract_error:
        return _json_error(
            "invalid_file", contract_error, HTTPStatus.BAD_REQUEST
        )

    input_format = _detect_input_format(payload)
    if not input_format:
        return _json_error(
            "unsupported_format",
            "Only DOCX, PPTX, XLSX, and PDF are supported in the MVP converter.",
            HTTPStatus.UNSUPPORTED_MEDIA_TYPE,
        )

    if payload["sizeBytes"] > _get_max_file_size_bytes():
        return _json_error(
            "payload_too_large",
            "File exceeds the configured conversion size limit.",
            HTTPStatus.REQUEST_ENTITY_TOO_LARGE,
        )

    download_started = perf_counter()
    source_path: Path | None = None
    try:
        source_path, downloaded_size = _download_source_file(
            file_key=payload["fileKey"],
            original_filename=payload["originalFilename"],
        )
        download_ms = _timed_ms(download_started)

        if downloaded_size > _get_max_file_size_bytes():
            return _json_error(
                "payload_too_large",
                "Downloaded file exceeds the configured conversion size limit.",
                HTTPStatus.REQUEST_ENTITY_TOO_LARGE,
            )

        convert_started = perf_counter()
        try:
            markdown = _convert_file(source_path)
        except RuntimeError as exc:
            return _json_error(
                "missing_dependency",
                f"MarkItDown dependency error: {exc}",
                HTTPStatus.SERVICE_UNAVAILABLE,
            )
        except Exception as exc:
            return _json_error(
                "conversion_failed",
                f"MarkItDown conversion failed: {exc}",
                HTTPStatus.UNPROCESSABLE_ENTITY,
            )

        warnings: list[str] = []
        if not markdown:
            warnings.append("MarkItDown returned empty markdown.")

        response = ConvertResponse(
            markdown=markdown,
            inputFormat=input_format,
            detectedFormat=input_format,
            warnings=warnings,
            timings={
                "downloadMs": download_ms,
                "convertMs": _timed_ms(convert_started),
                "totalMs": _timed_ms(request_started),
            },
            errorCode=None,
        )
        return jsonify(asdict(response)), HTTPStatus.OK.value
    except FileNotFoundError as exc:
        return _json_error(
            "storage_read_failed", str(exc), HTTPStatus.BAD_GATEWAY
        )
    except HTTPError as exc:
        return _json_error(
            "storage_read_failed",
            f"Storage fetch failed with status {exc.code}.",
            HTTPStatus.BAD_GATEWAY,
        )
    except TimeoutError:
        return _json_error(
            "timeout",
            "Timed out while downloading the source file.",
            HTTPStatus.GATEWAY_TIMEOUT,
        )
    except URLError as exc:
        if isinstance(exc.reason, TimeoutError):
            return _json_error(
                "timeout",
                "Timed out while downloading the source file.",
                HTTPStatus.GATEWAY_TIMEOUT,
            )
        return _json_error(
            "storage_read_failed",
            f"Could not fetch source file: {exc.reason}",
            HTTPStatus.BAD_GATEWAY,
        )
    finally:
        if source_path is not None and source_path.exists():
            source_path.unlink(missing_ok=True)


@app.get("/")
def convert_healthcheck():
    return jsonify({"status": "ok", "service": "convert"}), HTTPStatus.OK.value
