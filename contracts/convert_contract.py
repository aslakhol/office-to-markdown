"""Canonical conversion API contract shared by UI and API code."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any, Final, Literal, TypeGuard, get_args

ConvertErrorCode = Literal[
    "unsupported_format",
    "missing_dependency",
    "payload_too_large",
    "conversion_failed",
    "storage_read_failed",
    "timeout",
    "rate_limited",
    "invalid_file",
]

_CONTRACT_PATH = Path(__file__).with_name("convert_contract.json")
_EXPECTED_ERROR_CODES: Final = set(get_args(ConvertErrorCode))


@lru_cache(maxsize=1)
def _load_contract() -> dict[str, Any]:
    return json.loads(_CONTRACT_PATH.read_text(encoding="utf-8"))


CONVERT_CONTRACT = _load_contract()
REQUEST_REQUIRED_FIELDS = tuple(CONVERT_CONTRACT["request"]["requiredFields"])
REQUEST_PROHIBITED_BYTE_FIELDS = tuple(CONVERT_CONTRACT["request"]["prohibitedByteFields"])
RESPONSE_REQUIRED_FIELDS = tuple(CONVERT_CONTRACT["response"]["requiredFields"])
CONVERT_ERROR_CODES = tuple(CONVERT_CONTRACT["errorCodes"])


if set(CONVERT_ERROR_CODES) != _EXPECTED_ERROR_CODES:
    raise RuntimeError(
        "convert_contract.json errorCodes are out of sync with ConvertErrorCode."
    )


def is_convert_error_code(value: str) -> TypeGuard[ConvertErrorCode]:
    return value in _EXPECTED_ERROR_CODES
