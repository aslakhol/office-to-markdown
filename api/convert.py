"""Stub conversion endpoint for Vercel Python runtime.

This intentionally returns placeholder data until conversion logic is implemented.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from http import HTTPStatus
from typing import Any

from flask import Flask, Request, jsonify, request

from contracts.convert_contract import (
    REQUEST_PROHIBITED_BYTE_FIELDS,
    REQUEST_REQUIRED_FIELDS,
    ConvertErrorCode,
    is_convert_error_code,
)

app = Flask(__name__)


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


@app.post("/")
def convert_stub():
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

    response = ConvertResponse(
        markdown="",
        inputFormat="unknown",
        detectedFormat="unknown",
        warnings=["Conversion engine not implemented yet."],
        timings={"totalMs": 0},
        errorCode=None,
    )
    return jsonify(asdict(response)), HTTPStatus.NOT_IMPLEMENTED.value


@app.get("/")
def convert_healthcheck():
    return jsonify({"status": "ok", "service": "convert"}), HTTPStatus.OK.value
