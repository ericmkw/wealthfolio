# Wealthfolio Investor Portal

Read-only investor reporting portal for a dual-Wealthfolio fund workflow.

## Stack

- Next.js 15
- PostgreSQL 16
- Drizzle ORM
- better-sqlite3
- axios + tough-cookie

## Features

- Local admin/investor login with Argon2id password hashes
- Manual publish flow that snapshots both Wealthfolio instances
- Fund-wide activity feed with size redaction
- Investor-only cashflows
- Investor overview with units, latest NAV, latest unit price, and published history

## Quick start

1. Copy `.env.example` to `.env`
2. Set `MASTER_BASE_URL`, `MASTER_PASSWORD`, `DISTRIBUTION_BASE_URL`, `DISTRIBUTION_PASSWORD`
3. Start PostgreSQL and the app:

```bash
docker compose -f compose.yml up --build -d
```

4. Wait for the app container to finish its automatic database init:

```bash
docker compose -f compose.yml logs -f portal-app
```

5. Open [http://localhost:3001](http://localhost:3001)

Docker startup now does both automatically:

- Runs all SQL migrations
- Creates or refreshes the admin account from `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`

## Local development

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

## Publish flow

1. Admin configures investor mappings in `/admin/investors`
2. Admin triggers `/admin/publish`
3. Portal logs into both Wealthfolio web instances
4. Portal downloads consistent backup snapshots from both instances
5. Portal rebuilds Postgres read models and switches the current published version atomically

## Notes

- `Master` contributes fund operation metadata and redacted holdings-composition metrics
- `Distribution` contributes investor NAV, units, performance, and personal cashflows
- Shares, total value, dollar P&L, and position size are never exposed in the fund activity UI or API
- For local testing on your Mac, `/admin/publish` also accepts absolute backup `.db` paths directly if the Node process can read them
- For UGOS Pro / NAS deployment, see `docs/deploy-ugos-pro-nas.md`
