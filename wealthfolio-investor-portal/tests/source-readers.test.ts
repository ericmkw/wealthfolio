import Database from "better-sqlite3";
import {
  readDistributionAccounts,
  readDistributionFundAssets,
  readLatestDistributionSnapshot,
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
