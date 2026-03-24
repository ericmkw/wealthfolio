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
2. Set `MASTER_BASE_URL`, `DISTRIBUTION_BASE_URL`, and optionally `MASTER_PASSWORD` / `DISTRIBUTION_PASSWORD`
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

Remote publish notes:

- `MASTER_BASE_URL` and `DISTRIBUTION_BASE_URL` stay separate because they point to two source instances, usually on different ports
- Leave `MASTER_PASSWORD` / `DISTRIBUTION_PASSWORD` empty if that Wealthfolio instance runs with auth disabled
- `tmp/` is only a temporary workspace for downloaded backup snapshots during publish

## NAS quick deploy

If you want the simplest NAS flow, do **not** copy the source code to the NAS.

Use the prebuilt-image flow instead:

1. Build and export the Docker image on your Mac
2. Copy the `.tar` image file to the NAS
3. Import the tar in UGOS **Images** or run `docker load -i ...` on the NAS
4. Deploy with `compose.nas.yml` + `.env`

Helper command:

```bash
./scripts/export-nas-image.sh
```

By default it keeps the image tag at `wealthfolio-investor-portal:latest`, and the NAS compose file uses that literal image name directly.

If `/Volumes/docker/wealthfolio-investor-portal-1` is mounted on your Mac, the script also auto-copies:

- the exported image tar
- `compose.nas.yml`
- `docker-compose.yaml`
- `compose.yml`

to that SMB folder.

All three copied compose files use the same content. This avoids UGOS accidentally reading an older `docker-compose.yaml` or `compose.yml`.

`compose.nas.yml` sets `image: wealthfolio-investor-portal:latest` and `pull_policy: never` for `portal-app`, so UGOS uses the imported local image instead of trying to pull from a registry.

For the full UGOS Pro walkthrough, see `docs/deploy-ugos-pro-nas.md`

## Local development

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

## Publish flow

1. Admin triggers `/admin/publish`
2. Portal logs into both Wealthfolio web instances or reads the selected local backups
3. Portal downloads consistent backup snapshots from both instances
4. Portal rebuilds Postgres read models and source-option metadata atomically
5. Admin configures investor mappings in `/admin/investors`

## Notes

- `Master` contributes fund operation metadata and redacted holdings-composition metrics
- `Distribution` contributes investor NAV, units, performance, and personal cashflows
- Shares, total value, dollar P&L, and position size are never exposed in the fund activity UI or API
- For local testing on your Mac, `/admin/publish` also accepts absolute backup `.db` paths directly if the Node process can read them
- For UGOS Pro / NAS deployment, see `docs/deploy-ugos-pro-nas.md`
