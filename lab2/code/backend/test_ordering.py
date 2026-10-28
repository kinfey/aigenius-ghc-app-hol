import json
import os
import time
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

from backend.ordering import create_order_router, decode_result, menu_records, ProviderError, validate_rounds


FIXTURES = {
    "delivery-query-addresses": {"addresses": [{"addressId": "test-address", "contactName": "测试", "fullAddress": "测试地址", "phone": "测试号码"}]},
    "delivery-query-stores": {"stores": [{"storeCode": "100", "beCode": "test-be", "storeName": "测试门店"}]},
    "query-nearby-stores": {"stores": [{"storeCode": "100", "storeName": "测试门店"}]},
    "query-meals": {"categories": [{"name": "分类", "meals": [{"code": "meal1", "tags": ["测试标签"]}]}], "meals": {"meal1": {"name": "测试餐品", "currentPrice": "28", "originalPrice": "28"}}},
    "query-meal-detail": {"code": "meal1", "name": "测试餐品", "supportModify": False},
    "query-store-coupons": {"coupons": []},
    "calculate-price": {"totalPrice": 2800, "takeWayList": [{"code": "takeout", "name": "外带"}]},
    "create-order": {"orderId": "test-order", "payUrl": "https://m.mcd.cn/test-only"},
    "query-order": {"orderId": "test-order", "orderStatus": "待支付"},
}


class OrderingTests(unittest.TestCase):
    def setUp(self):
        app = FastAPI()
        self.router = create_order_router(lambda token: {})
        app.include_router(self.router)
        self.client = TestClient(app, base_url="http://127.0.0.1:5173")
        self.client.headers.update({"Origin": "http://127.0.0.1:5173", "X-Ordering-Intent": "user-action"})
        self.calls = []

        async def execute(name=None, args=None):
            self.calls.append((name, args))
            if name is None:
                return {tool: {} for tool in FIXTURES}
            return {"success": True, "data": FIXTURES[name]}

        self.router.ordering_client.execute = AsyncMock(side_effect=execute)
        self.client.get("/api/ordering/session")

    def action(self, action, **payload):
        return self.client.post("/api/ordering/action", json={"action": action, "payload": payload})

    def prepare(self, method=2):
        self.assertEqual(self.action("connect").status_code, 200)
        self.action("method", method=method).raise_for_status()
        if method == 2:
            self.action("addresses").raise_for_status()
            self.action("stores", addressId="test-address").raise_for_status()
        else:
            self.action("stores", searchType=1).raise_for_status()
        self.action("select-store", storeCode="100").raise_for_status()
        self.action("detail", productCode="meal1").raise_for_status()
        self.action("items", items=[{"productCode": "meal1", "quantity": 1}]).raise_for_status()
        response = self.action("quote", needTableware=True, remark="测试备注")
        response.raise_for_status()
        return response.json()["quoteId"]

    def test_delivery_real_quote_and_single_use_confirmation(self):
        quote_id = self.prepare()
        self.assertEqual(self.action("create", quoteId=quote_id).status_code, 409)
        self.assertFalse(any(name == "create-order" for name, _ in self.calls))
        created = self.action("create", quoteId=quote_id, confirmation="确认创建真实订单")
        self.assertEqual(created.status_code, 200)
        args = next(args for name, args in self.calls if name == "create-order")
        self.assertEqual(args["addressId"], "test-address")
        self.assertEqual(args["beCode"], "test-be")
        self.assertEqual(args["remark"], "测试备注")
        self.assertTrue(args["needTableware"])
        self.assertNotIn("takeWayCode", args)
        self.assertEqual(self.action("create", quoteId=quote_id, confirmation="确认创建真实订单").status_code, 409)
        self.assertEqual(sum(name == "create-order" for name, _ in self.calls), 1)
        self.assertEqual(self.action("status").json()["order"]["data"]["orderStatus"], "待支付")

    def test_pickup_omits_delivery_context_and_requires_provider_takeway(self):
        quote_id = self.prepare(method=1)
        for name, args in self.calls:
            if args and name not in ("query-order",):
                self.assertNotIn("beCode", args)
                self.assertNotIn("addressId", args)
        self.assertEqual(self.action("create", quoteId=quote_id, confirmation="确认创建真实订单", takeWayCode="invented").status_code, 422)
        response = self.action("create", quoteId=quote_id, confirmation="确认创建真实订单", takeWayCode="takeout")
        self.assertEqual(response.status_code, 200)
        args = next(args for name, args in self.calls if name == "create-order")
        self.assertEqual(args["takeWayCode"], "takeout")
        self.assertNotIn("remark", args)

    def test_edits_invalidate_quote_and_expired_quote_cannot_create(self):
        quote_id = self.prepare()
        self.action("edit", step=4).raise_for_status()
        self.assertEqual(self.action("create", quoteId=quote_id, confirmation="确认创建真实订单").status_code, 409)
        quote_id = self.action("quote", needTableware=False).json()["quoteId"]
        later = time.monotonic() + 301
        with patch("backend.ordering.time.monotonic", return_value=later):
            response = self.action("create", quoteId=quote_id, confirmation="确认创建真实订单")
        self.assertEqual(response.status_code, 409)
        self.assertFalse(any(name == "create-order" for name, _ in self.calls))

    def test_uncertain_submission_cannot_retry_even_after_reload(self):
        quote_id = self.prepare()
        original = self.router.ordering_client.execute.side_effect

        async def execute(name=None, args=None):
            if name == "create-order":
                raise HTTPException(502, "Timeout")
            return await original(name, args)

        self.router.ordering_client.execute.side_effect = execute
        self.assertEqual(self.action("create", quoteId=quote_id, confirmation="确认创建真实订单").status_code, 502)
        self.assertEqual(self.client.get("/api/ordering/session").json()["attempt"], "unknown")
        self.assertEqual(self.action("create", quoteId=quote_id, confirmation="确认创建真实订单").status_code, 409)
        self.assertEqual(self.action("method", method=2).status_code, 409)
        self.assertEqual(self.action("status").status_code, 409)

    def test_context_and_items_cannot_be_forged(self):
        self.action("connect").raise_for_status()
        self.assertEqual(self.action("select-store", storeCode="invented").status_code, 422)
        self.assertEqual(self.action("method", method=True).status_code, 409)
        self.prepare()
        self.assertEqual(self.action("items", items=[{"productCode": "unknown", "quantity": 1}]).status_code, 422)
        self.assertEqual(self.action("items", items=[{"productCode": "meal1", "quantity": 0}]).status_code, 409)
        self.assertEqual(self.action("items", items=[{"productCode": "meal1", "quantity": True}]).status_code, 409)

    def test_origin_header_and_cookie_isolation(self):
        response = self.client.post("/api/ordering/action", headers={"Origin": "https://untrusted.test"}, json={"action": "connect"})
        self.assertEqual(response.status_code, 403)
        self.prepare()
        other = TestClient(self.client.app, base_url="http://127.0.0.1:5173")
        state = other.get("/api/ordering/session")
        self.assertIsNone(state.json()["address"])
        self.assertFalse(state.json()["connected"])
        self.assertIn("HttpOnly", state.headers["set-cookie"])
        self.assertEqual(state.headers["cache-control"], "no-store")

    def test_result_and_menu_parsing_do_not_accept_provider_failures(self):
        result = SimpleNamespace(isError=False, structuredContent=None, content=[SimpleNamespace(type="text", text=json.dumps({"success": False, "data": []}))])
        with self.assertRaises(ProviderError):
            decode_result(result)
        result.content[0].text = "unstructured provider response"
        with self.assertRaises(ProviderError):
            decode_result(result)
        menu = menu_records(FIXTURES["query-meals"])
        self.assertEqual([item["productCode"] for item in menu], ["meal1"])
        self.assertEqual(menu[0]["currentPrice"], "28")
        self.assertEqual(menu[0]["categories"], ["分类"])
        self.assertEqual(menu[0]["tags"], ["测试标签"])
        duplicated = {
            "categories": [{"name": "A", "meals": [{"code": "meal1"}]}, {"name": "B", "meals": [{"code": "meal1"}]}],
            "meals": {"meal1": {"name": "测试餐品", "currentPrice": "28"}},
        }
        self.assertEqual(menu_records(duplicated)[0]["categories"], ["A", "B"])
        self.assertEqual(len(menu_records(duplicated)), 1)
        with self.assertRaises(HTTPException):
            menu_records({"categories": [{"meals": [{"code": "missing"}]}], "meals": {}})

    def test_combo_selection_requires_valid_codes_and_counts(self):
        detail = {"rounds": [{"round": "1", "choices": [{"code": "a", "name": "测试", "isDefault": 1}]}]}
        valid = [{"round": "1", "comboItemList": [{"code": "a", "quantity": 1}]}]
        self.assertEqual(validate_rounds(detail, valid), valid)
        with self.assertRaises(HTTPException):
            validate_rounds(detail, [{"round": "1", "comboItemList": [{"code": "invented", "quantity": 1}]}])
        with self.assertRaises(HTTPException):
            validate_rounds(detail, [])


if __name__ == "__main__":
    unittest.main()
