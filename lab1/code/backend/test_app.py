import unittest

from fastapi.testclient import TestClient

from backend.app import app


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app, base_url="http://127.0.0.1:8000")

    def test_products_and_mock_offers(self):
        self.assertEqual(self.client.get("/api/products").json()["source"], "mock")
        response = self.client.get("/api/offers")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["source"], "mock")
        self.assertEqual(len(response.json()["offers"]), 2)

    def test_rejects_non_local_origin_and_host(self):
        self.assertEqual(self.client.get("/api/offers", headers={"Origin": "https://example.com"}).status_code, 403)
        self.assertEqual(self.client.get("/api/offers", headers={"Host": "example.com"}).status_code, 403)


if __name__ == "__main__":
    unittest.main()
