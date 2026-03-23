# Investor Portal I18n, Theme, Base Currency, And Market Data Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add multilingual UI, dark/light theme, display-layer base currency conversion, and Wealthfolio-derived latest FX/quote timestamps without cloning Wealthfolio's internal valuation engine.

**Architecture:** Keep Wealthfolio and the existing publish pipeline as the source of truth. Extend the portal projection DB with display settings and quote metadata, then compute localized, base-currency-adjusted presentation values inside the portal service layer. Pull the latest FX / manual fund quote data from the latest published Distribution snapshot rather than introducing a second market-data pipeline.

**Tech Stack:** Next.js 15 App Router, PostgreSQL 16, Drizzle ORM, better-sqlite3, Zod, Tailwind CSS.

---

### Task 1: Define the new display model

**Files:**
- Modify: `/Users/ericma/Developer/GitHub/wealthfolio/wealthfolio-investor-portal/src/db/schema.ts`
- Create: `/Users/ericma/Developer/GitHub/wealthfolio/wealthfolio-investor-portal/src/db/migrations/0002_display_preferences_and_quote_metadata.sql`
- Test: `/Users/ericma/Developer/GitHub/wealthfolio/wealthfolio-investor-portal/tests/overview-display.test.ts`

**Step 1: Write the failing test**

Add a test that expects the overview service to return:
- investor base currency code
- converted NAV / unit price values
- `fxRate`
- `fxUpdatedAt`
- `unitPriceUpdatedAt`

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/overview-display.test.ts`
Expected: FAIL because the service does not expose display metadata yet.

**Step 3: Add minimal schema**

Add these tables:
- `app_settings` for global defaults such as `default_locale`, `default_theme`, `default_base_currency`
- `user_preferences` for per-user `locale`, `theme`, `base_currency`
- `quote_reference_snapshots` for latest quote / FX metadata used by the UI

Keep this model small. Do not build a full pricing engine.

**Step 4: Run migration**

Run: `npm run db:migrate`
Expected: New tables exist and old data remains intact.

**Step 5: Re-run test**

Run: `npm test -- tests/overview-display.test.ts`
Expected: still FAIL, but now at service logic rather than missing schema.

---

### Task 2: Extend publish to persist quote and FX timestamps

**Files:**
- Modify: `/Users/ericma/Developer/GitHub/wealthfolio/wealthfolio-investor-portal/src/lib/publish/source-readers.ts`
- Modify: `/Users/ericma/Developer/GitHub/wealthfolio/wealthfolio-investor-portal/src/lib/publish/publish-service.ts`
- Modify: `/Users/ericma/Developer/GitHub/wealthfolio/wealthfolio-investor-portal/src/lib/publish/distribution-transform.ts`
- Test: `/Users/ericma/Developer/GitHub/wealthfolio/wealthfolio-investor-portal/tests/source-readers.test.ts`
- Test: `/Users/ericma/Developer/GitHub/wealthfolio/wealthfolio-investor-portal/tests/overview-display.test.ts`

**Step 1: Write the failing publish test**

Add a test that uses a tiny SQLite fixture and expects the portal to extract:
- latest fund unit quote value
- quote day
- latest FX quote for requested base currency pair
- FX quote day

**Step 2: Run the test to verify it fails**

Run: `npm test -- tests/source-readers.test.ts tests/overview-display.test.ts`
Expected: FAIL because quote timestamps / FX metadata are not persisted.

**Step 3: Implement minimal extraction**

From Distribution snapshot:
- keep using `quotes.close` for fund unit price
- read the latest relevant FX asset quote from `quotes`
- persist quote day and currency pair metadata into `quote_reference_snapshots`

Important:
- use only the latest published snapshot
- do not call Yahoo directly from the portal in v1 of this feature
- treat Wealthfolio’s stored quotes as source of truth

**Step 4: Re-run tests**

Run: `npm test -- tests/source-readers.test.ts tests/overview-display.test.ts`
Expected: PASS.

---

### Task 3: Add display-layer base currency conversion

**Files:**
- Modify: `/Users/ericma/Developer/GitHub/wealthfolio/wealthfolio-investor-portal/src/lib/services/overview-service.ts`
- Modify: `/Users/ericma/Developer/GitHub/wealthfolio/wealthfolio-investor-portal/src/lib/services/activity-service.ts`
- Modify: `/Users/ericma/Developer/GitHub/wealthfolio/wealthfolio-investor-portal/src/lib/utils.ts`
- Create: `/Users/ericma/Developer/GitHub/wealthfolio/wealthfolio-investor-portal/src/lib/fx.ts`
- Test: `/Users/ericma/Developer/GitHub/wealthfolio/wealthfolio-investor-portal/tests/overview-display.test.ts`

**Step 1: Write the failing conversion test**

Expect:
- USD-native snapshot still returns original numeric values when base currency is USD
- HKD base currency returns converted display values using latest FX quote
- response includes a “last updated” timestamp for the FX rate

**Step 2: Run test**

Run: `npm test -- tests/overview-display.test.ts`
Expected: FAIL because no conversion exists.

**Step 3: Implement minimal conversion helpers**

Rules:
- convert only display values
- never mutate stored source projection values
- support at least `USD`, `HKD`, and same-currency passthrough
- if FX pair is missing, fall back to source currency and expose `fxRate = null`

**Step 4: Re-run tests**

Run: `npm test -- tests/overview-display.test.ts`
Expected: PASS.

---

### Task 4: Add i18n for three locales

**Files:**
- Create: `/Users/ericma/Developer/GitHub/wealthfolio/wealthfolio-investor-portal/src/lib/i18n.ts`
- Create: `/Users/ericma/Developer/GitHub/wealthfolio/wealthfolio-investor-portal/src/lib/messages/en.ts`
- Create: `/Users/ericma/Developer/GitHub/wealthfolio/wealthfolio-investor-portal/src/lib/messages/zh-HK.ts`
- Create: `/Users/ericma/Developer/GitHub/wealthfolio/wealthfolio-investor-portal/src/lib/messages/zh-CN.ts`
- Modify: `/Users/ericma/Developer/GitHub/wealthfolio/wealthfolio-investor-portal/src/app/layout.tsx`
- Modify: `/Users/ericma/Developer/GitHub/wealthfolio/wealthfolio-investor-portal/src/components/layout/app-shell.tsx`
- Modify: `/Users/ericma/Developer/GitHub/wealthfolio/wealthfolio-investor-portal/src/components/auth/login-form.tsx`
- Modify: `/Users/ericma/Developer/GitHub/wealthfolio/wealthfolio-investor-portal/src/app/overview/page.tsx`
- Modify: `/Users/ericma/Developer/GitHub/wealthfolio/wealthfolio-investor-portal/src/app/activities/page.tsx`
- Test: `/Users/ericma/Developer/GitHub/wealthfolio/wealthfolio-investor-portal/tests/i18n.test.ts`

**Step 1: Write the failing locale test**

Expect:
- `en`
- `zh-HK`
- `zh-CN`

And verify date / number formatting changes with locale.

**Step 2: Run test**

Run: `npm test -- tests/i18n.test.ts`
Expected: FAIL because no locale layer exists.

**Step 3: Implement a minimal dictionary system**

Requirements:
- dictionary lookup only, no third-party i18n framework yet
- locale chosen by user preference, then global default
- `zh-HK` wording should read like Hong Kong Cantonese UI text
- `zh-CN` wording should use Mainland simplified Chinese style

**Step 4: Re-run tests**

Run: `npm test -- tests/i18n.test.ts`
Expected: PASS.

---

### Task 5: Add dark and light themes

**Files:**
- Modify: `/Users/ericma/Developer/GitHub/wealthfolio/wealthfolio-investor-portal/src/app/globals.css`
- Modify: `/Users/ericma/Developer/GitHub/wealthfolio/wealthfolio-investor-portal/src/app/layout.tsx`
- Modify: `/Users/ericma/Developer/GitHub/wealthfolio/wealthfolio-investor-portal/src/components/layout/app-shell.tsx`
- Create: `/Users/ericma/Developer/GitHub/wealthfolio/wealthfolio-investor-portal/src/components/layout/theme-toggle.tsx`
- Test: `/Users/ericma/Developer/GitHub/wealthfolio/wealthfolio-investor-portal/tests/theme.test.ts`

**Step 1: Write the failing theme test**

Expect:
- app renders with `data-theme="dark"` or `data-theme="light"`
- user preference overrides global default

**Step 2: Run test**

Run: `npm test -- tests/theme.test.ts`
Expected: FAIL because theme preference does not exist.

**Step 3: Implement minimal theming**

Requirements:
- CSS variables, not duplicated class trees
- support explicit `dark` and `light`
- no “system” mode in first pass unless it falls out naturally

**Step 4: Re-run tests**

Run: `npm test -- tests/theme.test.ts`
Expected: PASS.

---

### Task 6: Add settings surface for locale, theme, and base currency

**Files:**
- Create: `/Users/ericma/Developer/GitHub/wealthfolio/wealthfolio-investor-portal/src/app/settings/page.tsx`
- Create: `/Users/ericma/Developer/GitHub/wealthfolio/wealthfolio-investor-portal/src/app/api/me/preferences/route.ts`
- Modify: `/Users/ericma/Developer/GitHub/wealthfolio/wealthfolio-investor-portal/src/components/layout/app-shell.tsx`
- Modify: `/Users/ericma/Developer/GitHub/wealthfolio/wealthfolio-investor-portal/src/lib/auth/server.ts`
- Test: `/Users/ericma/Developer/GitHub/wealthfolio/wealthfolio-investor-portal/tests/preferences.test.ts`

**Step 1: Write failing API test**

Expect authenticated user can:
- read preferences
- update locale
- update theme
- update base currency

**Step 2: Run test**

Run: `npm test -- tests/preferences.test.ts`
Expected: FAIL because preferences API does not exist.

**Step 3: Implement minimal settings**

Requirements:
- admin and investor can both set their own preferences
- preference updates should affect subsequent page loads
- settings page should show “FX last updated” and “Fund quote last updated”

**Step 4: Re-run tests**

Run: `npm test -- tests/preferences.test.ts`
Expected: PASS.

---

### Task 7: Show quote and FX freshness in the UI

**Files:**
- Modify: `/Users/ericma/Developer/GitHub/wealthfolio/wealthfolio-investor-portal/src/app/overview/page.tsx`
- Modify: `/Users/ericma/Developer/GitHub/wealthfolio/wealthfolio-investor-portal/src/app/activities/page.tsx`
- Modify: `/Users/ericma/Developer/GitHub/wealthfolio/wealthfolio-investor-portal/src/lib/utils.ts`
- Test: `/Users/ericma/Developer/GitHub/wealthfolio/wealthfolio-investor-portal/tests/overview-display.test.ts`

**Step 1: Write failing UI/service test**

Expect overview to expose:
- source currency
- display base currency
- latest unit price timestamp
- latest FX timestamp

**Step 2: Run test**

Run: `npm test -- tests/overview-display.test.ts`
Expected: FAIL because timestamps are not shown.

**Step 3: Implement UI**

Show concise metadata blocks like:
- `Base currency: HKD`
- `FX rate: 7.84`
- `FX updated: Mar 22, 2026`
- `Fund quote updated: Mar 22, 2026`

Do not show fund-level total value or hidden position-size data.

**Step 4: Re-run test**

Run: `npm test -- tests/overview-display.test.ts`
Expected: PASS.

---

### Task 8: Final integration verification

**Files:**
- Modify: `/Users/ericma/Developer/GitHub/wealthfolio/wealthfolio-investor-portal/README.md`

**Step 1: Run full validation**

Run:
- `npm test`
- `npm run type-check`
- `npm run build`

Expected: all PASS.

**Step 2: Manual verification**

Verify:
- admin logs in with username
- investor logs in with username
- locale switch works
- dark/light theme persists
- base currency switch updates display values
- overview shows FX / quote updated timestamps
- publish still succeeds using latest auto-detected backup paths

**Step 3: Update README**

Document:
- supported locales
- theme support
- base currency display behavior
- source of FX / quote freshness data

**Step 4: Commit**

```bash
git add docs/plans src tests README.md
git commit -m "feat: add i18n theme and base currency display plan"
```

---

### Assumptions

- Wealthfolio backup already contains the latest manual fund quote and FX quotes needed for display.
- Portal only needs display-layer conversion, not broker-grade revaluation.
- Supported base currencies in first pass: `USD` and `HKD`.
- Locale defaults: `zh-HK` for local/self-hosted use unless changed in settings.

### Out Of Scope

- Direct Yahoo API calls from the portal
- Rebuilding Wealthfolio’s full market data provider stack
- Cron-based quote refresh
- Full translation of database-stored asset names
- Per-market localized symbol naming
