export interface HoldingCompositionInput {
  key: string;
  label: string;
  weightPct: string;
  positionKind: "security" | "cash";
}

export interface HoldingCompositionSegment extends HoldingCompositionInput {
  dashArray: string;
  dashOffset: string;
}

export function buildPositionDisplay(args: { symbol: string | null; assetName: string | null }) {
  if (args.symbol) {
    return {
      title: args.symbol,
      subtitle: args.assetName && args.assetName !== args.symbol ? args.assetName : null,
    };
  }

  return {
    title: args.assetName ?? "—",
    subtitle: null,
  };
}

export function formatPercent(value: string | null | undefined, locale = "en-US") {
  if (!value) {
    return "—";
  }

  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return value;
  }

  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue / 100);
}

export function buildHoldingCompositionSegments(items: HoldingCompositionInput[]) {
  let offset = 0;

  return items.map((item) => {
    const weight = Number(item.weightPct);
    const safeWeight = Number.isFinite(weight) ? weight : 0;
    const segment = {
      ...item,
      dashArray: `${safeWeight} ${100 - safeWeight}`,
      dashOffset: `${-offset}`,
    };

    offset += safeWeight;
    return segment;
  }) satisfies HoldingCompositionSegment[];
}
