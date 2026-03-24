import { buildFundHoldingsProjection } from "@/lib/publish/fund-holdings-transform";

describe("buildFundHoldingsProjection", () => {
  it("aggregates fund positions, cash, and safe display metrics", () => {
    const projection = buildFundHoldingsProjection({
      baseCurrency: "USD",
      snapshots: [
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
            USD: "200",
          },
        },
        {
          accountId: "acct-b",
          snapshotDate: "2026-03-22",
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
            HKD: "780",
          },
        },
      ],
      quotes: [
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
          previousClose: "260",
        },
      ],
      fxRates: [
        {
          sourceCurrency: "USD",
          targetCurrency: "HKD",
          rate: "7.8",
        },
      ],
    });

    expect(projection.holdings).toHaveLength(4);
    expect(projection.holdings[0]).toMatchObject({
      positionKind: "security",
      assetId: "asset-1",
      symbol: "AAPL",
      assetName: "Apple Inc.",
      currency: "USD",
      latestPrice: "200.00000000",
    });
    expect(Number(projection.holdings[0].dayChangePct)).toBeCloseTo(5.26315789, 6);
    expect(Number(projection.holdings[0].totalReturnPct)).toBeCloseTo(36.36363636, 6);
    expect(Number(projection.holdings[0].weightPct)).toBeCloseTo(78.94736842, 6);
    expect(projection.holdings[0]).not.toHaveProperty("quantity");
    expect(projection.holdings[0]).not.toHaveProperty("marketValue");

    const cashHkd = projection.holdings.find((row) => row.assetName === "Cash HKD");
    expect(cashHkd).toMatchObject({
      positionKind: "cash",
      assetId: null,
      symbol: null,
      assetName: "Cash HKD",
      currency: "HKD",
      latestPrice: null,
      dayChangePct: null,
      totalReturnPct: null,
    });
    expect(Number(cashHkd?.weightPct)).toBeCloseTo(2.63157895, 6);

    expect(projection.composition).toEqual(
      projection.holdings.map((holding) => ({
        key: holding.assetId ?? `${holding.positionKind}:${holding.assetName}`,
        label: holding.symbol ? `${holding.symbol} · ${holding.assetName}` : holding.assetName,
        weightPct: holding.weightPct,
        positionKind: holding.positionKind,
      })),
    );

    const totalWeight = projection.holdings.reduce((sum, holding) => sum + Number(holding.weightPct), 0);
    expect(totalWeight).toBeCloseTo(100, 6);
  });
});
