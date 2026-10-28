import logging
import json
import os
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlparse

import httpx
from fastapi import FastAPI, HTTPException, Request
from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client
from mcp.shared.exceptions import McpError
from backend.ordering import create_order_router

logger = logging.getLogger("ordering-workshop")
app = FastAPI(title="Ordering Workshop API")

PRODUCTS = [
    {"id": "burger", "name": "经典牛肉堡", "description": "香煎牛肉、芝士与新鲜生菜", "price": 28, "icon": "🍔", "category": "汉堡", "tag": "人气推荐"},
    {"id": "chicken", "name": "脆鸡腿堡", "description": "酥脆鸡腿肉，搭配清爽蔬菜", "price": 26, "icon": "🥪", "category": "汉堡", "tag": "经典美味"},
    {"id": "fries", "name": "金黄薯条", "description": "外酥里嫩，现做热享", "price": 12, "icon": "🍟", "category": "小食", "tag": "人气小食"},
    {"id": "drink", "name": "清爽气泡饮", "description": "冰爽气泡，畅快一整天", "price": 10, "icon": "🥤", "category": "饮品", "tag": "清爽之选"},
    {"id": "coffee", "name": "醇香拿铁", "description": "浓缩咖啡与绵密奶香", "price": 18, "icon": "☕", "category": "饮品", "tag": "暖心好饮"},
    {"id": "sundae", "name": "香草冰淇淋", "description": "细腻香草口味，甜蜜收尾", "price": 11, "icon": "🍦", "category": "甜品", "tag": "甜蜜时刻"},
]

MOCK_OFFERS = [
    {"title": "工作坊模拟优惠", "description": "示例：满 50 元减 5 元", "conditions": "仅供界面演示，不可用于真实消费"},
    {"title": "午间组合示例", "description": "示例：套餐搭配优惠", "conditions": "模拟数据，不代表实际活动"},
]


@app.middleware("http")
async def local_only(request: Request, call_next):
    host = request.headers.get("host", "").split(":")[0]
    origin = request.headers.get("origin")
    if host not in {"127.0.0.1", "localhost"} or (
        origin and (urlparse(origin).scheme != "http" or urlparse(origin).netloc not in {"127.0.0.1:5173", "localhost:5173"})
    ):
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=403, content={"detail": "Only local workshop access is allowed."})
    return await call_next(request)


@app.get("/api/products")
async def products() -> dict[str, Any]:
    return {"products": PRODUCTS, "source": "mock"}


def mcp_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


ordering_router = create_order_router(mcp_headers)
app.include_router(ordering_router)


def check_provider_result(value: Any) -> None:
    if isinstance(value, dict) and value.get("success") is False:
        raise ValueError("The provider rejected the coupon request.")


async def live_coupons(token: str) -> list[str]:
    async with httpx.AsyncClient(headers=mcp_headers(token), timeout=15, follow_redirects=False) as http:
        async with streamable_http_client("https://mcp.mcd.cn", http_client=http) as (read, write, _):
            async with ClientSession(read, write) as session:
                await session.initialize()
                tools = await session.list_tools()
                tool = next((item for item in tools.tools if item.name == "available-coupons"), None)
                if tool is None:
                    raise ValueError("The provider does not advertise available-coupons.")
                if tool.inputSchema.get("required"):
                    raise ValueError("The provider requires additional inputs; inspect the current tool schema.")
                result = await session.call_tool("available-coupons", arguments={})
                if result.isError:
                    raise ValueError("The provider rejected the coupon request.")
                if result.structuredContent is not None:
                    check_provider_result(result.structuredContent)
                    return [json.dumps(result.structuredContent, ensure_ascii=False, indent=2)]
                text = [item.text for item in result.content if item.type == "text"]
                if result.content and not text:
                    raise ValueError("The provider returned an unsupported content type.")
                for item in text:
                    try:
                        content = json.loads(item)
                    except json.JSONDecodeError:
                        continue
                    check_provider_result(content)
                return text


def upstream_status(exc: BaseException) -> int | None:
    if isinstance(exc, httpx.HTTPStatusError):
        return exc.response.status_code
    if isinstance(exc, BaseExceptionGroup):
        return next((status for child in exc.exceptions if (status := upstream_status(child)) is not None), None)
    return None


@app.get("/api/offers")
async def offers() -> dict[str, Any]:
    mode = os.getenv("OFFERS_MODE", "mock")
    if mode == "mock":
        return {"source": "mock", "updatedAt": datetime.now(timezone.utc).isoformat(), "offers": MOCK_OFFERS}
    if mode != "live":
        raise HTTPException(status_code=500, detail="Invalid OFFERS_MODE. Use mock or live.")
    token = os.getenv("MCD_MCP_TOKEN")
    if not token:
        raise HTTPException(status_code=503, detail="Live mode requires MCD_MCP_TOKEN on the server.")
    try:
        content = await live_coupons(token)
    except (httpx.HTTPError, ValueError, McpError, ExceptionGroup, TimeoutError) as exc:
        logger.warning("Read-only MCP coupon request failed: %s", type(exc).__name__)
        status = upstream_status(exc)
        detail = f"MCP server returned HTTP {status}." if status else "MCP coupon request failed."
        raise HTTPException(status_code=502, detail=f"{detail} Check your token, service availability, and tool schema.") from exc
    return {"source": "mcp", "updatedAt": datetime.now(timezone.utc).isoformat(), "offers": [], "providerText": content}
