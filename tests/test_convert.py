import unittest

from api.convert import app


class ConvertEndpointTests(unittest.TestCase):
    def setUp(self) -> None:
        self.client = app.test_client()

    def test_healthcheck_returns_ok(self) -> None:
        response = self.client.get("/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["status"], "ok")
        self.assertEqual(response.json["service"], "convert")

    def test_missing_file_key_returns_validation_error(self) -> None:
        response = self.client.post("/", json={})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json["errorCode"], "invalid_file")
        self.assertIn("fileKey", response.json["message"])

    def test_payload_with_file_bytes_is_rejected(self) -> None:
        response = self.client.post(
            "/",
            json={"fileKey": "uploads/example.docx", "fileBase64": "ZmFrZQ=="},
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json["errorCode"], "invalid_file")
        self.assertIn("must not include file bytes", response.json["message"])
        self.assertIn("fileBase64", response.json["message"])

    def test_stub_returns_not_implemented_for_valid_payload(self) -> None:
        response = self.client.post("/", json={"fileKey": "uploads/example.docx"})

        self.assertEqual(response.status_code, 501)
        self.assertEqual(response.json["errorCode"], None)
        self.assertEqual(response.json["timings"], {"totalMs": 0})
        self.assertEqual(response.json["detectedFormat"], "unknown")


if __name__ == "__main__":
    unittest.main()
