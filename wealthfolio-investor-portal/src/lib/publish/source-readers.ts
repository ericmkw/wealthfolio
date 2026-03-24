import Database from "better-sqlite3";
import type {
  DistributionActivityRow,
  DistributionHoldingPosition,
  DistributionQuoteRow,
  DistributionSnapshotRow,
  DistributionValuationRow,
} from "@/lib/publish/distribution-transform";
import type { MasterActivityRow } from "@/lib/publish/master-transform";

export function openReadonlySnapshot(path: string) {
  const database = new Database(path, {
    readonly: true,
    fileMustExist: true,
  });

  database.pragma("query_only = ON");
  return database;
}

export function readMasterActivityRows(database: Database.Database) {
  return database
    .prepare(
      `
        SELECT
          activities.id AS id,
          activities.activity_type AS activityType,
          activities.activity_date AS activityDate,
          COALESCE(assets.display_code, assets.instrument_symbol) AS assetSymbol,
          assets.name AS assetName,
          activities.unit_price AS unitPrice,
          activities.fee AS fee,
          activities.currency AS currency,
          accounts.name AS accountName,
          activities.quantity AS quantity,
          activities.amount AS amount
        FROM activities
        INNER JOIN accounts ON accounts.id = activities.account_id
        LEFT JOIN assets ON assets.id = activities.asset_id
        ORDER BY activities.activity_date DESC
      `,
    )
    .all() as MasterActivityRow[];
}

export function readDistributionValuations(database: Database.Database, accountId: string) {
  return database
    .prepare(
      `
        SELECT
          account_id AS accountId,
          valuation_date AS valuationDate,
          total_value AS totalValue
        FROM daily_account_valuation
        WHERE account_id = ?
        ORDER BY valuation_date ASC
      `,
    )
    .all(accountId) as DistributionValuationRow[];
}

function normalizePositions(rawPositions: string) {
  const parsed = JSON.parse(rawPositions) as unknown;
  const positions = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === "object"
      ? Object.values(parsed)
      : [];

  return positions
    .map((position) => ({
      assetId:
        typeof position.assetId === "string"
          ? position.assetId
          : typeof position.asset_id === "string"
            ? position.asset_id
            : "",
      quantity:
        typeof position.quantity === "string" || typeof position.quantity === "number"
          ? String(position.quantity)
          : "0",
    }))
    .filter((position) => position.assetId) as DistributionHoldingPosition[];
}

export function readLatestDistributionSnapshot(database: Database.Database, accountId: string) {
  const row = database
    .prepare(
      `
        SELECT
          account_id AS accountId,
          snapshot_date AS snapshotDate,
          positions
        FROM holdings_snapshots
        WHERE account_id = ?
        ORDER BY snapshot_date DESC
        LIMIT 1
      `,
    )
    .get(accountId) as { accountId: string; snapshotDate: string; positions: string } | undefined;

  if (!row) {
    return [] as DistributionSnapshotRow[];
  }

  return [
    {
      accountId: row.accountId,
      snapshotDate: row.snapshotDate,
      positions: normalizePositions(row.positions),
    },
  ];
}

export function readDistributionQuotes(database: Database.Database, fundAssetId: string) {
  return database
    .prepare(
      `
        SELECT
          asset_id AS assetId,
          day,
          close
        FROM quotes
        WHERE asset_id = ?
        ORDER BY day ASC
      `,
    )
    .all(fundAssetId) as DistributionQuoteRow[];
}

export function readDistributionAccounts(database: Database.Database) {
  return database
    .prepare(
      `
        SELECT id, name
        FROM accounts
        WHERE is_active = 1
        ORDER BY name ASC
      `,
    )
    .all()
    .map((row) => ({
      id: String((row as { id: string }).id),
      label: String((row as { name: string }).name),
    })) as { id: string; label: string }[];
}

export function readDistributionFundAssets(database: Database.Database) {
  return database
    .prepare(
      `
        SELECT
          id,
          COALESCE(display_code, instrument_symbol, name, id) AS code,
          name
        FROM assets
        WHERE is_active = 1
        ORDER BY name ASC
      `,
    )
    .all()
    .map((row) => {
      const asset = row as { id: string; code: string | null; name: string | null };
      return {
        id: asset.id,
        label: asset.code && asset.name ? `${asset.code} - ${asset.name}` : asset.name ?? asset.id,
      };
    }) as { id: string; label: string }[];
}

export function readLatestFundQuoteReferences(database: Database.Database, fundAssetIds: string[]) {
  if (!fundAssetIds.length) {
    return [] as DistributionQuoteRow[];
  }

  const placeholders = fundAssetIds.map(() => "?").join(", ");
  return database
    .prepare(
      `
        SELECT
          q.asset_id AS assetId,
          q.day AS day,
          q.close AS close,
          COALESCE(a.display_code, a.instrument_symbol, a.name, q.asset_id) AS label,
          a.quote_ccy AS sourceCurrency,
          NULL AS targetCurrency
        FROM quotes q
        INNER JOIN assets a ON a.id = q.asset_id
        INNER JOIN (
          SELECT asset_id, MAX(day) AS latestDay
          FROM quotes
          WHERE asset_id IN (${placeholders})
          GROUP BY asset_id
        ) latest ON latest.asset_id = q.asset_id AND latest.latestDay = q.day
      `,
    )
    .all(...fundAssetIds) as DistributionQuoteRow[];
}

export function readLatestFxQuoteReferences(database: Database.Database) {
  return database
    .prepare(
      `
        SELECT
          q.asset_id AS assetId,
          q.day AS day,
          q.close AS close,
          COALESCE(a.display_code, a.instrument_symbol, a.name, q.asset_id) AS label,
          substr(COALESCE(a.display_code, a.instrument_symbol, ''), 1, 3) AS sourceCurrency,
          substr(COALESCE(a.display_code, a.instrument_symbol, ''), 5, 3) AS targetCurrency
        FROM quotes q
        INNER JOIN assets a ON a.id = q.asset_id
        INNER JOIN (
          SELECT asset_id, MAX(day) AS latestDay
          FROM quotes
          GROUP BY asset_id
        ) latest ON latest.asset_id = q.asset_id AND latest.latestDay = q.day
        WHERE COALESCE(a.display_code, a.instrument_symbol, '') IN ('USD/HKD', 'HKD/USD')
      `,
    )
    .all() as DistributionQuoteRow[];
}

export function readDistributionActivities(database: Database.Database, accountId: string) {
  return database
    .prepare(
      `
        SELECT
          id,
          account_id AS accountId,
          activity_type AS activityType,
          activity_date AS activityDate,
          asset_id AS assetId,
          amount,
          currency
        FROM activities
        WHERE account_id = ?
        ORDER BY activity_date ASC
      `,
    )
    .all(accountId) as DistributionActivityRow[];
}
