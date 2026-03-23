import { extractFundOperationEvents, type MasterActivityRow } from "@/lib/publish/master-transform";

describe("extractFundOperationEvents", () => {
  it("filters out non-fund operation cash activities and redacts sensitive trade sizing", () => {
    const rows: MasterActivityRow[] = [
      {
        id: "buy-1",
        activityType: "BUY",
        activityDate: "2026-03-20T01:13:43Z",
        assetSymbol: "TECS",
        assetName: "Direxion Daily Technology Bear 3X Shares",
        unitPrice: "19.35",
        fee: "0.74",
        currency: "USD",
        accountName: "BE_RICH_FUND_USD",
        quantity: "40",
        amount: "774.00",
      },
      {
        id: "dep-1",
        activityType: "DEPOSIT",
        activityDate: "2026-03-20T02:00:00Z",
        assetSymbol: null,
        assetName: null,
        unitPrice: null,
        fee: null,
        currency: "USD",
        accountName: "BE_RICH_FUND_USD",
        quantity: null,
        amount: "10000.00",
      },
    ];

    expect(extractFundOperationEvents(rows)).toEqual([
      {
        sourceActivityId: "buy-1",
        occurredAt: "2026-03-20T01:13:43Z",
        activityType: "BUY",
        symbol: "TECS",
        assetName: "Direxion Daily Technology Bear 3X Shares",
        unitPrice: "19.35",
        fee: "0.74",
        currency: "USD",
        accountName: "BE_RICH_FUND_USD",
      },
    ]);
  });
});
