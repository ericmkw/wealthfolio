export interface MasterActivityRow {
  id: string;
  activityType: string;
  activityDate: string;
  assetSymbol: string | null;
  assetName: string | null;
  unitPrice: string | null;
  fee: string | null;
  currency: string;
  accountName: string;
  quantity: string | null;
  amount: string | null;
}

export interface FundOperationEvent {
  sourceActivityId: string;
  occurredAt: string;
  activityType: string;
  symbol: string | null;
  assetName: string | null;
  unitPrice: string | null;
  fee: string | null;
  currency: string;
  accountName: string;
}

export function extractFundOperationEvents(rows: MasterActivityRow[]): FundOperationEvent[] {
  return rows
    .filter((row) =>
      ["BUY", "SELL", "DIVIDEND", "INTEREST", "FEE", "TAX", "SPLIT"].includes(row.activityType),
    )
    .map((row) => ({
      sourceActivityId: row.id,
      occurredAt: row.activityDate,
      activityType: row.activityType,
      symbol: row.assetSymbol,
      assetName: row.assetName,
      unitPrice: row.unitPrice,
      fee: row.fee,
      currency: row.currency,
      accountName: row.accountName,
    }));
}
