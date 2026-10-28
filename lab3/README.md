# Lab 3 — Guided MCP ordering in a canvas

[简体中文](https://kinfey.github.io/aigenius-ghc-app-hol/lab3/zh.html) · [繁體中文](https://kinfey.github.io/aigenius-ghc-app-hol/lab3/traditional.html) · [Lab 2](../lab2/) · [Workshop home](../)

**Goal:** Extend the Lab 2 application into a step-by-step, real MCP ordering workflow and open it in Copilot App's existing **Browser canvas**. Allow **25 minutes**, within the **60-minute workshop**: Lab 1 20 min + Lab 2 15 min + Lab 3 25 min.

**What is implemented:** The application, Python MCP adapter, guided UI, tests and screenshots are included. The default application queries real services and does not fall back to mock products or prices. It is a web application displayed in the Browser canvas, **not a registered custom SDK canvas extension**. A Markdown flow diagram is not the application.

**Classroom stopping point:** Review the real quote without creating an order. The application also includes an optional, separately confirmed real-order action; neither attendance nor completion requires spending money. Payment is always manual.

## 0. Before the timed lab

Complete installation, dependency restoration, Copilot sign-in, MCP activation and private token setup before the 60-minute class. Python 3.11+, Node.js 22.16+, Microsoft Edge and access to your own mainland-China McDonald's account are required. The server and tools can change; use the live schema.

Keep using the same application workspace as Labs 1–2. The reference implementation is maintained in [`lab2/code`](https://github.com/kinfey/aigenius-ghc-app-hol/tree/main/lab2/code); there is no duplicate `lab3/code`.

| Time in this lab | Activity |
| --- | --- |
| 0–5 min | Inspect the generated code, start the application and open the Browser canvas |
| 5–10 min | Connect MCP and choose fulfillment, address if needed, and store |
| 10–18 min | Inspect the real menu, select items/options and request a quote |
| 18–22 min | Check confirmation, expiry, edit and uncertain-result behavior without purchasing |
| 22–25 min | Run the prepared checks, inspect mobile layout and record the result |

## 1. Extend the Lab 2 application and run it

In the existing Copilot App project session, use this implementation prompt:

> Extend the Lab 2 React/TypeScript and Python application, rather than creating another disconnected demo. Implement guided real MCP ordering: connect → fulfillment → saved delivery address when needed → store → menu/details/combo choices → applicable coupons/tableware/note → real price review → separate optional order confirmation → manual payment and status. Discover and validate current tool schemas. Do not fabricate products or prices or expose the token to the browser. Gate each real create with a fresh, single-use quote confirmation; never retry an uncertain create. Keep account data in local server memory only. Add offline transport/UI tests and run commands. Open the running application in the existing Browser canvas, not just a Markdown document.

Review the generated files before approving execution. This repository includes the resulting implementation, so the 60-minute class can inspect and extend it rather than type it from scratch.

From `lab2/code`, prepare dependencies before class:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install --index-url https://packagefeedproxy.microsoft.io/pypi/simple/ -r requirements.txt
npm install
```

Privately create the ignored `.env` from `.env.example`, restrict its permissions (`chmod 600 .env` on macOS/Linux), and set your own `MCD_MCP_TOKEN`. Do not paste it into chat, screenshots or frontend code. Do not commit `.env`. Then start the API:

```bash
.venv/bin/python -m uvicorn backend.app:app --env-file .env --host 127.0.0.1 --port 8000
```

In a second terminal in the same directory:

```bash
npm run dev
```

Ask Copilot to open the existing **Browser canvas** at `http://127.0.0.1:5173/`; open the same URL in Edge if needed. Both servers listen on loopback only. GitHub Pages serves these instructions and screenshots, **not the Python API or an authenticated ordering deployment**.

Copilot App's configured `mcd-mcp` and this Python backend are independent MCP clients. The application does not inherit the App's credentials. `OFFERS_MODE` controls the older Lab 2 offers endpoint, not the real ordering wizard. The earlier mock UI is isolated at `/?demo=1` and is not used for this lab.

## 2. Connect and choose a real store

1. Click **连接并发现工具** (connect and discover tools), verify the real tool list, then **开始引导** (start).
2. Choose **到店自取** (pickup) or **麦乐送配送** (delivery). Pickup can search favorites or use your city and a location keyword. Delivery first requires clicking **读取我的配送地址**, explicitly choosing one saved address, then querying its eligible stores.
3. Select a returned store and load its actual menu. No store, address or product ID is invented. If there are no addresses, add one privately in the McDonald's app; this application does not create addresses.
4. On an authentication, availability or schema error, inspect the visible error and correct the configuration. Do not switch silently to sample data.

![Real MCP connection and discovery](images/live-mcp-connection.png)
*Actual Edge capture of the same application used in the Browser canvas. Discovery returned nine ordering tools at capture time; the count can change. No token or account data is shown.*

| Stage | MCP tools used |
| --- | --- |
| Pickup stores | `query-nearby-stores` |
| Delivery address and eligible stores | `delivery-query-addresses`, `delivery-query-stores` |
| Menu and item configuration | `query-meals`, `query-meal-detail` |
| Store coupons | `query-store-coupons` |
| Authoritative pricing | `calculate-price` |
| Optional, explicitly confirmed creation | `create-order` |
| Actual order status | `query-order` |

Pickup uses `beType=1`, `orderType=1` and omits `beCode`. Delivery uses `beType=2`, `orderType=2` and the selected store's returned `beCode`; creation also requires the chosen `addressId`.

## 3. Select items, inspect choices and request pricing

1. Search for a desired item, for example **巨无霸** (Big Mac), or filter by returned menu categories. Select an actual result to fetch its details.
2. Review the default combo choices, choose supported alternatives and quantity, and add the item to the basket. The current wizard uses default custom modifications; complex or unrecognized configurations require the McDonald's app.
3. Query store coupons. Only matching returned coupon records can be selected for an item; querying is not claiming a coupon. Do not assume a discount applies until the service quotes it.
4. Confirm the basket, choose whether tableware is needed, and optionally enter a delivery note of at most 50 characters. Click **请求 MCP 实时核价**.
5. Review the provider response, fulfillment, store, delivery address, items and fees. Menu `currentPrice` strings are in yuan; the final numeric price/amount/fee fields returned by pricing are in cents and are displayed with a yuan conversion.

![Actual real menu with category and name search](images/live-menu-desktop.png)
*Live pickup menu returned by the service, not an offline fixture. Menu selection and prices depend on account, store and time; the published values are not an offer or a guarantee.*

### Exercise: “I want a Big Mac”

During the recorded breakfast session, the chosen delivery store returned **60 real menu items** but no Big Mac. The correct behavior is to report that it was not returned for the selected store/time, keep the basket unchanged, and let the user inspect available items or use the official app for another time. Do not invent a Big Mac code or pretend a purchase succeeded. The screenshot below reproduces the unavailable search on a real pickup menu.

![Big Mac not returned by the current real menu](images/live-big-mac-unavailable.png)
*Actual live-service result at capture time; this does not assert that the product is unavailable at all stores or times.*

### The menu-parsing issue and generated fix

The provider separates category references from product details:

```text
data.categories[].meals[].code  →  data.meals[code]
```

The generated [`menu_records`](https://github.com/kinfey/aigenius-ghc-app-hol/blob/main/lab2/code/backend/ordering.py) joins those records, preserves categories/tags and deduplicates repeated items. A meal's dictionary key supplies its product code; the value need not repeat the code. Missing mappings produce an error rather than a fabricated menu.

```python
code = str(entry["code"])
meal = meals.get(code)
# After validating the returned mapping:
normalized[code] = {
    **meal,
    "productCode": code,
    "categories": [],
    "tags": [],
}
```

## 4. Review, stop, or explicitly create once

For the timed exercise, **stop at price review**. Demonstrate the confirmation UI using the offline test below instead of purchasing.

If you independently choose a real order and accept the possible cost, open the real-order confirmation area, tick the consent checkbox, type **确认创建真实订单**, and click the final creation button. Pickup additionally requires a `takeWayCode` from the quote's `takeWayList`. This is not authorization for payment.

The server checks the current quote ID, explicit confirmation and a five-minute expiry. Edits invalidate the quote. A session lock and consumed submission state prevent double-click or concurrent creation. Once a submission fails or becomes uncertain, do not automatically retry; inspect the McDonald's app or query a returned order ID first.

![Review and separate order-creation confirmation, offline fixture](images/confirmation-offline-test.png)
*Explicitly labeled offline Playwright fixture. Its address, item and amounts are test data. This illustrates the confirmation gate, not a real quote, successful real order or completed payment.*

After an intentionally created real order, the user opens a recognized provider payment link or the McDonald's app and decides whether to pay. The application does not submit payment. **我已支付 / 支付失败，查询实际状态** queries `query-order`; generating a payment link is never treated as proof of payment.

## 5. Generated code and verification

All implementation files below are included in the repository:

| File in `lab2/code` | Responsibility |
| --- | --- |
| [`src/LiveOrdering.tsx`](https://github.com/kinfey/aigenius-ghc-app-hol/blob/main/lab2/code/src/LiveOrdering.tsx), `src/live.css` | Guided steps, real-data display, menu search, consent and manual payment handoff |
| `src/main.tsx` | Default real application entry; legacy mock UI requires `?demo=1` |
| [`backend/ordering.py`](https://github.com/kinfey/aigenius-ghc-app-hol/blob/main/lab2/code/backend/ordering.py), `backend/app.py` | MCP connection/schema checks, response normalization, session state, quote binding and one-shot creation |
| `backend/test_ordering.py`, `backend/test_app.py` | Isolated transport fixtures, fulfillment constraints, expiry, replay prevention and failures |
| `tests/live.spec.ts`, `tests/workflow.spec.ts`, `playwright.config.ts` | Offline browser/domain regressions and responsive layouts |
| `scripts/capture-live.mjs` | Privacy-safe live connection/menu captures; refuses address, creation and order-status actions |
| `.env.example`, `requirements.txt`, `package.json`, [`README.md`](https://github.com/kinfey/aigenius-ghc-app-hol/blob/main/lab2/code/README.md) | Private configuration example, dependencies and complete run instructions |

Run from `lab2/code`:

```bash
.venv/bin/python -m unittest backend.test_app backend.test_ordering
npm run test:ui
npm run build
```

The current suite includes **16 backend tests and 17 browser/domain tests**. Tests replace live ordering calls with isolated fixtures, including creation; they never create a real order. Real connection discovery, saved-address reading and menu loading were also checked separately without placing an order. A successful real quote, creation or payment is **not** claimed by the screenshots.

![Live unavailable-search layout at 390 pixels](images/live-mobile.png)
*Actual mobile-size Edge capture. The progress strip scrolls within its own area; the page has no horizontal overflow.*

To reproduce the published captures:

```bash
# Requires the running local API/frontend and your private server credentials.
# Performs live discovery and public-location pickup menu queries; no address reads or orders.
node scripts/capture-live.mjs

# Entirely offline fixture; writes the clearly labeled confirmation screenshot.
CAPTURE_LAB3=1 npm run test:ui -- tests/live.spec.ts -g "guided real entry"
```

The live capture defaults to a public location example. Set `CAPTURE_CITY` and `CAPTURE_KEYWORD` for another public search, and adapt the unavailable-item expectation if the current menu changes. Inspect every image before publishing; never capture a real address, private coupon, token, order or payment URL.

## Privacy, limits and completion

Account data lives only in the local Python process, isolated by an HttpOnly SameSite cookie. Idle sessions expire after two hours. Refresh can restore the same server session; a server restart loses it. After a restart or uncertain creation, check the official app before creating another order. Never expose this single-account teaching server to an untrusted network.

Supported scope is immediate pickup/delivery, existing addresses, normal items and recognized combo groups, matching coupons, default modifications, tableware and delivery notes. Reservations, custom modifications, group/drive-through ordering, address creation, coupon claiming, memberships and cancellations are outside this timed lab.

Complete the lab when the Browser canvas runs the real guided application, empty/unavailable/error states remain honest, the menu mapping is understood, the prepared confirmation tests pass, and no purchase is required.

**Optional after class:** A custom SDK canvas extension is a different deliverable. Follow the [official canvas extension guide](https://docs.github.com/en/copilot/how-tos/github-copilot-app/working-with-canvas-extensions) and the installed `/create-canvas` skill's guide/scaffold/reload checks in a capable session. Do not label this Browser application or a Markdown diagram as a registered custom extension.
