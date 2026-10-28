# Build a responsive ordering experience with GitHub Copilot App

[简体中文](https://kinfey.github.io/aigenius-ghc-app-hol/zh.html) · [繁體中文](https://kinfey.github.io/aigenius-ghc-app-hol/traditional.html) · [GitHub repository](https://github.com/kinfey/aigenius-ghc-app-hol)

In this **60-minute** hands-on workshop, you will use **GitHub Copilot App** to build a responsive ordering application, connect to the McDonald's China MCP service, and run a human-in-the-loop guided application in the Browser canvas. This is an independent educational exercise, not an official McDonald's product.

| Lab | Outcome | Suggested time |
| --- | --- | --- |
| [Lab 1: Build and compare](lab1/) | Responsive app and same-task Auto versus fixed GPT-6 Luna | 20 min |
| [Lab 2: Connect MCP](lab2/) | Connect MCP and query real read-only coupon information | 15 min |
| [Lab 3: Guided ordering in a canvas](lab3/) | Real MCP wizard, menu handling and explicit approval gates | 25 min |
| **Total** | **Three labs, one continuous application** | **60 min** |

Install tools, restore sample dependencies, sign in, and prepare your own private MCP token **before class**. Use the included starter implementations to keep the live work bounded. Decision Router/Azure deployment, repeated model benchmarks, native SDK extension authoring, real purchasing and payment are optional after-class work, not additional requirements within the 60 minutes.

## Before you start

- Install [GitHub Copilot App](https://github.com/features/copilot/copilot-app), Git, Node.js 22.16 or later and Microsoft Edge. Sign in with an account entitled to use Copilot. Menus and model availability vary by version and policy.
- Have a mainland China McDonald's account and access to [open.mcd.cn](https://open.mcd.cn/) for Labs 2–3. Terms, account eligibility, service availability, and tool schemas can change.
- Lab 1's optional Decision Router requires access to the private [router repository](https://github.com/kinfey/decision-ghc-router), Copilot CLI and an Azure subscription with a Microsoft Foundry deployment of Microsoft-Decision-1. Auto and fixed GPT-6 Luna require none of these additional router prerequisites.
- Work in a **new local project**, separate from this tutorial repository. Keep one continuous application and main session across the three labs; use separate fresh, read-only sessions for Lab 1's model comparison.
- Real services and models can incur charges. Never publish API keys, tokens, private endpoints, addresses, order details or screenshots containing them. Use your own credentials and rotate any that have been exposed.

Each lab has an English `README.md`, a Simplified Chinese `README.zh.md` and a Traditional Chinese `README.tranditional.md`. The guides distinguish public-documentation screenshots from actual App and Edge captures of the workshop implementation. Real-service screenshots must never expose credentials or account information.

**Current status:** All three labs include runnable code and implementation captures. Lab 3 reuses [`lab2/code`](https://github.com/kinfey/aigenius-ghc-app-hol/tree/main/lab2/code) rather than duplicating the application, with complete [English](lab3/), [Simplified Chinese](lab3/zh.html) and [Traditional Chinese](lab3/traditional.html) instructions, generated-file links and screenshots. Its Browser canvas application is implemented; a registered custom SDK canvas extension is a separate optional deliverable. Live connection/menu screenshots are distinguished from the explicitly labeled offline confirmation fixture; no real order or payment was made for the workshop evidence.

GitHub Pages hosts the trilingual guides and screenshots, not the credential-bearing Python application. Run that application locally using its README.

Start with [Lab 1](lab1/).
