import { expect, test, type Page } from "@playwright/test";

async function setup(page: Page, uncertain = false, expired = false) {
  const state = {
    connected: false, credentialsConfigured: true, method: 2, step: 0,
    addresses: [] as object[], address: null as object | null, stores: [] as object[],
    store: null as object | null, menu: [] as object[], details: {} as Record<string, object>,
    items: [] as object[], coupons: [], couponData: null, quote: null as object | null,
    quoteId: null as string | null, attempt: "none", order: null as object | null,
    orderId: null as string | null, tools: ["query-meals", "calculate-price", "create-order"],
    needTableware: false, remark: "",
  };
  const actions: string[] = [];
  await page.route("**/api/ordering/**", async (route) => {
    const body = route.request().method() === "POST" ? route.request().postDataJSON() : null;
    if (body) {
      actions.push(body.action);
      switch (body.action) {
        case "connect": state.connected = true; break;
        case "method": state.method = body.payload.method; state.step = 1; break;
        case "addresses": state.addresses = [{ addressId: "test-address", contactName: "测试联系人", phone: "测试电话", fullAddress: "仅测试地址" }]; break;
        case "stores": state.address = state.addresses[0]; state.stores = [{ storeCode: "100", storeName: "测试门店", beCode: "be" }]; state.step = 2; break;
        case "select-store": state.store = state.stores[0]; state.menu = [{ productCode: "meal1", name: "测试餐品" }]; state.step = 3; break;
        case "detail": state.details.meal1 = { name: "测试餐品", supportModify: false }; break;
        case "items": state.items = body.payload.items; state.quote = null; state.step = 4; break;
        case "coupons": break;
        case "quote":
          state.quote = { data: { totalPrice: 2800, deliveryFee: 600 } };
          state.quoteId = "test-quote"; state.step = 5;
          state.needTableware = body.payload.needTableware; state.remark = body.payload.remark;
          break;
        case "edit": state.quote = null; state.quoteId = null; state.step = body.payload.step; break;
        case "create":
          if (expired) {
            await route.fulfill({ status: 409, json: { detail: "报价已超过 5 分钟，请重新核价并确认。" } });
            return;
          }
          state.step = 6;
          if (uncertain) {
            state.attempt = "unknown";
            await route.fulfill({ status: 502, json: { detail: "下单结果不确定" } });
            return;
          }
          state.attempt = "created"; state.orderId = "test-order";
          state.order = { data: { orderId: "test-order", orderStatus: "待支付", payUrl: "https://m.mcd.cn/test-only" } };
          break;
        case "status": state.order = { data: { orderStatus: "服务方返回的实际状态" } }; break;
        default: throw new Error(`Unexpected action: ${body.action}`);
      }
    }
    await route.fulfill({ json: state });
  });
  await page.goto("/");
  return actions;
}

async function review(page: Page) {
  await page.getByRole("button", { name: "连接并发现工具" }).click();
  await page.getByRole("button", { name: "开始引导" }).click();
  await page.getByRole("button", { name: "读取我的配送地址" }).click();
  await page.getByRole("radio").check();
  await page.getByRole("button", { name: "查询该地址可配送门店" }).click();
  await page.getByRole("button", { name: "选择并加载真实菜单" }).click();
  await page.getByRole("button", { name: /测试餐品/ }).click();
  await page.getByRole("button", { name: "加入本次餐篮" }).click();
  await page.getByRole("button", { name: "确认餐品，继续" }).click();
  await page.getByRole("checkbox", { name: /需要餐具/ }).check();
  await page.getByLabel("配送备注").fill("测试备注");
  await page.getByRole("button", { name: "请求 MCP 实时核价" }).click();
  await expect(page.getByRole("heading", { name: "最后核对，再决定是否下单" })).toBeVisible();
}

test("guided real entry requires separate, current-price confirmation", async ({ page }) => {
  const actions = await setup(page);
  await review(page);
  expect(actions).not.toContain("create");
  await expect(page.getByText("¥28.00", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "我要创建真实订单，进入确认" }).click();
  const create = page.getByRole("button", { name: "确认创建真实订单（不自动支付）" });
  await expect(create).toBeDisabled();
  await page.getByRole("checkbox", { name: /我已核对/ }).check();
  await expect(create).toBeDisabled();
  await page.getByLabel("输入“确认创建真实订单”").fill("确认创建真实订单");
  if (process.env.CAPTURE_LAB3 === "1") {
    await page.evaluate(() => {
      const notice = document.createElement("p");
      notice.textContent = "OFFLINE TEST FIXTURE / 离线测试数据：不是真实报价，未创建真实订单。";
      notice.style.cssText = "background:#fff0c2;color:#593c00;padding:16px;margin:0;text-align:center;font-weight:700";
      document.body.prepend(notice);
      window.scrollTo(0, 0);
    });
    await page.screenshot({ path: "../../lab3/images/confirmation-offline-test.png", fullPage: true });
  }
  await create.click();
  expect(actions.filter((action) => action === "create")).toHaveLength(1);
  await expect(page.getByRole("heading", { name: "订单已创建，支付由你完成" })).toBeVisible();
  await expect(page.getByRole("link", { name: /打开服务方链接/ })).toHaveAttribute("rel", "noopener noreferrer");
  await page.getByRole("button", { name: "我已支付 / 支付失败，查询实际状态" }).click();
  await expect(page.getByText("服务方返回的实际状态")).toBeVisible();
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
});

test("editing quote clears confirmation and asks for fresh pricing", async ({ page }) => {
  const actions = await setup(page);
  await review(page);
  await page.getByRole("button", { name: "我要创建真实订单，进入确认" }).click();
  await page.getByRole("checkbox", { name: /我已核对/ }).check();
  await page.getByRole("button", { name: /修改餐品 \/ 偏好并重新核价/ }).click();
  expect(actions).toContain("edit");
  await page.getByRole("button", { name: "请求 MCP 实时核价" }).click();
  await expect(page.getByRole("button", { name: "确认创建真实订单（不自动支付）" })).toHaveCount(0);
  expect(actions).not.toContain("create");
  await page.reload();
  await expect(page.getByText("餐具：需要 · 备注：测试备注")).toBeVisible();
});

test("uncertain order never offers an automatic retry", async ({ page }) => {
  const actions = await setup(page, true);
  await review(page);
  await page.getByRole("button", { name: "我要创建真实订单，进入确认" }).click();
  await page.getByRole("checkbox", { name: /我已核对/ }).check();
  await page.getByLabel("输入“确认创建真实订单”").fill("确认创建真实订单");
  await page.getByRole("button", { name: "确认创建真实订单（不自动支付）" }).click();
  await expect(page.getByRole("heading", { name: "下单结果需要核实" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "下单结果需要核实" })).toBeVisible();
  expect(actions.filter((action) => action === "create")).toHaveLength(1);
  await expect(page.getByRole("button", { name: "确认创建真实订单（不自动支付）" })).toHaveCount(0);
});

test("expired confirmation is rejected before submission and allows fresh pricing", async ({ page }) => {
  const actions = await setup(page, false, true);
  await review(page);
  await page.getByRole("button", { name: "我要创建真实订单，进入确认" }).click();
  await page.getByRole("checkbox", { name: /我已核对/ }).check();
  await page.getByLabel("输入“确认创建真实订单”").fill("确认创建真实订单");
  await page.getByRole("button", { name: "确认创建真实订单（不自动支付）" }).click();
  await expect(page.getByRole("alert")).toContainText("报价已超过 5 分钟");
  await expect(page.getByRole("button", { name: "重新核价", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "重新核价", exact: true }).click();
  expect(actions.filter((action) => action === "create")).toHaveLength(1);
  await expect(page.getByRole("button", { name: "我要创建真实订单，进入确认" })).toBeVisible();
});

test("desired Big Mac is not fabricated when absent from the live menu", async ({ page }) => {
  const actions = await setup(page);
  await page.getByRole("button", { name: "连接并发现工具" }).click();
  await page.getByRole("button", { name: "开始引导" }).click();
  await page.getByRole("button", { name: "读取我的配送地址" }).click();
  await page.getByRole("radio").check();
  await page.getByRole("button", { name: "查询该地址可配送门店" }).click();
  await page.getByRole("button", { name: "选择并加载真实菜单" }).click();
  await page.getByLabel("想吃什么？").fill("巨无霸");
  await expect(page.getByText("当前门店此时段的实时菜单中未找到“巨无霸”。", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "确认餐品，继续" })).toBeDisabled();
  expect(actions).not.toContain("items");
  expect(actions).not.toContain("create");
  await page.getByRole("button", { name: "查看全部在售餐品" }).click();
  await expect(page.getByRole("button", { name: /测试餐品/ })).toBeVisible();
});

for (const width of [1440, 768, 390]) {
  test(`guided layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await setup(page);
    await review(page);
    const layout = await page.evaluate(() => ({
      width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
      overflow: [...document.querySelectorAll("*")].filter((element) => element.getBoundingClientRect().right > innerWidth)
        .map((element) => ({ tag: element.tagName, class: element.className, width: element.getBoundingClientRect().width })),
    }));
    expect(layout.scrollWidth, JSON.stringify(layout)).toBeLessThanOrEqual(layout.width);
  });
}
