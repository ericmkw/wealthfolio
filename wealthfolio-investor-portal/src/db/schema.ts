import {
  integer,
  boolean,
  date,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["admin", "investor"]);
export const publishStatusEnum = pgEnum("publish_status", ["running", "succeeded", "failed"]);
export const cashflowEventTypeEnum = pgEnum("cashflow_event_type", [
  "subscription",
  "redemption",
  "deposit",
  "withdrawal",
]);
export const appLocaleEnum = pgEnum("app_locale", ["en", "zh-HK", "zh-CN"]);
export const appThemeEnum = pgEnum("app_theme", ["dark", "light"]);
export const baseCurrencyEnum = pgEnum("base_currency", ["USD", "HKD"]);

export const investors = pgTable("investors", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    username: text("username").notNull(),
    email: text("email"),
    role: userRoleEnum("role").notNull(),
    investorId: text("investor_id").references(() => investors.id, { onDelete: "set null" }),
    displayName: text("display_name").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    usernameIdx: uniqueIndex("users_username_idx").on(table.username),
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
  }),
);

export const passwordCredentials = pgTable("password_credentials", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tokenHashIdx: uniqueIndex("sessions_token_hash_idx").on(table.tokenHash),
  }),
);

export const appSettings = pgTable("app_settings", {
  id: integer("id").primaryKey(),
  defaultLocale: appLocaleEnum("default_locale").notNull(),
  defaultTheme: appThemeEnum("default_theme").notNull(),
  defaultBaseCurrency: baseCurrencyEnum("default_base_currency").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userPreferences = pgTable("user_preferences", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  locale: appLocaleEnum("locale"),
  theme: appThemeEnum("theme"),
  baseCurrency: baseCurrencyEnum("base_currency"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const investorAccountMappings = pgTable("investor_account_mappings", {
  investorId: text("investor_id")
    .primaryKey()
    .references(() => investors.id, { onDelete: "cascade" }),
  distributionAccountId: text("distribution_account_id").notNull(),
  fundAssetId: text("fund_asset_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const publishedVersions = pgTable("published_versions", {
  id: text("id").primaryKey(),
  masterSnapshotFilename: text("master_snapshot_filename").notNull(),
  distributionSnapshotFilename: text("distribution_snapshot_filename").notNull(),
  isCurrent: boolean("is_current").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const publishRuns = pgTable("publish_runs", {
  id: text("id").primaryKey(),
  status: publishStatusEnum("status").notNull(),
  publishedVersionId: text("published_version_id").references(() => publishedVersions.id, {
    onDelete: "set null",
  }),
  masterSnapshotFilename: text("master_snapshot_filename"),
  distributionSnapshotFilename: text("distribution_snapshot_filename"),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
});

export const fundOperationEvents = pgTable("fund_operation_events", {
  id: text("id").primaryKey(),
  publishedVersionId: text("published_version_id")
    .notNull()
    .references(() => publishedVersions.id, { onDelete: "cascade" }),
  sourceActivityId: text("source_activity_id").notNull(),
  occurredAt: text("occurred_at").notNull(),
  activityType: text("activity_type").notNull(),
  symbol: text("symbol"),
  assetName: text("asset_name"),
  unitPrice: numeric("unit_price", { precision: 24, scale: 8, mode: "string" }),
  fee: numeric("fee", { precision: 24, scale: 8, mode: "string" }),
  currency: text("currency").notNull(),
  accountName: text("account_name").notNull(),
});

export const investorCashflowEvents = pgTable("investor_cashflow_events", {
  id: text("id").primaryKey(),
  publishedVersionId: text("published_version_id")
    .notNull()
    .references(() => publishedVersions.id, { onDelete: "cascade" }),
  investorId: text("investor_id")
    .notNull()
    .references(() => investors.id, { onDelete: "cascade" }),
  sourceActivityId: text("source_activity_id").notNull(),
  eventType: cashflowEventTypeEnum("event_type").notNull(),
  occurredAt: text("occurred_at").notNull(),
  amount: numeric("amount", { precision: 24, scale: 8, mode: "string" }),
  currency: text("currency").notNull(),
});

export const investorPositionSnapshots = pgTable("investor_position_snapshots", {
  id: text("id").primaryKey(),
  publishedVersionId: text("published_version_id")
    .notNull()
    .references(() => publishedVersions.id, { onDelete: "cascade" }),
  investorId: text("investor_id")
    .notNull()
    .references(() => investors.id, { onDelete: "cascade" }),
  distributionAccountId: text("distribution_account_id").notNull(),
  fundAssetId: text("fund_asset_id").notNull(),
  latestNav: numeric("latest_nav", { precision: 24, scale: 8, mode: "string" }).notNull(),
  latestUnitPrice: numeric("latest_unit_price", { precision: 24, scale: 8, mode: "string" })
    .notNull(),
  unitsHeld: numeric("units_held", { precision: 24, scale: 8, mode: "string" }).notNull(),
  currency: text("currency").notNull(),
});

export const investorPerformanceSnapshots = pgTable("investor_performance_snapshots", {
  id: text("id").primaryKey(),
  publishedVersionId: text("published_version_id")
    .notNull()
    .references(() => publishedVersions.id, { onDelete: "cascade" }),
  investorId: text("investor_id")
    .notNull()
    .references(() => investors.id, { onDelete: "cascade" }),
  valuationDate: date("valuation_date").notNull(),
  nav: numeric("nav", { precision: 24, scale: 8, mode: "string" }).notNull(),
});

export const unitPriceSnapshots = pgTable("unit_price_snapshots", {
  id: text("id").primaryKey(),
  publishedVersionId: text("published_version_id")
    .notNull()
    .references(() => publishedVersions.id, { onDelete: "cascade" }),
  investorId: text("investor_id")
    .notNull()
    .references(() => investors.id, { onDelete: "cascade" }),
  fundAssetId: text("fund_asset_id").notNull(),
  quoteDay: date("quote_day").notNull(),
  unitPrice: numeric("unit_price", { precision: 24, scale: 8, mode: "string" }).notNull(),
});

export const quoteReferenceSnapshots = pgTable("quote_reference_snapshots", {
  id: text("id").primaryKey(),
  publishedVersionId: text("published_version_id")
    .notNull()
    .references(() => publishedVersions.id, { onDelete: "cascade" }),
  referenceKind: text("reference_kind").notNull(),
  referenceKey: text("reference_key").notNull(),
  assetId: text("asset_id"),
  label: text("label").notNull(),
  sourceCurrency: text("source_currency").notNull(),
  targetCurrency: text("target_currency"),
  quoteDay: date("quote_day").notNull(),
  quoteValue: numeric("quote_value", { precision: 24, scale: 8, mode: "string" }).notNull(),
});

export const publishedFundHoldings = pgTable("published_fund_holdings", {
  id: text("id").primaryKey(),
  publishedVersionId: text("published_version_id")
    .notNull()
    .references(() => publishedVersions.id, { onDelete: "cascade" }),
  positionKind: text("position_kind").notNull(),
  assetId: text("asset_id"),
  symbol: text("symbol"),
  assetName: text("asset_name").notNull(),
  currency: text("currency").notNull(),
  latestPrice: numeric("latest_price", { precision: 24, scale: 8, mode: "string" }),
  dayChangePct: numeric("day_change_pct", { precision: 24, scale: 8, mode: "string" }),
  totalReturnPct: numeric("total_return_pct", { precision: 24, scale: 8, mode: "string" }),
  weightPct: numeric("weight_pct", { precision: 24, scale: 8, mode: "string" }).notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const publishedDistributionAccounts = pgTable("published_distribution_accounts", {
  id: text("id").primaryKey(),
  publishedVersionId: text("published_version_id")
    .notNull()
    .references(() => publishedVersions.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  accountName: text("account_name").notNull(),
});

export const publishedDistributionAssets = pgTable("published_distribution_assets", {
  id: text("id").primaryKey(),
  publishedVersionId: text("published_version_id")
    .notNull()
    .references(() => publishedVersions.id, { onDelete: "cascade" }),
  assetId: text("asset_id").notNull(),
  label: text("label").notNull(),
});
