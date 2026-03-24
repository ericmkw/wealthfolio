import type {
  AssetQuoteSnapshot,
  MasterHoldingsSnapshotRow,
} from "@/lib/publish/source-readers";

export interface FundHoldingRow {
  positionKind: "security" | "cash";
  assetId: string | null;
  symbol: string | null;
  assetName: string;
  currency: string;
  latestPrice: string | null;
  dayChangePct: string | null;
  totalReturnPct: string | null;
  weightPct: string;
  sortOrder: number;
}

export interface FundHoldingSlice {
  key: string;
  label: string;
  weightPct: string;
  positionKind: FundHoldingRow["positionKind"];
}

export interface FundFxRate {
  sourceCurrency: string;
  targetCurrency: string;
  rate: string;
}

function toNumber(value: string | null | undefined) {
  if (!value) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDecimal(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return null;
  }

  return value.toFixed(8);
}

function convertToBase(value: number, currency: string, baseCurrency: string, fxRates: FundFxRate[]) {
  if (currency === baseCurrency) {
    return value;
  }

  const directRate = fxRates.find(
    (rate) => rate.sourceCurrency === currency && rate.targetCurrency === baseCurrency,
  );
  if (directRate) {
    return value * toNumber(directRate.rate);
  }

  const inverseRate = fxRates.find(
    (rate) => rate.sourceCurrency === baseCurrency && rate.targetCurrency === currency,
  );
  if (inverseRate) {
    const parsedRate = toNumber(inverseRate.rate);
    return parsedRate === 0 ? 0 : value / parsedRate;
  }

  return 0;
}

export function buildFundHoldingsProjection(args: {
  baseCurrency: string;
  snapshots: MasterHoldingsSnapshotRow[];
  quotes: AssetQuoteSnapshot[];
  fxRates?: FundFxRate[];
}) {
  const fxRates = args.fxRates ?? [];
  const aggregatedPositions = new Map<
    string,
    {
      assetId: string;
      quantity: number;
      totalCostBasis: number;
      currency: string;
    }
  >();
  const aggregatedCash = new Map<string, number>();

  for (const snapshot of args.snapshots) {
    for (const position of snapshot.positions) {
      const current = aggregatedPositions.get(position.assetId) ?? {
        assetId: position.assetId,
        quantity: 0,
        totalCostBasis: 0,
        currency: position.currency,
      };

      current.quantity += toNumber(position.quantity);
      current.totalCostBasis += toNumber(position.totalCostBasis);
      current.currency = current.currency || position.currency;
      aggregatedPositions.set(position.assetId, current);
    }

    for (const [currency, amount] of Object.entries(snapshot.cashBalances)) {
      aggregatedCash.set(currency, (aggregatedCash.get(currency) ?? 0) + toNumber(amount));
    }
  }

  const quoteByAssetId = new Map(args.quotes.map((quote) => [quote.assetId, quote]));

  const draftRows = [
    ...Array.from(aggregatedPositions.values()).map((position) => {
      const quote = quoteByAssetId.get(position.assetId);
      const latestClose = toNumber(quote?.latestClose);
      const previousClose = toNumber(quote?.previousClose);
      const marketValueLocal = position.quantity * latestClose;

      return {
        positionKind: "security" as const,
        assetId: position.assetId,
        symbol: quote?.symbol ?? null,
        assetName: quote?.assetName ?? position.assetId,
        currency: quote?.currency ?? position.currency,
        latestPrice: formatDecimal(latestClose || null),
        dayChangePct:
          previousClose > 0 ? formatDecimal(((latestClose - previousClose) / previousClose) * 100) : null,
        totalReturnPct:
          position.totalCostBasis > 0
            ? formatDecimal(((marketValueLocal - position.totalCostBasis) / position.totalCostBasis) * 100)
            : null,
        marketValueBase: convertToBase(
          marketValueLocal,
          quote?.currency ?? position.currency,
          args.baseCurrency,
          fxRates,
        ),
      };
    }),
    ...Array.from(aggregatedCash.entries()).map(([currency, amount]) => ({
      positionKind: "cash" as const,
      assetId: null,
      symbol: null,
      assetName: `Cash ${currency}`,
      currency,
      latestPrice: null,
      dayChangePct: null,
      totalReturnPct: null,
      marketValueBase: convertToBase(amount, currency, args.baseCurrency, fxRates),
    })),
  ];

  const totalMarketValueBase = draftRows.reduce((sum, row) => sum + row.marketValueBase, 0);

  const holdings = draftRows
    .map((row) => ({
      positionKind: row.positionKind,
      assetId: row.assetId,
      symbol: row.symbol,
      assetName: row.assetName,
      currency: row.currency,
      latestPrice: row.latestPrice,
      dayChangePct: row.dayChangePct,
      totalReturnPct: row.totalReturnPct,
      weightPct: formatDecimal(totalMarketValueBase > 0 ? (row.marketValueBase / totalMarketValueBase) * 100 : 0)!,
    }))
    .sort((left, right) => {
      const weightDiff = Number(right.weightPct) - Number(left.weightPct);
      if (weightDiff !== 0) {
        return weightDiff;
      }

      return left.assetName.localeCompare(right.assetName);
    })
    .map((row, index) => ({
      ...row,
      sortOrder: index,
    })) satisfies FundHoldingRow[];

  const composition = holdings.map((holding) => ({
    key: holding.assetId ?? `${holding.positionKind}:${holding.assetName}`,
    label: holding.symbol ? `${holding.symbol} · ${holding.assetName}` : holding.assetName,
    weightPct: holding.weightPct,
    positionKind: holding.positionKind,
  })) satisfies FundHoldingSlice[];

  return {
    holdings,
    composition,
  };
}
