# Ordering workshop example

This is the Lab 1 sample used in the workshop screenshots. All menu items, prices, checkout and offers are mock data. Lab 2 adds an optional read-only MCP connection.

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

## Auto versus fixed GPT-6 Luna

Lab 1's 20-minute route includes a same-prompt comparison of Auto and explicitly fixed `gpt-6-luna`, without Decision Router or Azure setup. See the [English guide](../README.md) or [中文指南](../README.zh.md) for the App picker steps, reproducible CLI commands, measured results and cache caveats.

The sanitized paired records omit session IDs and private metadata:

```bash
python3 compare_usage.py Auto=usage-example/auto-vs-luna-auto.json FixedLuna=usage-example/auto-vs-luna-fixed.json
```

Both measured runs executed GPT-6 Luna. Their cache-read counts differ, so the observed credits cannot isolate the effect of Auto versus a fixed model. The older `auto.json`, `decision.json`, `sol.json` and `terra.json` remain a separate historical example, not part of this new pair.
