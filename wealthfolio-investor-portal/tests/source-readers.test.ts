import Database from "better-sqlite3";
import {
  readDistributionAccounts,
  readDistributionFundAssets,
  readLatestAssetQuoteSnapshots,
  readLatestDistributionSnapshot,
  readLatestMasterHoldingsSnapshots,
} from "@/lib/publish/source-readers";

describe("readLatestDistributionSnapshot", () => {
  it("normalizes holdings positions stored as a JSON object map", () => {
    const database = new Database(":memory:");

    database.exec(`
      CREATE TABLE holdings_snapshots (
        account_id TEXT NOT NULL,
        snapshot_date TEXT NOT NULL,
        positions TEXT NOT NULL
      );
    `);

    database
      .prepare(
        `
          INSERT INTO holdings_snapshots (account_id, snapshot_date, positions)
          VALUES (?, ?, ?)
        `,
      )
      .run(
        "acct-a",
        "2026-03-22",
        JSON.stringify({
          "fund-asset": {
            assetId: "fund-asset",
            quantity: 191.3265,
          },
          ignored: {
            quantity: 1,
          },
        }),
      );

    expect(readLatestDistributionSnapshot(database, "acct-a")).toEqual([
      {
        accountId: "acct-a",
        snapshotDate: "2026-03-22",
        positions: [{ assetId: "fund-asset", quantity: "191.3265" }],
      },
    ]);

    database.close();
  });
});

describe("distribution source option readers", () => {
  it("reads active distribution accounts for mapping dropdowns", () => {
    const database = new Database(":memory:");

    database.exec(`
      CREATE TABLE accounts (
        id TEXT NOT NULL,
        name TEXT NOT NULL,
        is_active INTEGER NOT NULL
      );
    `);

    database.exec(`
      INSERT INTO accounts (id, name, is_active)
      VALUES
        ('acct-b', 'B Account', 1),
        ('acct-a', 'A Account', 1),
        ('acct-z', 'Disabled Account', 0);
    `);

    expect(readDistributionAccounts(database)).toEqual([
      { id: "acct-a", label: "A Account" },
      { id: "acct-b", label: "B Account" },
    ]);

    database.close();
  });

  it("reads active fund asset options for mapping dropdowns", () => {
    const database = new Database(":memory:");

    database.exec(`
      CREATE TABLE assets (
        id TEXT NOT NULL,
        name TEXT,
        display_code TEXT,
        instrument_symbol TEXT,
        is_active INTEGER NOT NULL
      );
    `);

    database.exec(`
      INSERT INTO assets (id, name, display_code, instrument_symbol, is_active)
      VALUES
        ('fund-1', 'Family Fund', 'RICHUSD', NULL, 1),
        ('fund-2', 'Alpha Fund', NULL, 'ALPHA', 1),
        ('fund-3', 'Disabled Fund', 'ZZZ', NULL, 0);
    `);

    expect(readDistributionFundAssets(database)).toEqual([
      { id: "fund-2", label: "ALPHA - Alpha Fund" },
      { id: "fund-1", label: "RICHUSD - Family Fund" },
    ]);

    database.close();
  });
});

describe("readLatestMasterHoldingsSnapshots", () => {
  it("reads the latest active-account snapshots with cost basis and cash balances", () => {
    const database = new Database(":memory:");

    database.exec(`
      CREATE TABLE accounts (
        id TEXT NOT NULL,
        is_active INTEGER NOT NULL
      );

      CREATE TABLE holdings_snapshots (
        account_id TEXT NOT NULL,
        snapshot_date TEXT NOT NULL,
        positions TEXT NOT NULL,
        cash_balances TEXT NOT NULL
      );
    `);

    database.exec(`
      INSERT INTO accounts (id, is_active)
      VALUES
        ('acct-a', 1),
        ('acct-b', 1),
        ('acct-z', 0);
    `);

    database
      .prepare(
        `
          INSERT INTO holdings_snapshots (account_id, snapshot_date, positions, cash_balances)
          VALUES (?, ?, ?, ?)
        `,
      )
      .run(
        "acct-a",
        "2026-03-20",
        JSON.stringify({
          "asset-1": {
            assetId: "asset-1",
            quantity: 8,
            totalCostBasis: 1200,
            currency: "USD",
          },
        }),
        JSON.stringify({ USD: "80" }),
      );

    database
      .prepare(
        `
          INSERT INTO holdings_snapshots (account_id, snapshot_date, positions, cash_balances)
          VALUES (?, ?, ?, ?)
        `,
      )
      .run(
        "acct-a",
        "2026-03-22",
        JSON.stringify({
          "asset-1": {
            assetId: "asset-1",
            quantity: 10,
            totalCostBasis: 1500,
            currency: "USD",
          },
          ignored: {
            quantity: 1,
          },
        }),
        JSON.stringify({ USD: "200.50" }),
      );

    database
      .prepare(
        `
          INSERT INTO holdings_snapshots (account_id, snapshot_date, positions, cash_balances)
          VALUES (?, ?, ?, ?)
        `,
      )
      .run(
        "acct-b",
        "2026-03-21",
        JSON.stringify([
          {
            asset_id: "asset-1",
            quantity: "5",
            total_cost_basis: "700",
            currency: "USD",
          },
          {
            assetId: "asset-2",
            quantity: "2",
            totalCostBasis: "500",
            currency: "USD",
          },
        ]),
        JSON.stringify({ USD: "99.50", HKD: "780" }),
      );

    database
      .prepare(
        `
          INSERT INTO holdings_snapshots (account_id, snapshot_date, positions, cash_balances)
          VALUES (?, ?, ?, ?)
        `,
      )
      .run(
        "acct-z",
        "2026-03-22",
        JSON.stringify({
          "asset-9": {
            assetId: "asset-9",
            quantity: 999,
            totalCostBasis: 999,
            currency: "USD",
          },
        }),
        JSON.stringify({ USD: "999" }),
      );

    expect(readLatestMasterHoldingsSnapshots(database)).toEqual([
      {
        accountId: "acct-a",
        snapshotDate: "2026-03-22",
        positions: [
          {
            assetId: "asset-1",
            quantity: "10",
            totalCostBasis: "1500",
            currency: "USD",
          },
        ],
        cashBalances: {
          USD: "200.50",
        },
      },
      {
        accountId: "acct-b",
        snapshotDate: "2026-03-21",
        positions: [
          {
            assetId: "asset-1",
            quantity: "5",
            totalCostBasis: "700",
            currency: "USD",
          },
          {
            assetId: "asset-2",
            quantity: "2",
            totalCostBasis: "500",
            currency: "USD",
          },
        ],
        cashBalances: {
          USD: "99.50",
          HKD: "780",
        },
      },
    ]);

    database.close();
  });
});

describe("readLatestAssetQuoteSnapshots", () => {
  it("returns the latest and previous close with asset metadata", () => {
    const database = new Database(":memory:");

    database.exec(`
      CREATE TABLE assets (
        id TEXT NOT NULL,
        name TEXT,
        display_code TEXT,
        instrument_symbol TEXT,
        quote_ccy TEXT
      );

      CREATE TABLE quotes (
        asset_id TEXT NOT NULL,
        day TEXT NOT NULL,
        close TEXT NOT NULL
      );
    `);

    database.exec(`
      INSERT INTO assets (id, name, display_code, instrument_symbol, quote_ccy)
      VALUES
        ('asset-1', 'Apple Inc.', 'AAPL', 'AAPL', 'USD'),
        ('asset-2', 'Tesla, Inc.', NULL, 'TSLA', 'USD');

      INSERT INTO quotes (asset_id, day, close)
      VALUES
        ('asset-1', '2026-03-21', '190'),
        ('asset-1', '2026-03-22', '200'),
        ('asset-2', '2026-03-22', '250');
    `);

    expect(readLatestAssetQuoteSnapshots(database, ["asset-1", "asset-2"])).toEqual([
      {
        assetId: "asset-1",
        symbol: "AAPL",
        assetName: "Apple Inc.",
        currency: "USD",
        latestDay: "2026-03-22",
        latestClose: "200",
        previousClose: "190",
      },
      {
        assetId: "asset-2",
        symbol: "TSLA",
        assetName: "Tesla, Inc.",
        currency: "USD",
        latestDay: "2026-03-22",
        latestClose: "250",
        previousClose: null,
      },
    ]);

    database.close();
  });
});
