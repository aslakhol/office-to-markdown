"""Stub conversion endpoint for Vercel Python runtime.

This intentionally returns placeholder data until conversion logic is implemented.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from http import HTTPStatus
from typing import Any

from flask import Flask, Request, jsonify, request

app = Flask(__name__)

FORBIDDEN_BYTE_FIELDS = (
    "fileBytes",
    "fileBase64",
    "fileData",
    "fileContent",
    "rawFile",
)


@dataclass(slots=True)
class ApiError:
    errorCode: str
    message: str


@dataclass(slots=True)
class ConvertResponse:
    markdown: str
    inputFormat: str
    detectedFormat: str
    warnings: list[str]
    timings: dict[str, int]
    errorCode: str | None


def _json_error(error_code: str, message: str, status: HTTPStatus):
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
    forbidden_fields = [field for field in FORBIDDEN_BYTE_FIELDS if field in payload]
    if forbidden_fields:
        fields = ", ".join(forbidden_fields)
        return f"Request payload must not include file bytes. Remove fields: {fields}"
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

    file_key = payload.get("fileKey")
    if not isinstance(file_key, str) or not file_key.strip():
        return _json_error(
            "invalid_file", "Missing required field: fileKey", HTTPStatus.BAD_REQUEST
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
