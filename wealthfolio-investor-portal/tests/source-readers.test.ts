import Database from "better-sqlite3";
import { readLatestDistributionSnapshot } from "@/lib/publish/source-readers";

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
