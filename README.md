# poloHive — Angular frontend scaffold

This repo contains a scaffold of the Angular frontend for the poloHive fullstack application.

What this scaffold provides
- Minimal Angular app structure with components and services.
- Placeholder integrations for Supabase (users/auth), Airtable (storage), and an AI service.
- Services: auth, supabase, airtable, scrape, email, ai, logging.
- UI: login/register, guest, admin toggle, navbar with user avatar and settings.

Important: This is a scaffold with working service hooks. You must create the Supabase project and Airtable base, and set the environment keys described below.

Suggested free backend: Supabase (free tier includes DB storage — typically >100MB; if you require strictly <=100MB consider a small Postgres on Railway or a small Supabase DB). Supabase is recommended for auth + Postgres storage.

Setup
1. Install dependencies:

```bash
npm install
```

2. Provide environment variables (create `src/environments/environment.ts` following `environment.sample.ts`). Required keys:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `AIRTABLE_API_KEY`
- `AIRTABLE_BASE_ID`
- `AIRTABLE_TABLE_NAME`
- `AI_API_KEY` (for your AI provider)

3. Run locally:

```bash
npm start
```

Auth and 2FA
- Google OAuth: configure in Supabase and provide credentials in Supabase dashboard.
- 2FA: TOTP/phone code support is stubbed — instructions and integration points are in `AuthService`.

Scraping
- The app provides a `ScrapeService` with a hook to call a backend scraping endpoint (recommended to reuse your existing `dexhiveScrap` code as a backend microservice). The frontend will send target URL and options and receive email list results which are then stored in Airtable.

Email sending & tracking
- `EmailService` contains methods to send emails (with attachments) and track sendDate and replyDate. You will need to configure an email-sending backend (SMTP or a transactional email service) and wire its endpoint.

AI integration & NGRX
- The `AiService` provides hooks for analyzing replies and writing results to Airtable. NGRX store is scaffolded; subscribe to updates to sync client state.

Push to GitHub
I cannot push directly from here. To push to your repo `https://github.com/ikrigel/poloHive`:

```bash
git init
git add .
git commit -m "Initial Angular scaffold for poloHive"
git remote add origin https://github.com/ikrigel/poloHive.git
git push -u origin main
```

What I need from you to continue implementation
- Supabase project details or permission to create/use one.
- Airtable API key and Base/Table IDs.
- OAuth client id/secret if not using Supabase social setup.
- Confirmation if you want me to continue and implement server-side scraping/email microservices and push changes.
