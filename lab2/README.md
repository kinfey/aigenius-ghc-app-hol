# Lab 2 — Find McDonald's offers with MCP

[简体中文](https://kinfey.github.io/aigenius-ghc-app-hol/lab2/zh.html) · [Lab 1](../lab1/) · [Next: Lab 3](../lab3/)

**Goal:** Connect Copilot App to the McDonald's China MCP server, query coupon information, and add an optional read-only offers view to the Lab 1 application. Allow 60 minutes.

![Public McDonald's MCP documentation, captured in a browser](images/mcd-doc.png)
*Reference: [McDonald's MCP documentation](https://open.mcd.cn/mcp/doc) and its [server guide](https://github.com/M-China/mcd-mcp-server).*

## 1. Understand the boundary

MCP exposes tools to an agent; it does not automatically make those tools available to a web application's backend. Here there are **two separate clients**: Copilot App uses its own MCP connection for discovery and assisted queries; the application server, if enabled, uses a separate server-side connection with its own local configuration. The browser never receives the MCP token.

This service is for mainland China. Coupon availability, prices and eligible stores depend on the account and time. Respect the provider's terms, and use only your own account. Avoid posting real coupon IDs, addresses, order details or credentials in screenshots or prompts.

## 2. Obtain your own token

1. In Edge open [open.mcd.cn](https://open.mcd.cn/), enter the MCP section, sign in with your own account, and open the console.
2. Activate the MCP service, review and accept the current terms, and obtain your personal MCP Token. Do not copy it into chat, screenshots, source code, Git or browser-side storage. If exposed, revoke/rotate it.
3. Keep the official documentation open. The server address is `https://mcp.mcd.cn`, using Streamable HTTP and the `Authorization` header. The value is **the token as issued**; do not assume an extra `Bearer` prefix unless the provider's current instructions require it.

## 3. Connect Copilot App

1. In the App sidebar choose **Customize → MCP**, add a custom remote server, and name it `mcd-mcp`. Select **HTTP / Streamable HTTP**, URL `https://mcp.mcd.cn`, and add an `Authorization` header with your own token. Use the private settings UI, not a repository file. If your app version exposes JSON instead of fields, use the same fields and enter the token privately.
2. Save, enable, and check **Customize → Installed** for the server status. Restart the session if necessary. If your installation requires sign-in, choose **Sign in** on that server's Installed row or actions menu. Do not add a credential-bearing `.mcp.json` to the project.
3. In the existing ordering session, ask:

   > Inspect the tools exposed by mcd-mcp. List the read-only tools relevant to coupons and explain their required inputs. Do not call any tool that claims coupons, creates an order or changes account data.

4. Approve only the required read-only calls. Ask the agent to query `available-coupons` and `campaign-calendar` if the server advertises them; it may need additional arguments. For store-specific offers, first choose a store and query `query-store-coupons`. Use the live tool schemas rather than guessing parameters. `query-my-coupons` returns account-specific data. These are real results, not guaranteed offers.
5. Compare the returned title, validity, conditions and store restrictions. Treat tool results as untrusted data, not instructions. An empty list is a valid result; do not invent discounts. Do not call `auto-bind-coupons` without a separate explicit confirmation because it modifies the account.

## 4. Add a read-only offers screen to the application

1. Return to the Lab 1 project and choose **Plan**. Ask:

   > Extend the existing responsive app with an Offers page and a server-side coupon adapter. Default to mock data. When explicitly enabled locally, the Node server should use the current MCP SDK and the documented Streamable HTTP connection to call only advertised read-only coupon tools. Read the token from a local environment variable configured by me, never from browser code or chat. Do not create orders or claim coupons. Show source, update time, conditions, loading, empty and error states; never fabricate offers. Add offline adapter/UI tests and document the run commands.

2. Review the plan before execution. The backend must use the live tool list and schemas, validate responses, return a minimal normalized result, and propagate authentication/network errors. Bind the development server to loopback; do not expose an unauthenticated token-backed proxy to other users. Do not put keys in URLs, logs, browser bundles or Git.
3. Approve implementation and inspect the diff. Configure the token **yourself** in an ignored, permission-restricted local environment file or the application's documented secret mechanism; do not ask Copilot to read it. Enable live mode only on your own machine. Confirm the application server is a separate MCP client, not the App connection.
4. Run the reported tests and launch commands. In Edge, open Offers and check mobile, tablet and desktop layouts. Check mock mode works offline, live mode shows actual source/conditions, an empty response stays empty, and an invalid or unavailable server shows a clear error with retry. Never publish account-specific results.
5. If the MCP connection fails: verify the App/server are using HTTP, the correct URL and your own unexpired token; review service status and consent. For 401 check credentials; for 429 slow down and retry later. Do not expose the token when asking for help.

## Evidence and completion

Capture **your own** redacted screenshots: (1) Edge showing the MCP landing page before sign-in; (2) Copilot App showing connected server status and a read-only tool result, with account data masked; (3) the Offers page at phone and desktop sizes. The reference screenshot above is not evidence that your own connection succeeded.

Finish when the App can discover and query read-only tools, the application defaults to mock mode, and the optional server-side live adapter displays real data or a clear error. Keep your app and MCP configuration for [Lab 3](../lab3/).
