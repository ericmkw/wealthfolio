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

4. Run migrations:

```bash
npm install
npm run db:migrate
```

5. Seed the admin account:

```bash
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=change-me npm run db:seed
```

6. Open [http://localhost:3001](http://localhost:3001)

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

- `Master` contributes only fund operation metadata
- `Distribution` contributes investor NAV, units, performance, and personal cashflows
- Shares, total value, and position size are never exposed in the fund activity UI or API
- For local testing on your Mac, `/admin/publish` also accepts absolute backup `.db` paths directly if the Node process can read them
