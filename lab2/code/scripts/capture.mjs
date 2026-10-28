import { chromium } from "@playwright/test";
import { resolve } from "node:path";

const executablePath = process.env.EDGE_PATH || "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge";
const output = resolve(process.argv[2] || "../images");
const browser = await chromium.launch({ executablePath, headless: true });

try {
  for (const [name, width, height] of [["desktop", 1440, 900], ["tablet", 768, 1024], ["phone", 390, 844]]) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "为你准备的美味" }).waitFor();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    if (overflow) throw new Error(`${name}: unexpected horizontal overflow`);
    await page.screenshot({ path: `${output}/edge-${name}.png`, fullPage: true });
    await page.getByRole("button", { name: "添加经典牛肉堡" }).click();
    await page.getByRole("button", { name: "添加金黄薯条" }).click();
    if (name === "desktop") await page.screenshot({ path: `${output}/edge-cart.png`, fullPage: true });
    await page.getByRole("button", { name: "模拟结账" }).click();
    await page.getByRole("dialog").getByText("模拟结账完成").waitFor();
    if (name === "desktop") await page.screenshot({ path: `${output}/edge-checkout.png` });
    await page.getByRole("button", { name: "完成", exact: true }).click();
    await page.getByRole("button", { name: "优惠专区" }).click();
    await page.getByText("模拟数据 · 不可用于真实消费").waitFor();
    if (name === "desktop") await page.screenshot({ path: `${output}/edge-offers.png`, fullPage: true });
    await page.close();
    console.log(`${name}: layout, cart, simulated checkout and mock offers verified`);
  }
} finally {
  await browser.close();
}
