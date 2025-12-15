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
