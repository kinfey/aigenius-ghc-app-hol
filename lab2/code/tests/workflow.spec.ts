import { expect, test, type Page } from "@playwright/test";
import { initialDraft, orderErrors, parseDraft, priceOrder, STORAGE_KEY } from "../src/order";

const products = [
  { id: "burger", name: "经典牛肉堡", price: 28, icon: "🍔", description: "模拟餐品", category: "汉堡", tag: "模拟" },
  { id: "fries", name: "金黄薯条", price: 12, icon: "🍟", description: "模拟餐品", category: "小食", tag: "模拟" },
];

async function mockApi(page: Page) {
  await page.route("**/api/products", (route) => route.fulfill({ json: { products, source: "mock" } }));
  await page.route("**/api/offers", (route) => route.fulfill({ json: { source: "mock", updatedAt: "2026-10-28T00:00:00Z", offers: [] } }));
}
async function begin(page: Page) {
  await mockApi(page);
  await page.goto("/?demo=1");
  await page.getByRole("button", { name: "添加经典牛肉堡", exact: true }).click();
  await page.getByRole("button", { name: "模拟结账" }).click();
}

test("price boundaries, delivery fee and draft validation", () => {
  for (const [subtotal, discount] of [[49, 0], [50, 500], [51, 500]]) {
    const draft = { ...initialDraft(), counts: { burger: 1 }, coupon: "save5" as const };
    expect(priceOrder(draft, [{ ...products[0], price: subtotal }]).discount).toBe(discount);
  }
  const draft = { ...initialDraft(), counts: { burger: 2 }, method: "delivery" as const, coupon: "save5" as const };
  expect(priceOrder(draft, products)).toEqual({ count: 2, subtotal: 5600, discount: 500, delivery: 600, total: 5700 });
  expect(priceOrder({ ...draft, counts: {} }, products).delivery).toBe(0);
  expect(orderErrors(draft, products)).toContain("配送需要选择虚构地址。");
  expect(() => parseDraft(JSON.stringify({ ...draft, counts: { burger: 100 } }))).toThrow();
  expect(() => parseDraft(JSON.stringify({ ...draft, address: "non-demo address" }))).toThrow();
  expect(parseDraft(JSON.stringify(initialDraft()))).toEqual(initialDraft());
});

test("pickup confirmation, persistence, invalidation and reset", async ({ page }) => {
  const writes: string[] = [];
  page.on("request", (request) => { if (request.method() !== "GET") writes.push(request.url()); });
  await begin(page);
  await page.getByLabel("模拟门店", { exact: true }).selectOption("示例门店 A");
  await expect(page.getByLabel("虚构配送地址")).toHaveCount(0);
  await page.getByRole("button", { name: "确认模拟草稿（不下单）" }).click();
  await expect(page.getByText("模拟草稿已确认。未创建真实订单，未支付。")).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "点餐流程", exact: true }).click();
  await expect(page.getByText("模拟草稿已确认。未创建真实订单，未支付。")).toBeVisible();
  await page.getByRole("button", { name: "演示支付跳转（不付款）" }).click();
  await expect(page.getByText("模拟支付跳转演示完成。未创建真实订单，未付款。")).toBeVisible();
  await page.getByRole("button", { name: "增加经典牛肉堡" }).click();
  await expect(page.getByRole("button", { name: "演示支付跳转（不付款）" })).toBeDisabled();
  await expect(page.getByTestId("workflow-total")).toHaveText("¥56.00");
  await page.getByRole("button", { name: "重置模拟草稿", exact: true }).click();
  await page.getByRole("button", { name: "确认重置", exact: true }).click();
  await expect(page.getByText("餐篮还是空的")).toBeVisible();
  await expect(page.getByTestId("workflow-total")).toHaveText("¥0.00");
  expect(writes).toEqual([]);
});

test("delivery requires address, discounts apply and method changes clear confirmation", async ({ page }) => {
  await begin(page);
  await page.getByRole("radio", { name: "配送", exact: true }).check();
  await page.getByLabel("模拟门店", { exact: true }).selectOption("示例门店 B");
  await page.getByRole("button", { name: "确认模拟草稿（不下单）" }).click();
  await expect(page.getByRole("alert")).toContainText("配送需要选择虚构地址");
  await page.getByLabel("虚构配送地址").selectOption("示例路 100 号（虚构）");
  await page.getByLabel("模拟优惠", { exact: true }).selectOption("save5");
  await expect(page.getByText("商品金额未满 ¥50，优惠未生效。")).toBeVisible();
  await expect(page.getByTestId("workflow-total")).toHaveText("¥34.00");
  await page.getByRole("button", { name: "增加经典牛肉堡" }).click();
  await expect(page.getByTestId("workflow-total")).toHaveText("¥57.00");
  await page.getByRole("button", { name: "确认模拟草稿（不下单）" }).click();
  await page.getByRole("radio", { name: "到店取餐", exact: true }).check();
  await expect(page.getByLabel("虚构配送地址")).toHaveCount(0);
  await expect(page.getByTestId("workflow-total")).toHaveText("¥51.00");
  await expect(page.getByRole("button", { name: "演示支付跳转（不付款）" })).toBeDisabled();
});

test("same-origin browser panels share saved drafts", async ({ page, context }) => {
  await begin(page);
  const second = await context.newPage();
  await mockApi(second);
  await second.goto("/?demo=1");
  await second.getByRole("button", { name: "点餐流程", exact: true }).click();
  await expect(second.getByTestId("workflow-total")).toHaveText("¥28.00");
  await page.getByRole("button", { name: "增加经典牛肉堡" }).click();
  await expect(second.getByTestId("workflow-total")).toHaveText("¥56.00");
});

test("corrupt draft can be reset and storage errors are visible", async ({ page }) => {
  await mockApi(page);
  await page.addInitScript((key) => localStorage.setItem(key, "invalid-json"), STORAGE_KEY);
  await page.goto("/?demo=1");
  await expect(page.getByRole("alert")).toBeVisible();
  await page.getByRole("button", { name: "点餐流程", exact: true }).click();
  await page.getByRole("button", { name: "重置模拟草稿", exact: true }).click();
  await page.getByRole("button", { name: "确认重置", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error("storage denied"); }; });
  await page.getByLabel("模拟门店", { exact: true }).selectOption("示例门店 A");
  await expect(page.getByRole("alert")).toContainText("草稿保存失败");
});

test("menu and offers failures stay explicit without mock fallback", async ({ page }) => {
  await page.route("**/api/products", (route) => route.fulfill({ status: 503, json: { detail: "Menu unavailable" } }));
  await page.goto("/?demo=1");
  await expect(page.getByRole("alert")).toContainText("Menu unavailable");
  await page.getByRole("button", { name: "点餐流程", exact: true }).click();
  await expect(page.getByRole("button", { name: "确认模拟草稿（不下单）" })).toBeDisabled();
  await page.route("**/api/offers", (route) => route.fulfill({ status: 502, json: { detail: "MCP unavailable" } }));
  await page.getByRole("button", { name: "优惠专区", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("MCP unavailable");
  await expect(page.getByText("模拟数据 · 不可用于真实消费")).toHaveCount(0);
});

for (const width of [1440, 768, 390]) {
  test(`responsive menu, workflow and offers at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await begin(page);
    await page.getByRole("radio", { name: "配送", exact: true }).check();
    for (const destination of ["点餐流程", "优惠专区", "点餐菜单"]) {
      await page.getByRole("button", { name: destination, exact: true }).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  });
}
