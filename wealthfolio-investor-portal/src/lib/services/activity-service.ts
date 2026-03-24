import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  fundOperationEvents,
  investorCashflowEvents,
  publishedFundHoldings,
  publishedVersions,
} from "@/db/schema";
import { resolveDisplayMoney } from "@/lib/display-money";
import { convertMoneyValue, getFxReference } from "@/lib/fx";
import { getResolvedPreferences } from "@/lib/preferences";

async function getCurrentVersionId() {
  const [current] = await db
    .select({ id: publishedVersions.id })
    .from(publishedVersions)
    .where(eq(publishedVersions.isCurrent, true))
    .limit(1);

  return current?.id ?? null;
}

export async function listFundOperations(userId?: string) {
  const currentVersionId = await getCurrentVersionId();
  if (!currentVersionId) {
    return {
      display: null,
      activities: [],
    };
  }

  const preferences = await getResolvedPreferences(userId);
  const events = await db
    .select()
    .from(fundOperationEvents)
    .where(eq(fundOperationEvents.publishedVersionId, currentVersionId))
    .orderBy(desc(fundOperationEvents.occurredAt));

  return {
    display: {
      locale: preferences.locale,
      baseCurrency: preferences.baseCurrency,
      fxRate: null,
      fxUpdatedAt: null,
    },
    activities: events.map((event) => ({
      ...event,
      displayCurrency: event.currency,
      displayUnitPrice: resolveDisplayMoney({
        value: event.unitPrice,
        sourceCurrency: event.currency,
        baseCurrency: preferences.baseCurrency,
        rate: null,
        mode: "preserve-source",
      }).value,
      displayUnitPriceCurrency: resolveDisplayMoney({
        value: event.unitPrice,
        sourceCurrency: event.currency,
        baseCurrency: preferences.baseCurrency,
        rate: null,
        mode: "preserve-source",
      }).currency,
      displayFee: event.fee,
      displayFeeCurrency: event.currency,
    })),
  };
}

export async function listFundHoldings(userId?: string) {
  const currentVersionId = await getCurrentVersionId();
  if (!currentVersionId) {
    return {
      display: null,
      holdings: [],
      composition: [],
    };
  }

  const preferences = await getResolvedPreferences(userId);
  const rows = await db
    .select()
    .from(publishedFundHoldings)
    .where(eq(publishedFundHoldings.publishedVersionId, currentVersionId))
    .orderBy(publishedFundHoldings.sortOrder);
  const holdings = rows.map((row) => ({
    ...row,
    positionKind: row.positionKind === "cash" ? "cash" : "security",
  })) as Array<(typeof rows)[number] & { positionKind: "security" | "cash" }>;

  return {
    display: {
      locale: preferences.locale,
      baseCurrency: preferences.baseCurrency,
    },
    holdings,
    composition: holdings.map((row) => ({
      key: row.assetId ?? `${row.positionKind}:${row.assetName}`,
      label: row.symbol ? `${row.symbol} · ${row.assetName}` : row.assetName,
      weightPct: row.weightPct,
      positionKind: row.positionKind,
    })),
  };
}

export async function listInvestorCashflows(investorId: string, userId?: string) {
  const currentVersionId = await getCurrentVersionId();
  if (!currentVersionId) {
    return {
      display: null,
      cashflows: [],
    };
  }

  const preferences = await getResolvedPreferences(userId);
  const events = await db
    .select()
    .from(investorCashflowEvents)
    .where(
      and(
        eq(investorCashflowEvents.publishedVersionId, currentVersionId),
        eq(investorCashflowEvents.investorId, investorId),
      ),
    )
    .orderBy(desc(investorCashflowEvents.occurredAt));

  const fxReference = await getFxReference("USD", preferences.baseCurrency);

  return {
    display: {
      locale: preferences.locale,
      baseCurrency: preferences.baseCurrency,
      fxRate: fxReference.rate,
      fxUpdatedAt: fxReference.quoteDay,
    },
    cashflows: events.map((event) => ({
      ...event,
      displayCurrency: preferences.baseCurrency,
      displayAmount:
        preferences.baseCurrency === event.currency
          ? event.amount
          : convertMoneyValue(event.amount, fxReference.rate),
    })),
  };
}
