import asyncio
import json
import logging
import os
import secrets
import time
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException, Request, Response
from jsonschema import Draft202012Validator
from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client
from mcp.shared.exceptions import McpError
from pydantic import BaseModel, ConfigDict, Field

logger = logging.getLogger("ordering-workshop")
TOOLS = {
    "query-nearby-stores", "delivery-query-addresses", "delivery-query-stores",
    "query-meals", "query-meal-detail", "query-store-coupons", "calculate-price",
    "create-order", "query-order",
}


class ProviderError(Exception):
    pass


def decode_result(result: Any) -> dict[str, Any]:
    if result.isError:
        raise ProviderError("MCP 工具返回错误。")
    values = [result.structuredContent] if result.structuredContent is not None else []
    for item in result.content:
        if item.type == "text":
            try:
                values.append(json.loads(item.text))
            except json.JSONDecodeError:
                continue
    for value in values:
        if isinstance(value, dict) and "success" in value:
            if value["success"] is not True:
                raise ProviderError("服务方未接受本次请求；请检查所选门店、餐品、地址和账号权限。")
            return value
    raise ProviderError("服务方返回了未支持的数据格式，已停止流程，不会使用模拟结果。")


class McdClient:
    def __init__(self, headers: Callable[[str], dict[str, str]]):
        self.headers = headers

    async def execute(self, name: str | None = None, arguments: dict | None = None) -> Any:
        token = os.getenv("MCD_MCP_TOKEN", "").strip()
        if not token:
            raise HTTPException(503, "请在服务器本地配置 MCD_MCP_TOKEN；不要在网页或对话中填写 Token。")
        if name is not None and name not in TOOLS:
            raise HTTPException(403, "此工具不在点餐允许列表中。")
        try:
            async with asyncio.timeout(45):
                async with httpx.AsyncClient(headers=self.headers(token), timeout=30, follow_redirects=False) as http:
                    async with streamable_http_client("https://mcp.mcd.cn", http_client=http) as (read, write, _):
                        async with ClientSession(read, write) as session:
                            await session.initialize()
                            tools = {}
                            cursor = None
                            for _ in range(20):
                                page = await session.list_tools(cursor=cursor)
                                tools.update({tool.name: tool for tool in page.tools if tool.name in TOOLS})
                                cursor = page.nextCursor
                                if not cursor:
                                    break
                            else:
                                raise ProviderError("MCP 工具列表分页过多，已停止。")
                            if name is None:
                                return {key: tool.inputSchema for key, tool in tools.items()}
                            if name not in tools:
                                raise ProviderError("服务方没有公布当前步骤需要的 MCP 工具。")
                            schema = tools[name].inputSchema
                            properties = schema.get("properties", {})
                            if any(key not in properties for key in arguments or {}):
                                raise ProviderError("工具参数已变化；请重新连接并检查当前 schema。")
                            if not Draft202012Validator(schema).is_valid(arguments or {}):
                                raise ProviderError("参数不符合服务方当前 schema，已停止调用。")
                            return decode_result(await session.call_tool(name, arguments=arguments or {}))
        except (httpx.HTTPError, McpError, ExceptionGroup, TimeoutError, ProviderError) as exc:
            logger.warning("Ordering MCP request failed (%s): %s", name or "tools/list", type(exc).__name__)
            raise HTTPException(502, "MCP 请求失败。请检查服务端凭据、服务可用性和当前参数；不会回退为模拟数据。") from exc


def records(value: Any, key: str) -> list[dict]:
    found = []
    if isinstance(value, dict):
        if key in value and isinstance(value[key], (str, int)) and not isinstance(value[key], bool):
            found.append(value)
        else:
            for child in value.values():
                found.extend(records(child, key))
    elif isinstance(value, list):
        for child in value:
            found.extend(records(child, key))
    unique = {}
    for item in found:
        unique[str(item[key])] = item
    return list(unique.values())


def menu_records(value: Any) -> list[dict]:
    if isinstance(value, dict) and isinstance(value.get("meals"), dict):
        require(isinstance(value.get("categories"), list), "菜单缺少分类，无法确认当前在售餐品。")
        meals = value["meals"]
        normalized = {}
        for category in value["categories"]:
            require(isinstance(category, dict) and isinstance(category.get("meals"), list), "菜单分类结构已变化。")
            for entry in category["meals"]:
                require(isinstance(entry, dict) and isinstance(entry.get("code"), (str, int)), "菜单餐品编码无效。")
                code = str(entry["code"])
                meal = meals.get(code)
                require(isinstance(meal, dict) and isinstance(meal.get("name"), str) and bool(meal["name"]), "菜单编码未匹配到餐品详情，不能继续。")
                if code not in normalized:
                    normalized[code] = {**meal, "productCode": code, "categories": [], "tags": []}
                if isinstance(category.get("name"), str) and category["name"] not in normalized[code]["categories"]:
                    normalized[code]["categories"].append(category["name"])
                tags = entry.get("tags", [])
                if isinstance(tags, list):
                    normalized[code]["tags"].extend(tag for tag in tags if isinstance(tag, str) and tag not in normalized[code]["tags"])
        return list(normalized.values())
    if isinstance(value, list):
        return [item for child in value for item in menu_records(child)]
    if not isinstance(value, dict):
        return []
    # A category can also have a code; only named, leaf menu entries are selectable.
    children = [item for child in value.values() if isinstance(child, (dict, list)) for item in menu_records(child)]
    if children:
        return children
    code = value.get("productCode", value.get("code"))
    name = value.get("productName", value.get("name"))
    if isinstance(code, (str, int)) and isinstance(name, str) and name:
        return [{**value, "productCode": str(code), "name": name}]
    return []


def provider_data(value: dict) -> Any:
    if "data" not in value:
        raise HTTPException(502, "服务方响应缺少 data，无法继续。")
    return value["data"]


def select_record(items: list[dict], key: str, selected: Any) -> dict:
    match = next((item for item in items if str(item.get(key)) == str(selected)), None)
    if match is None:
        raise HTTPException(422, "请选择当前查询结果中的有效选项。")
    return match


def require(condition: bool, message: str):
    if not condition:
        raise HTTPException(409, message)


@dataclass
class OrderingSession:
    touched: float = field(default_factory=time.monotonic)
    lock: asyncio.Lock = field(default_factory=asyncio.Lock)
    method: int = 2
    connected: bool = False
    addresses: list = field(default_factory=list)
    address: dict | None = None
    stores: list = field(default_factory=list)
    store: dict | None = None
    menu: list = field(default_factory=list)
    details: dict = field(default_factory=dict)
    coupons: list = field(default_factory=list)
    coupon_data: Any = None
    items: list = field(default_factory=list)
    quote: dict | None = None
    quote_id: str | None = None
    quote_time: float = 0
    order_arguments: dict | None = None
    attempt: str = "none"
    order: dict | None = None
    order_id: str | None = None
    schemas: dict = field(default_factory=dict)
    step: int = 0
    tableware: bool = False
    remark: str = ""

    def view(self):
        return {
            "source": "mcp", "connected": self.connected, "method": self.method,
            "addresses": self.addresses, "address": self.address, "stores": self.stores,
            "store": self.store, "menu": self.menu, "details": self.details,
            "coupons": self.coupons, "couponData": self.coupon_data, "items": self.items,
            "quote": self.quote, "quoteId": self.quote_id, "attempt": self.attempt,
            "order": self.order, "orderId": self.order_id, "step": self.step,
            "credentialsConfigured": bool(os.getenv("MCD_MCP_TOKEN", "").strip()),
            "tools": sorted(self.schemas),
            "needTableware": self.tableware, "remark": self.remark,
        }

    def invalidate_quote(self):
        self.quote = None
        self.quote_id = None
        self.order_arguments = None

    def context(self):
        require(self.store is not None, "请先选择门店。")
        args = {"storeCode": str(self.store["storeCode"]), "beType": self.method, "orderType": 1 if self.method == 1 else 2}
        if self.method == 2:
            require(bool(self.store.get("beCode")), "配送门店缺少 beCode，不能继续。")
            args["beCode"] = str(self.store["beCode"])
        return args


class Action(BaseModel):
    model_config = ConfigDict(extra="forbid")
    action: str
    payload: dict[str, Any] = Field(default_factory=dict)


def create_order_router(headers: Callable[[str], dict[str, str]]) -> APIRouter:
    router = APIRouter(prefix="/api/ordering")
    client = McdClient(headers)
    sessions: dict[str, OrderingSession] = {}

    def session_for(request: Request, response: Response) -> OrderingSession:
        now = time.monotonic()
        for key in list(sessions):
            if now - sessions[key].touched > 7200 and not sessions[key].lock.locked():
                del sessions[key]
        key = request.cookies.get("ordering_session")
        if key not in sessions:
            if len(sessions) >= 100:
                raise HTTPException(503, "本地点餐会话已满，请稍后再试。")
            key = secrets.token_urlsafe(32)
            sessions[key] = OrderingSession()
            response.set_cookie("ordering_session", key, httponly=True, samesite="strict", max_age=7200, path="/api/ordering")
        response.headers["Cache-Control"] = "no-store"
        sessions[key].touched = now
        return sessions[key]

    @router.get("/session")
    async def get_session(request: Request, response: Response):
        return session_for(request, response).view()

    @router.post("/action")
    async def action(body: Action, request: Request, response: Response):
        if request.headers.get("x-ordering-intent") != "user-action" or request.headers.get("origin") not in {"http://127.0.0.1:5173", "http://localhost:5173"}:
            raise HTTPException(403, "只接受本地引导界面的明确操作。")
        state = session_for(request, response)
        async with state.lock:
            await dispatch(state, body.action, body.payload)
            return state.view()

    async def dispatch(s: OrderingSession, action: str, p: dict):
        if action == "connect":
            s.schemas = await client.execute()
            s.connected = True
            return
        require(s.connected, "请先连接并检查 MCP 服务。")
        if action == "status":
            require(bool(s.order_id), "尚未取得订单号；请先在麦当劳 App 核实，不能重复下单。")
            s.order = await client.execute("query-order", {"orderId": s.order_id})
            return
        if action == "create":
            await create(s, p)
            return
        require(s.attempt == "none", "本次下单已发出或结果不确定。请查询状态或前往麦当劳 App 核实；禁止自动重复下单。")
        if action == "method":
            require(type(p.get("method")) is int and p["method"] in (1, 2), "请选择到店自取或麦乐送。")
            s.method = p["method"]
            s.addresses, s.stores, s.menu, s.items, s.coupons = [], [], [], [], []
            s.address = s.store = s.coupon_data = None
            s.details = {}
            s.tableware, s.remark = False, ""
            s.invalidate_quote()
            s.step = 1
        elif action == "edit":
            require(p.get("step") in (3, 4) and s.store is not None, "只能返回有效的餐品或偏好步骤。")
            s.invalidate_quote()
            s.step = p["step"]
        elif action == "addresses":
            require(s.method == 2, "只有配送需要查询地址。")
            data = provider_data(await client.execute("delivery-query-addresses", {}))
            require(isinstance(data, dict) and isinstance(data.get("addresses"), list), "地址响应结构已变化，无法继续。")
            s.addresses = data["addresses"]
            s.step = 1
        elif action == "stores":
            if s.method == 2:
                s.address = select_record(s.addresses, "addressId", p.get("addressId"))
                args = {"beType": 2, "addressId": str(s.address["addressId"])}
                result = await client.execute("delivery-query-stores", args)
            else:
                args = {"beType": 1, "searchType": 1}
                if p.get("searchType") == 2:
                    require(isinstance(p.get("city"), str) and bool(p["city"].strip()) and isinstance(p.get("keyword"), str) and bool(p["keyword"].strip()), "请填写城市与位置关键词。")
                    args = {"beType": 1, "searchType": 2, "city": p["city"].strip(), "keyword": p["keyword"].strip()}
                result = await client.execute("query-nearby-stores", args)
            s.stores = records(provider_data(result), "storeCode")
            s.store = None
            s.menu, s.items, s.coupons = [], [], []
            s.details = {}
            s.coupon_data = None
            s.invalidate_quote()
            s.step = 2
        elif action == "select-store":
            store = select_record(s.stores, "storeCode", p.get("storeCode"))
            if s.method == 2:
                require(bool(store.get("beCode")), "门店缺少配送业务编码，无法选择。")
            s.store = store
            s.menu, s.items, s.coupons = [], [], []
            s.details = {}
            s.coupon_data = None
            s.invalidate_quote()
            s.step = 3
            result = await client.execute("query-meals", s.context())
            s.menu = menu_records(provider_data(result))
            if provider_data(result) and not s.menu:
                raise HTTPException(502, "菜单结构未能识别，请勿使用虚构餐品；需检查服务方返回格式。")
        elif action == "detail":
            product = select_record(s.menu, "productCode", p.get("productCode"))
            code = product["productCode"]
            s.details[code] = provider_data(await client.execute("query-meal-detail", {**s.context(), "code": code}))
        elif action == "items":
            items = p.get("items")
            require(isinstance(items, list) and 0 < len(items) <= 30, "请选择 1 至 30 种餐品。")
            validated = []
            for item in items:
                require(isinstance(item, dict), "餐品格式无效。")
                product = select_record(s.menu, "productCode", item.get("productCode"))
                quantity = item.get("quantity")
                require(type(quantity) is int and 1 <= quantity <= 99, "餐品数量必须为 1 至 99。")
                code = product["productCode"]
                require(code in s.details, "请先查看每个餐品的详情与默认搭配。")
                detail = s.details[code]
                selected = {"productCode": code, "quantity": quantity}
                if "roundList" in item:
                    selected["roundList"] = validate_rounds(detail, item["roundList"])
                elif has_rounds(detail):
                    raise HTTPException(422, "套餐需要逐组确认搭配，不能直接加入。")
                # Custom modifications are never guessed or injected from arbitrary browser JSON.
                if item.get("couponId") is not None:
                    coupon = select_record(s.coupons, "couponId", item["couponId"])
                    require(str(coupon.get("productCode", coupon.get("code"))) == code, "优惠券与餐品不匹配。")
                    selected["couponId"] = str(coupon["couponId"])
                    if coupon.get("couponCode"):
                        selected["couponCode"] = str(coupon["couponCode"])
                validated.append(selected)
            s.items = validated
            s.invalidate_quote()
            s.step = 4
        elif action == "coupons":
            s.coupon_data = provider_data(await client.execute("query-store-coupons", s.context()))
            s.coupons = records(s.coupon_data, "couponId")
        elif action == "quote":
            require(bool(s.items), "请先确认餐品。")
            require(type(p.get("needTableware")) is bool, "请选择是否需要餐具。")
            remark = p.get("remark", "")
            require(isinstance(remark, str) and len(remark) <= 50, "配送备注最多 50 字。")
            args = {**s.context(), "items": s.items, "needTableware": p["needTableware"]}
            s.invalidate_quote()
            s.quote = await client.execute("calculate-price", args)
            data = provider_data(s.quote)
            require(isinstance(data, dict) and has_price(data), "核价响应缺少可识别的金额，不能确认真实下单。")
            s.tableware, s.remark = p["needTableware"], remark if s.method == 2 else ""
            s.order_arguments = dict(args)
            if s.method == 2:
                require(s.address is not None, "请先选择配送地址。")
                s.order_arguments["addressId"] = str(s.address["addressId"])
                if remark:
                    s.order_arguments["remark"] = remark
            s.quote_id = secrets.token_urlsafe(24)
            s.quote_time = time.monotonic()
            s.step = 5
        else:
            raise HTTPException(422, "未支持的操作。")

    async def create(s: OrderingSession, p: dict):
        if s.attempt != "none":
            raise HTTPException(409, "本次确认已使用，禁止重复下单。请查询状态或到麦当劳 App 核实。")
        require(s.quote is not None and bool(s.quote_id) and s.order_arguments is not None, "请先取得实时价格。")
        require(p.get("quoteId") == s.quote_id and p.get("confirmation") == "确认创建真实订单", "必须针对当前核价结果明确确认真实下单。")
        require(time.monotonic() - s.quote_time <= 300, "报价已超过 5 分钟，请重新核价并确认。")
        args = dict(s.order_arguments)
        if s.method == 1:
            data = provider_data(s.quote)
            ways = data.get("takeWayList", []) if isinstance(data, dict) else []
            way = select_record(ways, "code", p.get("takeWayCode"))
            args["takeWayCode"] = str(way["code"])
        s.attempt = "submitting"
        s.step = 6
        try:
            s.order = await client.execute("create-order", args)
            data = provider_data(s.order)
            s.order_id = str(data["orderId"]) if isinstance(data, dict) and data.get("orderId") else None
            s.attempt = "created"
        except (HTTPException, asyncio.CancelledError):
            s.attempt = "unknown"
            logger.warning("Order creation outcome is uncertain; automatic retry disabled")
            raise

    router.ordering_client = client
    return router


def has_rounds(detail: Any) -> bool:
    return bool(records(detail, "round"))


def has_price(data: dict) -> bool:
    for key, value in data.items():
        if any(word in key.lower() for word in ("price", "amount", "fee")) and type(value) in (int, float) and value >= 0:
            return True
        if isinstance(value, dict) and has_price(value):
            return True
    return False


def validate_rounds(detail: Any, selections: Any) -> list[dict]:
    groups = records(detail, "round")
    require(isinstance(selections, list) and len(selections) == len(groups), "请为每组套餐确认搭配。")
    result = []
    used = set()
    for selection in selections:
        require(isinstance(selection, dict), "套餐搭配格式无效。")
        group = select_record(groups, "round", selection.get("round"))
        require(str(group["round"]) not in used, "套餐搭配组不能重复。")
        used.add(str(group["round"]))
        options = records(group.get("choices", []), "code")
        chosen = selection.get("comboItemList")
        require(isinstance(chosen, list) and len(chosen) > 0, "请选择套餐子项。")
        combo = []
        for item in chosen:
            require(isinstance(item, dict), "套餐子项格式无效。")
            option = select_record(options, "code", item.get("code"))
            quantity = item.get("quantity")
            require(type(quantity) is int and 1 <= quantity <= 99, "套餐子项数量无效。")
            combo.append({"code": str(option["code"]), "quantity": quantity})
        defaults = [option for option in options if option.get("isDefault") == 1]
        default_counts = [option.get("quantity", 1) for option in defaults]
        require(all(type(count) is int and 1 <= count <= 99 for count in default_counts), "服务方默认套餐数量格式未识别，不能猜测。")
        expected = sum(default_counts)
        require(expected > 0 and sum(item["quantity"] for item in combo) == expected, "套餐子项数量必须与服务方默认搭配一致。")
        result.append({"round": str(group["round"]), "comboItemList": combo})
    return result
