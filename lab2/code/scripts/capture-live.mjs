import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const output = resolve("../../lab3/images");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.EDGE_PATH || "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  headless: true,
});
const forbidden = new Set(["addresses", "create", "status"]);
const actions = [];

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
  await page.route("**/api/ordering/action", async (route) => {
    const body = route.request().postDataJSON();
    if (forbidden.has(body.action)) throw new Error(`Not permitted during documentation capture: ${body.action}`);
    actions.push(body.action);
    await route.continue();
  });
  await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "连接并发现工具" }).click();
  await page.getByText(/已连接，发现 \d+ 个点餐工具。/).waitFor({ timeout: 60000 });
  await page.screenshot({ path: `${output}/live-mcp-connection.png`, fullPage: true });
  await page.getByRole("button", { name: "开始引导" }).click();
  await page.getByRole("button", { name: /^到店自取/ }).click();
  await page.getByLabel("城市", { exact: true }).fill(process.env.CAPTURE_CITY || "广州市");
  await page.getByLabel("位置关键词", { exact: true }).fill(process.env.CAPTURE_KEYWORD || "华景北路");
  await page.getByRole("button", { name: "按位置查询门店" }).click();
  await page.getByRole("button", { name: "选择并加载真实菜单" }).first().click({ timeout: 60000 });
  await page.getByLabel("想吃什么？").waitFor({ timeout: 60000 });
  await page.locator(".live-menu button").first().waitFor();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${output}/live-menu-desktop.png`, fullPage: true });
  await page.getByLabel("想吃什么？").fill("巨无霸");
  await page.getByText("当前门店此时段的实时菜单中未找到“巨无霸”。", { exact: false }).waitFor();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${output}/live-big-mac-unavailable.png`, fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) {
    throw new Error("Mobile documentation capture has horizontal overflow");
  }
  await page.screenshot({ path: `${output}/live-mobile.png`, fullPage: true });
  console.log(`Captured live connection, menu, unavailable search and mobile layout. Read-only actions: ${actions.join(", ")}`);
} finally {
  await browser.close();
}
