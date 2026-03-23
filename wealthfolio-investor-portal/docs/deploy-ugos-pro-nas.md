# UGOS Pro NAS Deploy Guide

This guide assumes you will deploy the portal with the UGOS Pro Docker app using a Docker Compose project.

## What gets deployed

- `portal-db`: PostgreSQL 16
- `portal-app`: Next.js investor portal

On container startup, `portal-app` will automatically:

1. Run database migrations
2. Create or update the admin login from env vars
3. Start the web server

That means you do **not** need to enter the container to run `db:migrate` or `db:seed`.

## Recommended NAS folder layout

Create one project folder on the NAS, for example:

```text
/volume1/docker/wealthfolio-investor-portal/
├── compose.yml
├── .env
└── tmp/
```

If you prefer keeping local Wealthfolio backup files on the NAS for manual testing, you can also prepare:

```text
/volume1/docker/wealthfolio-backups/master/
/volume1/docker/wealthfolio-backups/distribution/
```

## 1. Get the project onto the NAS

Choose one:

- Clone the repo onto the NAS
- Or copy the `wealthfolio-investor-portal` folder from your Mac to the NAS

At minimum, keep these files together:

- `compose.yml`
- `Dockerfile`
- `.env`
- `package.json`
- `package-lock.json`
- `src/`
- `public/`
- `scripts/`

## 2. Create the env file

Start from `.env.example` and save it as `.env`.

Minimum required values:

```env
DATABASE_URL=postgres://wealthfolio:wealthfolio@portal-db:5432/wealthfolio_investor_portal
MASTER_BASE_URL=http://YOUR_MASTER_IP:8088
MASTER_PASSWORD=YOUR_MASTER_PASSWORD
DISTRIBUTION_BASE_URL=http://YOUR_DISTRIBUTION_IP:8089
DISTRIBUTION_PASSWORD=YOUR_DISTRIBUTION_PASSWORD
PUBLISH_TMP_DIR=/app/tmp/publish
SESSION_COOKIE_SECRET=CHANGE-THIS-TO-A-LONG-RANDOM-STRING
ADMIN_USERNAME=admin
ADMIN_EMAIL=
ADMIN_PASSWORD=1234
```

Notes:

- `DATABASE_URL` should stay pointed at `portal-db` inside Docker Compose
- `PUBLISH_TMP_DIR` should stay `/app/tmp/publish`
- `SESSION_COOKIE_SECRET` should be at least 16 characters, but use a long random string in production
- `ADMIN_PASSWORD=1234` matches the current local setup you asked for

## 3. Keep `compose.yml` in the same folder

The included `compose.yml` already:

- Builds the app image locally on the NAS
- Starts PostgreSQL
- Waits for DB health before starting `portal-app`
- Mounts `./tmp` into `/app/tmp`
- Exposes the portal at port `3001`

Default URL after startup:

```text
http://NAS-IP:3001
```

## 4. Deploy with the UGOS Docker app

Typical flow in UGOS Pro:

1. Open **Docker**
2. Create a **Project**
3. Point it to `/volume1/docker/wealthfolio-investor-portal/compose.yml`
4. Confirm the `.env` file is in the same folder
5. Click **Deploy / Start**

If UGOS asks whether to build locally, allow it.

## 5. First boot checks

After containers start, check the `portal-app` logs.

You want to see lines similar to:

```text
[init] applied migration ...
[init] created admin account admin
```

Or, on later restarts:

```text
[init] refreshed admin account admin
```

Then open:

```text
http://NAS-IP:3001/login
```

Default admin login:

- Username: `admin`
- Password: `1234`

## 6. First actions after login

1. Go to `/admin/investors`
2. Create each investor account
3. Set the `Distribution Account` mapping
4. Set the `Fund Asset` mapping
5. Go to `/admin/publish`
6. Run a publish

If both Wealthfolio instances are reachable from the NAS, the publish flow will:

- Log into both instances
- Trigger each backup route
- Download backup DB snapshots
- Rebuild the Postgres published view

## 7. Network requirements

The NAS must be able to reach:

- `MASTER_BASE_URL`
- `DISTRIBUTION_BASE_URL`

If your Wealthfolio instances run on another machine in the same LAN, test from the NAS side first.

Examples:

- `http://192.168.5.14:8088`
- `http://192.168.5.14:8089`

## 8. Updating the portal later

When you pull new code:

1. Replace or `git pull` the portal folder on the NAS
2. Rebuild the project in UGOS / Docker Compose
3. Start again

The app container will re-run migrations automatically, so schema updates are applied on boot.

## 9. Troubleshooting

### App container restarts immediately

Check:

- `DATABASE_URL` is valid
- `portal-db` is healthy
- `SESSION_COOKIE_SECRET` is set

### Publish fails

Check:

- `MASTER_BASE_URL` / `DISTRIBUTION_BASE_URL` are reachable from the NAS
- Wealthfolio passwords are correct
- Wealthfolio backup route still responds

### Login page loads but sign-in fails

Check `portal-app` logs for the init message. If needed, restart `portal-app`; startup will refresh the admin password again from `.env`.

## 10. Optional manual backup-file testing

For Mac local testing, the portal already supports reading backup `.db` files directly from absolute paths.

For NAS deployment, the normal recommended path is still:

- use live Wealthfolio login
- let the portal trigger the official backup route

That keeps the publish flow closest to production.
