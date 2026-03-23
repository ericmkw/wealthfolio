export interface DistributionValuationRow {
  accountId: string;
  valuationDate: string;
  totalValue: string;
}

export interface DistributionHoldingPosition {
  assetId: string;
  quantity: string;
}

export interface DistributionSnapshotRow {
  accountId: string;
  snapshotDate: string;
  positions: DistributionHoldingPosition[];
}

export interface DistributionQuoteRow {
  assetId: string;
  day: string;
  close: string;
  label?: string;
  sourceCurrency?: string;
  targetCurrency?: string | null;
}

export interface DistributionActivityRow {
  id: string;
  accountId: string;
  activityType: string;
  activityDate: string;
  assetId: string | null;
  amount: string | null;
  currency: string;
}

export interface InvestorProjection {
  latestNav: string;
  latestUnitPrice: string;
  unitsHeld: string;
  performanceHistory: Array<{ date: string; nav: string }>;
  cashflows: Array<{
    sourceActivityId: string;
    eventType: "subscription" | "redemption" | "deposit" | "withdrawal";
    occurredAt: string;
    amount: string | null;
    currency: string;
  }>;
}

export function buildInvestorProjection(args: {
  accountId: string;
  fundAssetId: string;
  valuations: DistributionValuationRow[];
  snapshots: DistributionSnapshotRow[];
  quotes: DistributionQuoteRow[];
  activities: DistributionActivityRow[];
}): InvestorProjection {
  const latestValuation = [...args.valuations]
    .filter((row) => row.accountId === args.accountId)
    .sort((left, right) => left.valuationDate.localeCompare(right.valuationDate))
    .at(-1);

  const latestSnapshot = [...args.snapshots]
    .filter((row) => row.accountId === args.accountId)
    .sort((left, right) => left.snapshotDate.localeCompare(right.snapshotDate))
    .at(-1);

  const unitsHeld =
    latestSnapshot?.positions.find((position) => position.assetId === args.fundAssetId)?.quantity ?? "0";

  const latestUnitPrice = [...args.quotes]
    .filter((row) => row.assetId === args.fundAssetId)
    .sort((left, right) => left.day.localeCompare(right.day))
    .at(-1)?.close;

  const performanceHistory = args.valuations
    .filter((row) => row.accountId === args.accountId)
    .sort((left, right) => left.valuationDate.localeCompare(right.valuationDate))
    .map((row) => ({
      date: row.valuationDate,
      nav: row.totalValue,
    }));

  const cashflows = args.activities
    .filter((row) => row.accountId === args.accountId)
    .filter((row) => {
      if (row.activityType === "BUY" || row.activityType === "SELL") {
        return row.assetId === args.fundAssetId;
      }

      return row.activityType === "DEPOSIT" || row.activityType === "WITHDRAWAL";
    })
    .map((row) => {
      let eventType: InvestorProjection["cashflows"][number]["eventType"];
      if (row.activityType === "BUY" && row.assetId === args.fundAssetId) {
        eventType = "subscription";
      } else if (row.activityType === "SELL" && row.assetId === args.fundAssetId) {
        eventType = "redemption";
      } else if (row.activityType === "WITHDRAWAL") {
        eventType = "withdrawal";
      } else {
        eventType = "deposit";
      }

      return {
        sourceActivityId: row.id,
        eventType,
        occurredAt: row.activityDate,
        amount: row.amount,
        currency: row.currency,
      };
    })
    .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));

  return {
    latestNav: latestValuation?.totalValue ?? "0",
    latestUnitPrice: latestUnitPrice ?? "0",
    unitsHeld,
    performanceHistory,
    cashflows,
  };
}
