import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  fundOperationEvents,
  investorCashflowEvents,
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

  const fxReference = await getFxReference("USD", preferences.baseCurrency);

  return {
    display: {
      locale: preferences.locale,
      baseCurrency: preferences.baseCurrency,
      fxRate: fxReference.rate,
      fxUpdatedAt: fxReference.quoteDay,
    },
    activities: events.map((event) => ({
      ...event,
      displayCurrency: preferences.baseCurrency,
      displayUnitPrice: resolveDisplayMoney({
        value: event.unitPrice,
        sourceCurrency: event.currency,
        baseCurrency: preferences.baseCurrency,
        rate: fxReference.rate,
        mode: "preserve-source",
      }).value,
      displayUnitPriceCurrency: resolveDisplayMoney({
        value: event.unitPrice,
        sourceCurrency: event.currency,
        baseCurrency: preferences.baseCurrency,
        rate: fxReference.rate,
        mode: "preserve-source",
      }).currency,
      displayFee:
        preferences.baseCurrency === event.currency ? event.fee : convertMoneyValue(event.fee, fxReference.rate),
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
