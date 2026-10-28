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
