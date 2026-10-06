# Public deployment checklist

This package is local/runnable; no cloud resources were provisioned and no public URL was created. The Docker recipe below has not been deployed or tested against a cloud host in this session.

## Local machine

`npm start` binds to `127.0.0.1:3000` by default. A custom `.env` port is supported. Opening the project directory's `public/index.html` directly will not load browser modules reliably; use the server or the separately bundled self-contained preview.

## Node-capable host

Use a Node 22 host with an HTTPS public URL. Configure environment secrets through that host, not by committing `.env`:

```dotenv
HOST=0.0.0.0
PORT=3000
GEMINI_API_KEY=your_server_key
GEMINI_MODEL=gemini-3.8-flash
APP_ACCESS_TOKEN=a_long_random_reviewer_password_of_at_least_16_characters
AI_REQUESTS_PER_HOUR=120
AI_MAX_CONCURRENT=2
AI_TIMEOUT_MS=45000
```

The start command is `npm start`; there are no npm packages to install and no frontend build required. Hosts may supply their own PORT value. The built-in `.env` reader never overwrites existing environment values.

For a key-enabled non-loopback bind, the app refuses startup without a sufficiently long reviewer password. Do not disable that check to make an unrestricted public AI endpoint. Share the reviewer password separately from the URL. Static assets and the fictional sample are public; API calls require the password. This is a shared reviewer gate, not individual user accounts.

At the reverse proxy, preserve the external Host header so the same-origin check matches the browser Origin. Terminate TLS with a valid certificate. Do not expose plain HTTP over the internet or log request bodies. Set provider-side spending/usage controls as an additional guardrail.

## Docker recipe

```sh
docker build -t memorytrail-part5 .
# Set APP_ACCESS_TOKEN in .env first when GEMINI_API_KEY is present.
docker run --rm --env-file .env -e HOST=0.0.0.0 -p 3000:3000 memorytrail-part5
```

The image runs as the unprivileged `node` user. There is no server photo volume because selected copies stay in each reviewer's browser. A deployment URL is a new storage origin; it will not contain photos previously imported at localhost.

## Before sharing a submission link

- Open the HTTPS URL in a private window; check all assets and mobile layout.
- Verify API calls are refused without the reviewer password and succeed with it.
- Use **Test live AI (1 call)**. Check the returned model and handle access/quota errors before involving participants.
- Import several consented JPEG images, authorize analysis, review captions, and retrieve a genuinely remembered target.
- Reload: confirm native IndexedDB persistence, then delete the uploaded copies and confirm removal. Native origin-based persistence needs this manual check; engineering UI tests used storage doubles.
- Exercise an empty result, an incorrect clue, a near-match, a rejection/undo, timeout behavior and a wrong-target confirmation.
- Run a real participant task, export its observations and keep sample/engineering runs out of research results.
- Confirm the public URL and reviewer-access instructions can actually be opened by the evaluator.

## Production work not included

Per-user authentication, encrypted storage, a shared database, tenant isolation, account-level deletion, audit/compliance processes, distributed rate limiting, full-library vector retrieval, deduplication of near-identical photos and operational monitoring are not implemented. A successful pilot is not evidence that these production requirements are solved.
