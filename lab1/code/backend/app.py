from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlparse

from fastapi import FastAPI, Request

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


@app.get("/api/offers")
async def offers() -> dict[str, Any]:
    return {"source": "mock", "updatedAt": datetime.now(timezone.utc).isoformat(), "offers": MOCK_OFFERS}
