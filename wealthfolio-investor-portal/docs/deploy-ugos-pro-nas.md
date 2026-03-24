# UGOS Pro NAS Deploy Guide

This guide uses the simpler deployment model:

- build the app image on your Mac first
- copy only the Docker image tar + compose/env files to the NAS
- run the portal on the NAS without copying `src/` or the full project

## Recommended deployment model

For your use case, there are two possible Docker flows:

### 1. Build on the NAS

The NAS receives the whole project folder and runs Docker build there.

That means the NAS needs:

- `Dockerfile`
- `package.json`
- `package-lock.json`
- `src/`
- `public/`
- `scripts/`

This works, but it is not the simplest setup.

### 2. Prebuilt image on your Mac

Your Mac builds the final app image first.  
The NAS only receives:

- one Docker image tar file
- `compose.nas.yml`
- `docker-compose.yaml`
- `compose.yml`
- `.env`
- `tmp/` folder

This is the recommended approach here.

UGOS Pro has one extra rule here:

- the image should be imported into the local **Images** list first
- the Compose service should use the literal imported image name directly
- the app service should set `pull_policy: never` so UGOS does not try to fetch from a remote registry

## What you need on the NAS

Create one folder on the NAS, for example:

```text
/volume1/docker/wealthfolio-investor-portal/
├── compose.nas.yml
├── .env
└── tmp/
```

That is enough for deployment.

You do **not** need to copy:

- `src/`
- `Dockerfile`
- `package.json`

when you use the prebuilt image flow.

## Step 1: Build the image on your Mac

From the portal folder on your Mac:

```bash
cd /Users/ericma/Developer/GitHub/wealthfolio/wealthfolio-investor-portal
./scripts/export-nas-image.sh
```

Default output:

```text
/Users/ericma/Developer/GitHub/wealthfolio/wealthfolio-investor-portal/dist/wealthfolio-investor-portal-latest.tar
```

Default image name:

```text
wealthfolio-investor-portal:latest
```

Default NAS copy target:

```text
/Volumes/docker/wealthfolio-investor-portal-1
```

If that SMB path is mounted on your Mac, the script will automatically copy:

- the exported `.tar`
- `compose.nas.yml`
- `docker-compose.yaml`
- `compose.yml`

into that NAS folder for you.

## Step 2: Check NAS CPU architecture

If your NAS is x86_64 / Intel, the default script setting is correct:

```text
TARGET_PLATFORM=linux/amd64
```

If you want to confirm, run on the NAS:

```bash
uname -m
```

Common results:

- `x86_64` → use `linux/amd64`
- `aarch64` → use `linux/arm64`

If your NAS is ARM, rebuild on your Mac like this:

```bash
TARGET_PLATFORM=linux/arm64 ./scripts/export-nas-image.sh
```

## Step 3: Copy files to the NAS

Copy these items to the NAS project folder:

- `compose.nas.yml`
- `docker-compose.yaml`
- `compose.yml`
- `.env`
- the exported `.tar` image file

Also create:

- `tmp/`

## Step 4: Import the image in the UGOS Docker app

In UGOS Pro:

1. open the **Docker** app
2. go to **Images**
3. click **Import**
4. upload `wealthfolio-investor-portal-latest.tar`
5. wait for the image to appear in the local image list

After import, check the exact local image name shown in UGOS.

Example:

```text
wealthfolio-investor-portal:latest
```

The NAS compose file already points directly to:

```text
wealthfolio-investor-portal:latest
```

For normal updates, keep importing that same tag so you do not need to edit compose every time.

## Step 5: Prepare `.env`

Start from `.env.example` and save it as `.env`.

Recommended values:

```env
DATABASE_URL=postgres://wealthfolio:wealthfolio@portal-db:5432/wealthfolio_investor_portal
MASTER_BASE_URL=http://YOUR_MASTER_IP:8088
MASTER_PASSWORD=
DISTRIBUTION_BASE_URL=http://YOUR_DISTRIBUTION_IP:8089
DISTRIBUTION_PASSWORD=
PUBLISH_TMP_DIR=/app/tmp/publish
SESSION_COOKIE_SECRET=CHANGE-THIS-TO-A-LONG-RANDOM-STRING
ADMIN_USERNAME=admin
ADMIN_EMAIL=
ADMIN_PASSWORD=1234
PORTAL_APP_IMAGE=wealthfolio-investor-portal:latest
```

Notes:

- `DATABASE_URL` should stay pointed at `portal-db`
- `PUBLISH_TMP_DIR` should stay `/app/tmp/publish`
- Leave `MASTER_PASSWORD` / `DISTRIBUTION_PASSWORD` empty if that Wealthfolio instance runs with `WF_AUTH_REQUIRED=false`
- Keep both `MASTER_BASE_URL` and `DISTRIBUTION_BASE_URL` because the portal still talks to two separate source instances, usually with different ports

## Step 6: Optional terminal import method

On the NAS, go into the folder that contains the tar file and run:

```bash
docker load -i wealthfolio-investor-portal-latest.tar
```

You can check the image exists:

```bash
docker images | grep wealthfolio-investor-portal
```

If you already imported the tar from the UGOS **Images** page, you do not need this terminal import step.

## Step 7: Deploy on the NAS

Use the UGOS Docker app or terminal-based Docker Compose.

If using terminal:

```bash
docker compose -f compose.nas.yml up -d
```

If using the UGOS Docker app:

1. Create a Docker project
2. Point it to the updated compose file in the folder
3. Make sure `.env` is in the same folder
4. Make sure the imported local image name matches `PORTAL_APP_IMAGE`
5. Start the project

If UGOS silently prefers `docker-compose.yaml` or `compose.yml`, that is fine because the export script writes the same content to all three filenames.

`compose.nas.yml` already sets:

```yaml
pull_policy: never
```

so UGOS should use only the local image and skip remote pulling for `portal-app`.

## Step 8: First boot check

After startup, check logs:

```bash
docker compose -f compose.nas.yml logs -f portal-app
```

You want to see something like:

```text
[init] applied migration ...
[init] created admin account admin
```

or on later restarts:

```text
[init] refreshed admin account admin
```

Then open:

```text
http://NAS-IP:3001/login
```

Default login:

- Username: `admin`
- Password: `1234`

## What happens automatically

When `portal-app` starts, it will automatically:

1. connect to PostgreSQL
2. run DB migrations
3. create or refresh the admin account
4. start the web app

So you do **not** need to manually enter the container to run migration or seed commands.

## What `tmp/` is for

`tmp/` is only a temporary working folder used during publish.

The portal uses it to:

1. store the downloaded Master backup snapshot
2. store the downloaded Distribution backup snapshot
3. read those snapshots into Postgres
4. remove the temp files afterwards

It is not the main database and it does not store investor-facing portal data long term.

## Updating later

When you have a new version:

1. rebuild and export a new tar on your Mac
2. import the new tar into UGOS **Images** or run `docker load -i ...` on the NAS
3. confirm the local image tag still matches `PORTAL_APP_IMAGE`
4. restart the compose project

Use a one-off unique tag only when you are debugging image cache problems.

## Troubleshooting

### Login fails

Check:

- the app logs show the init message
- `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env`

Restarting `portal-app` will refresh the admin password from `.env`.

### Publish fails

Check:

- `MASTER_BASE_URL` is reachable from the NAS
- `DISTRIBUTION_BASE_URL` is reachable from the NAS
- both Wealthfolio passwords are correct

### `pull access denied` for `wealthfolio-investor-portal`

This means UGOS tried to fetch from a remote registry instead of using your imported local image.

Check:

- the image was imported successfully in **Images**
- the imported local name exactly matches `PORTAL_APP_IMAGE`
- `portal-app` has `pull_policy: never`

### Wrong architecture image

If the container cannot start because of CPU architecture mismatch, rebuild the image tar on your Mac with the correct `TARGET_PLATFORM`.
