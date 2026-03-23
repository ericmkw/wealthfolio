import {
  buildInvestorProjection,
  type DistributionActivityRow,
  type DistributionQuoteRow,
  type DistributionSnapshotRow,
  type DistributionValuationRow,
} from "@/lib/publish/distribution-transform";

describe("buildInvestorProjection", () => {
  it("builds investor overview and personal cashflows from distribution data", () => {
    const valuations: DistributionValuationRow[] = [
      { accountId: "acct-a", valuationDate: "2026-03-20", totalValue: "10234.56" },
      { accountId: "acct-a", valuationDate: "2026-03-21", totalValue: "10500.10" },
    ];
    const snapshots: DistributionSnapshotRow[] = [
      {
        accountId: "acct-a",
        snapshotDate: "2026-03-21",
        positions: [
          { assetId: "FUND:UNIT", quantity: "95.2381" },
          { assetId: "OTHER", quantity: "1.0000" },
        ],
      },
    ];
    const quotes: DistributionQuoteRow[] = [
      { assetId: "FUND:UNIT", day: "2026-03-20", close: "104.50" },
      { assetId: "FUND:UNIT", day: "2026-03-21", close: "105.00" },
    ];
    const activities: DistributionActivityRow[] = [
      {
        id: "sub-1",
        accountId: "acct-a",
        activityType: "BUY",
        activityDate: "2026-03-21T00:00:00Z",
        assetId: "FUND:UNIT",
        amount: "10000.00",
        currency: "USD",
      },
      {
        id: "dep-1",
        accountId: "acct-a",
        activityType: "DEPOSIT",
        activityDate: "2026-03-20T00:00:00Z",
        assetId: null,
        amount: "2500.00",
        currency: "USD",
      },
    ];

    expect(
      buildInvestorProjection({
        accountId: "acct-a",
        fundAssetId: "FUND:UNIT",
        valuations,
        snapshots,
        quotes,
        activities,
      }),
    ).toEqual({
      latestNav: "10500.10",
      latestUnitPrice: "105.00",
      unitsHeld: "95.2381",
      performanceHistory: [
        { date: "2026-03-20", nav: "10234.56" },
        { date: "2026-03-21", nav: "10500.10" },
      ],
      cashflows: [
        {
          sourceActivityId: "dep-1",
          eventType: "deposit",
          occurredAt: "2026-03-20T00:00:00Z",
          amount: "2500.00",
          currency: "USD",
        },
        {
          sourceActivityId: "sub-1",
          eventType: "subscription",
          occurredAt: "2026-03-21T00:00:00Z",
          amount: "10000.00",
          currency: "USD",
        },
      ],
    });
  });

  it("ignores non-fund buy and sell activities", () => {
    expect(
      buildInvestorProjection({
        accountId: "acct-a",
        fundAssetId: "FUND:UNIT",
        valuations: [{ accountId: "acct-a", valuationDate: "2026-03-21", totalValue: "10500.10" }],
        snapshots: [
          {
            accountId: "acct-a",
            snapshotDate: "2026-03-21",
            positions: [{ assetId: "FUND:UNIT", quantity: "95.2381" }],
          },
        ],
        quotes: [{ assetId: "FUND:UNIT", day: "2026-03-21", close: "105.00" }],
        activities: [
          {
            id: "buy-fund",
            accountId: "acct-a",
            activityType: "BUY",
            activityDate: "2026-03-21T00:00:00Z",
            assetId: "FUND:UNIT",
            amount: "10000.00",
            currency: "USD",
          },
          {
            id: "buy-stock",
            accountId: "acct-a",
            activityType: "BUY",
            activityDate: "2026-03-21T01:00:00Z",
            assetId: "AAPL",
            amount: "500.00",
            currency: "USD",
          },
        ],
      }).cashflows,
    ).toEqual([
      {
        sourceActivityId: "buy-fund",
        eventType: "subscription",
        occurredAt: "2026-03-21T00:00:00Z",
        amount: "10000.00",
        currency: "USD",
      },
    ]);
  });
});
