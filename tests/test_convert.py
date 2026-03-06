import unittest

from api.convert import app
from contracts.convert_contract import CONVERT_ERROR_CODES, RESPONSE_REQUIRED_FIELDS


class ConvertEndpointTests(unittest.TestCase):
    def setUp(self) -> None:
        self.client = app.test_client()
        self.valid_request = {
            "fileKey": "uploads/example.docx",
            "originalFilename": "example.docx",
            "sizeBytes": 1234,
            "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "idempotencyKey": "req-12345",
        }

    def test_healthcheck_returns_ok(self) -> None:
        response = self.client.get("/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["status"], "ok")
        self.assertEqual(response.json["service"], "convert")

    def test_missing_required_fields_returns_validation_error(self) -> None:
        payload = {
            "fileKey": "uploads/example.docx",
            "originalFilename": "example.docx",
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

    def test_stub_returns_not_implemented_for_valid_contract_payload(self) -> None:
        response = self.client.post("/", json=self.valid_request)

        self.assertEqual(response.status_code, 501)
        self.assertEqual(set(response.json.keys()), set(RESPONSE_REQUIRED_FIELDS))
        self.assertEqual(response.json["errorCode"], None)
        self.assertEqual(response.json["timings"], {"totalMs": 0})
        self.assertEqual(response.json["detectedFormat"], "unknown")

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
