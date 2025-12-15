poloHive server skeleton

This is a lightweight Express server with endpoints used by the poloHive frontend:
- `POST /api/scrape` — accepts `{ url }` and returns `{ emails: [] }`.
- `POST /api/send-email` — accepts email payload and sends via SMTP.
- `POST /api/ai/analyze` — placeholder AI analyze endpoint.

Setup
1. Copy `.env.sample` to `.env` and fill in credentials.
2. Install and run:

```bash
cd server
npm install
npm start
```

Notes
- Scraping is simple and intended as a placeholder. For robust scraping reuse your `dexhiveScrap` project as a microservice and wire it here.
- Email sending uses `nodemailer` and requires SMTP credentials.
- Airtable writes are optional; if configured, results are stored to the configured table.

New endpoints
- `POST /api/scrape/start` — start a scrape job, body: `{ url, maxDepth?, maxPages? }`. Returns `{ jobId }`.
- `GET /api/scrape/status/:id` — get job status and results.

Proxy, robots, rate-limiting
- You can configure rotating proxies via the `PROXIES` environment variable (comma-separated list):
	`PROXIES=http://proxy1:3128,http://proxy2:3128`
- The scraper checks `robots.txt` for each host and will skip URLs disallowed for `poloHive-bot` (or `*`).
- Per-host minimum delay can be set via `SCRAPE_MIN_DELAY_MS` (default `1000`).

Notes on scraping
- The server now contains a simple job queue with configurable concurrency via `SCRAPE_CONCURRENCY` env var. It performs retries, rotates user-agents, and optionally crawls same-origin links up to `maxDepth`.
- For production-scale scraping, integrate your `dexhiveScrap` project for better parsing, headless browsing, proxy support, and obey `robots.txt`.
