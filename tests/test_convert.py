import json
import unittest
from pathlib import Path
from unittest.mock import patch

from api.convert import app
from contracts.convert_contract import CONVERT_ERROR_CODES, RESPONSE_REQUIRED_FIELDS


class ConvertEndpointTests(unittest.TestCase):
    fixture_root = Path(__file__).resolve().parent / "fixtures" / "smoke"
    expected_markdown = json.loads(
        (fixture_root / "expected-markdown.json").read_text(encoding="utf-8")
    )

    def setUp(self) -> None:
        app.config["LOCAL_FIXTURE_ROOT"] = str(self.fixture_root)
        self.client = app.test_client()
        self.valid_request = {
            "fileKey": "fixture://sample.docx",
            "originalFilename": "sample.docx",
            "sizeBytes": 1234,
            "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "idempotencyKey": "req-12345",
        }

    def tearDown(self) -> None:
        app.config.pop("LOCAL_FIXTURE_ROOT", None)

    def test_healthcheck_returns_ok(self) -> None:
        response = self.client.get("/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["status"], "ok")
        self.assertEqual(response.json["service"], "convert")

    def test_missing_required_fields_returns_validation_error(self) -> None:
        payload = {
            "fileKey": "fixture://sample.docx",
            "originalFilename": "sample.docx",
        }
        response = self.client.post("/", json=payload)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json["errorCode"], "invalid_file")
        self.assertIn("sizeBytes", response.json["message"])
        self.assertIn("idempotencyKey", response.json["message"])

    def test_payload_with_file_bytes_is_rejected(self) -> None:
        payload = dict(self.valid_request)
        payload["fileBase64"] = "ZmFrZQ=="
        response = self.client.post("/", json=payload)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json["errorCode"], "invalid_file")
        self.assertIn("must not include file bytes", response.json["message"])
        self.assertIn("fileBase64", response.json["message"])

    def test_unexpected_fields_are_rejected(self) -> None:
        payload = dict(self.valid_request)
        payload["extraField"] = "not-allowed"
        response = self.client.post("/", json=payload)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json["errorCode"], "invalid_file")
        self.assertIn("Unexpected field(s)", response.json["message"])
        self.assertIn("extraField", response.json["message"])

    def test_invalid_size_bytes_type_is_rejected(self) -> None:
        payload = dict(self.valid_request)
        payload["sizeBytes"] = "1234"
        response = self.client.post("/", json=payload)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json["errorCode"], "invalid_file")
        self.assertIn("sizeBytes", response.json["message"])

    def test_supported_fixture_formats_convert_successfully(self) -> None:
        cases = [
            (
                "fixture://sample.docx",
                "sample.docx",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "docx",
            ),
            (
                "fixture://sample.pptx",
                "sample.pptx",
                "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                "pptx",
            ),
            (
                "fixture://sample.xlsx",
                "sample.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "xlsx",
            ),
            (
                "fixture://sample.pdf",
                "sample.pdf",
                "application/pdf",
                "pdf",
            ),
        ]

        for file_key, original_filename, mime_type, expected_format in cases:
            with self.subTest(file_key=file_key):
                response = self.client.post(
                    "/",
                    json={
                        "fileKey": file_key,
                        "originalFilename": original_filename,
                        "sizeBytes": 2048,
                        "mimeType": mime_type,
                        "idempotencyKey": f"req-{expected_format}",
                    },
                )

                self.assertEqual(response.status_code, 200)
                self.assertEqual(set(response.json.keys()), set(RESPONSE_REQUIRED_FIELDS))
                self.assertEqual(response.json["errorCode"], None)
                self.assertEqual(response.json["inputFormat"], expected_format)
                self.assertEqual(response.json["detectedFormat"], expected_format)
                self.assertEqual(
                    response.json["markdown"],
                    self.expected_markdown[original_filename],
                )
                self.assertIn("downloadMs", response.json["timings"])
                self.assertIn("convertMs", response.json["timings"])
                self.assertIn("totalMs", response.json["timings"])

    def test_missing_fixture_returns_storage_error(self) -> None:
        payload = dict(self.valid_request)
        payload["fileKey"] = "fixture://missing.docx"
        payload["originalFilename"] = "missing.docx"
        response = self.client.post("/", json=payload)

        self.assertEqual(response.status_code, 502)
        self.assertEqual(response.json["errorCode"], "storage_read_failed")
        self.assertIn("Fixture not found", response.json["message"])

    def test_broken_docx_returns_conversion_failed(self) -> None:
        payload = dict(self.valid_request)
        payload["fileKey"] = "fixture://broken.docx"
        payload["originalFilename"] = "broken.docx"
        response = self.client.post("/", json=payload)

        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.json["errorCode"], "conversion_failed")
        self.assertIn("MarkItDown conversion failed", response.json["message"])

    def test_unsupported_format_returns_typed_error(self) -> None:
        payload = dict(self.valid_request)
        payload["originalFilename"] = "sample.txt"
        payload["mimeType"] = "text/plain"
        response = self.client.post("/", json=payload)

        self.assertEqual(response.status_code, 415)
        self.assertEqual(response.json["errorCode"], "unsupported_format")

    def test_missing_dependency_returns_typed_error(self) -> None:
        with patch("api.convert._get_markitdown_converter", side_effect=RuntimeError("missing package")):
            response = self.client.post("/", json=self.valid_request)

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json["errorCode"], "missing_dependency")
        self.assertIn("missing package", response.json["message"])

    def test_error_codes_match_contract_categories(self) -> None:
        self.assertEqual(
            set(CONVERT_ERROR_CODES),
            {
                "unsupported_format",
                "missing_dependency",
                "payload_too_large",
                "conversion_failed",
                "storage_read_failed",
                "timeout",
                "rate_limited",
                "invalid_file",
            },
        )


if __name__ == "__main__":
    unittest.main()
