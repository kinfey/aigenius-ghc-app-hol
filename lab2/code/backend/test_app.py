import os
import unittest
from unittest.mock import AsyncMock, patch

import httpx
from fastapi.testclient import TestClient

from backend.app import app, check_provider_result, mcp_headers


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app, base_url="http://127.0.0.1:8000")

    def test_products_and_mock_offers(self):
        with patch.dict(os.environ, {"OFFERS_MODE": "mock"}, clear=True):
            self.assertEqual(self.client.get("/api/products").json()["source"], "mock")
            response = self.client.get("/api/offers")
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()["source"], "mock")
            self.assertEqual(len(response.json()["offers"]), 2)

    def test_live_requires_token(self):
        with patch.dict(os.environ, {"OFFERS_MODE": "live"}, clear=True):
            self.assertEqual(self.client.get("/api/offers").status_code, 503)

    def test_mcp_authorization_uses_documented_bearer_format(self):
        self.assertEqual(mcp_headers("test-token"), {"Authorization": "Bearer test-token"})

    def test_provider_business_error_is_not_treated_as_success(self):
        with self.assertRaises(ValueError):
            check_provider_result({"success": False, "message": "private"})
        check_provider_result({"success": True, "data": []})

    def test_live_returns_provider_data_without_mock_fallback(self):
        with patch.dict(os.environ, {"OFFERS_MODE": "live", "MCD_MCP_TOKEN": "test-token"}, clear=True):
            with patch("backend.app.live_coupons", new_callable=AsyncMock, return_value=["provider result"]) as call:
                data = self.client.get("/api/offers").json()
            call.assert_awaited_once_with("test-token")
            self.assertEqual(data["source"], "mcp")
            self.assertEqual(data["offers"], [])
            self.assertEqual(data["providerText"], ["provider result"])

    def test_live_error_is_explicit(self):
        with patch.dict(os.environ, {"OFFERS_MODE": "live", "MCD_MCP_TOKEN": "test-token"}, clear=True):
            with patch("backend.app.live_coupons", new_callable=AsyncMock, side_effect=ValueError("private")):
                response = self.client.get("/api/offers")
            self.assertEqual(response.status_code, 502)
            self.assertNotIn("private", response.text)

    def test_upstream_http_status_is_reported_without_body(self):
        request = httpx.Request("POST", "https://example.test")
        response = httpx.Response(403, request=request, text="private data")
        error = ExceptionGroup("MCP failure", [httpx.HTTPStatusError("forbidden", request=request, response=response)])
        with patch.dict(os.environ, {"OFFERS_MODE": "live", "MCD_MCP_TOKEN": "test-token"}, clear=True):
            with patch("backend.app.live_coupons", new_callable=AsyncMock, side_effect=error):
                result = self.client.get("/api/offers")
        self.assertEqual(result.status_code, 502)
        self.assertIn("HTTP 403", result.text)
        self.assertNotIn("private data", result.text)

    def test_rejects_non_local_origin_and_host(self):
        self.assertEqual(self.client.get("/api/offers", headers={"Origin": "https://example.com"}).status_code, 403)
        self.assertEqual(self.client.get("/api/offers", headers={"Host": "example.com"}).status_code, 403)


if __name__ == "__main__":
    unittest.main()
