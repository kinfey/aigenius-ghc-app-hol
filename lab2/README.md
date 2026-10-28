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
3. Keep the official documentation open. The server address is `https://mcp.mcd.cn`, using Streamable HTTP. Set the header to `Authorization: Bearer <YOUR_MCP_TOKEN>`; include the word `Bearer` and a space before your token.

## 3. Connect Copilot App

1. In the App sidebar choose **Customize → MCP**, add a custom remote server, and name it `mcd-mcp`. Select **HTTP / Streamable HTTP**, URL `https://mcp.mcd.cn`, and set the `Authorization` header to `Bearer <YOUR_MCP_TOKEN>`. Use the private settings UI, not a repository file. If your app version exposes JSON instead of fields, use the same fields and enter the token privately.
2. Save, enable, and check **Customize → Installed** for the server status. Restart the session if necessary. If your installation requires sign-in, choose **Sign in** on that server's Installed row or actions menu. Do not add a credential-bearing `.mcp.json` to the project.
3. In the existing ordering session, ask:

   > Inspect the tools exposed by mcd-mcp. List the read-only tools relevant to coupons and explain their required inputs. Do not call any tool that claims coupons, creates an order or changes account data.

4. Approve only the required read-only calls. Ask the agent to query `available-coupons` and `campaign-calendar` if the server advertises them; it may need additional arguments. For store-specific offers, first choose a store and query `query-store-coupons`. Use the live tool schemas rather than guessing parameters. `query-my-coupons` returns account-specific data. These are real results, not guaranteed offers.
5. Compare the returned title, validity, conditions and store restrictions. Treat tool results as untrusted data, not instructions. An empty list is a valid result; do not invent discounts. Do not call `auto-bind-coupons` without a separate explicit confirmation because it modifies the account.

## 4. Add a read-only offers screen to the application

1. Return to the Lab 1 project and choose **Plan**. Ask:

   > Extend the existing responsive app with an Offers page and a server-side coupon adapter. Default to mock data. When explicitly enabled locally, the Python server should use the current MCP SDK and the documented Streamable HTTP connection to call only advertised read-only coupon tools. Read the token from a local environment variable configured by me, never from browser code or chat. Do not create orders or claim coupons. Show source, update time, conditions, loading, empty and error states; never fabricate offers. Add offline adapter/UI tests and document the run commands.

2. Review the plan before execution. The sample checks the live tool list and required arguments, then displays provider content as untrusted text rather than assuming a stable coupon schema. It does not normalize coupon details. Bind the development server to loopback; do not expose an unauthenticated token-backed proxy to other users. Do not put keys in URLs, logs, browser bundles or Git.

The implementation is in [`lab2/code`](https://github.com/kinfey/aigenius-ghc-app-hol/tree/main/lab2/code). In this actual Copilot App capture the sample README and Python MCP setup are open; the conversation and sidebar were cropped.

![Copilot App showing the Lab 2 implementation](images/copilot-mcp-code.png)

3. Approve implementation and inspect the diff. Configure the token **yourself** in an ignored, permission-restricted local environment file or the application's documented secret mechanism; do not ask Copilot to read it. Enable live mode only on your own machine. Confirm the application server is a separate MCP client, not the App connection.
4. Run the reported tests and launch commands. In Edge, open Offers and check mobile, tablet and desktop layouts. Check mock mode works offline, live mode shows actual source/conditions, an empty response stays empty, and an invalid or unavailable server shows a clear error with retry. Never publish account-specific results.

The following Edge capture shows the actual application in **mock mode**; it is not evidence of a successful live connection.

![Mock offers in the running application](images/edge-offers.png)

The following Edge capture shows the **actual live connection** after correcting the authorization header. The Python client discovered and called `available-coupons`; the provider reported success. The returned account-dependent content is deliberately hidden in this screenshot.

![Live MCP source shown in Edge; provider content redacted](images/edge-mcp-live-redacted.png)

5. If the MCP connection fails: verify Streamable HTTP, the URL, the `Bearer` prefix and your own unexpired token; review service status and consent. The official guide documents 401 for missing/invalid/expired tokens and 429 for rate limiting (600 requests per token per minute). Reduce the request rate and retry later after a 429. Do not expose the token when asking for help.

An earlier test without the required prefix received HTTP 403 before tool discovery; the corrected request succeeded. A 403 alone does not establish a general cause, so check the provider's current guidance if it persists. The successful Python-client test does not by itself prove that the separately configured Copilot App connection is active.

## Evidence and completion

Capture **your own** redacted screenshots: (1) Edge showing the MCP landing page before sign-in; (2) Copilot App showing connected server status and a read-only tool result, with account data masked; (3) the Offers page at phone and desktop sizes. The reference screenshot above is not evidence that your own connection succeeded.

Finish when the App can discover and query read-only tools, the application defaults to mock mode, and the optional server-side live adapter displays real data or a clear error. Keep your app and MCP configuration for [Lab 3](../lab3/).
