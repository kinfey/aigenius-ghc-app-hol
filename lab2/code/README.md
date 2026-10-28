# Ordering workshop example

This is the actual sample used in the workshop screenshots. All menu items, prices, checkout and default offers are mock data. The Python backend can optionally query McDonald's MCP read-only; it never creates an order or takes payment.

## Run locally

Python 3.11+ and Node.js 22.16+ are required. From this directory:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install --index-url https://packagefeedproxy.microsoft.io/pypi/simple/ -r requirements.txt
npm install
.venv/bin/python -m unittest backend.test_app
npm run build
.venv/bin/python -m uvicorn backend.app:app --host 127.0.0.1 --port 8000
```

In another terminal:

```bash
npm run dev
```

Open `http://127.0.0.1:5173`. Both servers bind to localhost. Do not expose this teaching server to an untrusted network.

To opt into read-only live offers, obtain your own token from https://open.mcd.cn/ and privately set `OFFERS_MODE=live` and `MCD_MCP_TOKEN` in the backend process environment before starting it. Do not commit the token, paste it into chat, place it in frontend code, or expose account-specific data in screenshots. The server discovers the `available-coupons` tool and only calls it if no required arguments are advertised; provider responses are displayed as untrusted text. It never silently falls back to mock mode on errors.

The backend adds the official `Bearer ` prefix to the token for the `Authorization` header. Set `MCD_MCP_TOKEN` to the token itself, without that prefix. Copilot App is a separate MCP client: configure its `Authorization` header as `Bearer <YOUR_MCP_TOKEN>` in its private settings.
