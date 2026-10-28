# Build a responsive ordering experience with GitHub Copilot App

[简体中文](https://kinfey.github.io/aigenius-ghc-app-hol/zh.html) · [GitHub repository](https://github.com/kinfey/aigenius-ghc-app-hol)

In this hands-on workshop, you will use **GitHub Copilot App** to build a responsive ordering application, connect to the McDonald's China MCP service, and create a human-in-the-loop ordering canvas. This is an independent educational exercise, not an official McDonald's product.

| Lab | Outcome | Suggested time |
| --- | --- | --- |
| [Lab 1: Build and route](lab1/) | Responsive front end, local API, Auto and optional Decision Router | 90 min |
| [Lab 2: Connect MCP](lab2/) | Query real coupon information with your own account | 60 min |
| [Lab 3: Create a canvas](lab3/) | A visible ordering workflow with explicit approval gates | 60 min |

## Before you start

- Install [GitHub Copilot App](https://github.com/features/copilot/copilot-app), Git, Node.js 22.16 or later and Microsoft Edge. Sign in with an account entitled to use Copilot. Menus and model availability vary by version and policy.
- Have a mainland China McDonald's account and access to [open.mcd.cn](https://open.mcd.cn/) for Labs 2–3. Terms, account eligibility, service availability, and tool schemas can change.
- Lab 1's optional Decision Router requires access to the private [router repository](https://github.com/kinfey/decision-ghc-router), Copilot CLI and an Azure subscription with a Microsoft Foundry deployment of Microsoft-Decision-1. Auto requires none of these additional router prerequisites.
- Work in a **new local project**, separate from this tutorial repository. Keep one continuous application and session across the three labs.
- Real services and models can incur charges. Never publish API keys, tokens, private endpoints, addresses, order details or screenshots containing them. Use your own credentials and rotate any that have been exposed.

Each lab has an English `README.md` and a Simplified Chinese `README.zh.md`. Screenshots in the guides are real browser captures of public documentation, not fabricated screenshots of a completed application. Follow each lab's capture checklist to create your own Copilot App and Edge evidence; redact personal data first.

Start with [Lab 1](lab1/).
