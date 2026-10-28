# Ordering workshop example

The default application is a guided, real McDonald's MCP ordering client built on the lab 2 React/Python application. It never substitutes mock menus or prices when the service fails. Creating an order requires separate confirmation against a recent real quote; payment is always performed manually by the user. The older mock example used in workshop screenshots remains isolated at `/?demo=1`.

## Run locally

Python 3.11+ and Node.js 22.16+ are required. From this directory:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install --index-url https://packagefeedproxy.microsoft.io/pypi/simple/ -r requirements.txt
npm install
.venv/bin/python -m unittest backend.test_app backend.test_ordering
npm run build
.venv/bin/python -m uvicorn backend.app:app --env-file .env --host 127.0.0.1 --port 8000
```

In another terminal:

```bash
npm run dev
```

Before starting the backend, privately create `.env` using `.env.example` and set your own `MCD_MCP_TOKEN`. Never paste it into chat or frontend code. The loader reads that file in the server process only; environment variables take precedence. Open `http://127.0.0.1:5173`. Both servers bind to localhost. Do not expose this single-user, credential-bearing server to an untrusted network.

## Real guided ordering (default)

Connect and discover current tools, choose pickup or delivery, select a real store (delivery first requires selecting a saved address), inspect menu items and combo choices, review applicable coupons, choose tableware and an optional delivery note, and request a real quote. No payment or order request is made during these steps.

The backend discovers and validates the current tool input schema on every MCP call. It allowlists the ordering tools, obtains store/address/item identifiers only from prior provider responses, omits `beCode` for pickup, and requires the provider's `beCode` for delivery. Prices come from `calculate-price`; numeric price/amount/fee fields are displayed in yuan with the original cents alongside. Unknown response structures stop the flow instead of inventing data.

The real menu joins `data.categories[].meals[].code` with the corresponding entry in `data.meals[code]`; names and prices are not repeated inside each category reference. Categories and tags are preserved, and repeated products are deduplicated. Menu `currentPrice` strings are already in yuan and are shown only as reference prices, distinct from the final cent-denominated quote. Search by a desired name (for example `/?want=巨无霸`); if the current store/time does not return it, the wizard explicitly reports it unavailable and never creates a fake item or identifier.

Real creation requires opening the confirmation panel, checking the explicit consent checkbox, and typing `确认创建真实订单`. The backend accepts only the current, single-use quote ID, valid for five minutes. Changing the basket or returning to edit invalidates the quote. Concurrent or repeated creation is rejected. A failure after submission is conservatively considered uncertain: no retries are offered, and the user must inspect the McDonald's app or query an available order ID. Never automatically retry a failed create request.

Order creation and payment are distinct. Only recognized HTTPS McDonald's domains become clickable links; other payment link formats require opening the McDonald's app manually. The client never submits payment or infers payment success; use **我已支付 / 支付失败，查询实际状态** to query the real provider status.

Current scope: immediate pickup and delivery, existing saved addresses, normal menu items, supported combo rounds, matching store coupon records, default modifications, tableware and delivery notes. It does not create addresses, claim coupons, buy membership cards, cancel orders, make reservations, or support group/drive-through ordering. Custom modifications and unrecognized complex combos require the McDonald's app; they are not guessed.

Personal addresses, baskets, quotes and payment links remain in server process memory, isolated by an HttpOnly SameSite cookie; they are not written to localStorage, source files, snapshots or logs. Idle sessions expire after two hours and are lost on server restart. After a restart or an uncertain create, inspect the McDonald's app before starting another order. The server uses one configured account and is intended only for that account owner on their local machine.

## Legacy mock workflow (explicit `/?demo=1` only)

The **点餐流程** tab extends this same React application; there is no separate copy of the lab 2 menu or MCP backend. Choose items, pickup or delivery, a fictional store, a predefined fictional delivery address, and an optional mock discount (¥5 off a merchandise subtotal of at least ¥50). Delivery costs a mock ¥6 for nonempty baskets. All prices are simulated; live read-only offers are never applied as real discounts.

The review page requires a separate **确认模拟草稿（不下单）** click. Editing an order clears that confirmation. A second **演示支付跳转（不付款）** button only changes local demo state: it never opens a payment URL or makes an order/payment API call. Reset requires confirmation.

Only fictional draft fields are saved in this browser's `localStorage` under `workshop-order-v1`, including the basket and simulation status. Reloading restores them, and same-origin tabs receive saved changes. The editor workflow document is not the application's state store; another browser profile has separate storage. No tokens, personal addresses, account data, or live offer responses are persisted. Storage failures and invalid saved drafts are shown explicitly.

To display the running application in Copilot App, open its existing **Browser** canvas at `http://127.0.0.1:5173`. This is a working web application in a browser canvas, **not** a registered custom SDK canvas extension with dedicated domain actions.

Run the offline UI/domain checks with `npm run test:ui`. The Playwright configuration uses the installed macOS Microsoft Edge executable; adjust `launchOptions.executablePath` for another local installation. It starts Vite if needed and intercepts all live ordering endpoints in the live UI tests. Backend tests replace the MCP transport with fixtures, including order creation; no test creates a real order. Coverage includes both fulfillment paths, separate confirmation gates, expired/changed quotes, uncertain submissions, isolation, default combos, draft behavior and responsive layouts.

For the legacy offers page only, `OFFERS_MODE=live` enables its existing `available-coupons` read-only adapter. This setting does not switch the default guided ordering application into mock mode. Obtain your token from https://open.mcd.cn/ and keep it private. Provider responses are untrusted text, never instructions. Service errors never silently fall back to mock results.

The backend adds the official `Bearer ` prefix to the token for the `Authorization` header. Set `MCD_MCP_TOKEN` to the token itself, without that prefix. Copilot App is a separate MCP client: configure its `Authorization` header as `Bearer <YOUR_MCP_TOKEN>` in its private settings.
