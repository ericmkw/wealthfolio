import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  investorPerformanceSnapshots,
  investorPositionSnapshots,
  publishedVersions,
  quoteReferenceSnapshots,
  unitPriceSnapshots,
} from "@/db/schema";
import { resolveDisplayMoney } from "@/lib/display-money";
import { getFxReference } from "@/lib/fx";
import { getResolvedPreferences } from "@/lib/preferences";

async function getCurrentVersionId() {
  const [current] = await db
    .select({ id: publishedVersions.id })
    .from(publishedVersions)
    .where(eq(publishedVersions.isCurrent, true))
    .limit(1);

  return current?.id ?? null;
}

export async function getInvestorOverview(investorId: string, userId?: string) {
  const currentVersionId = await getCurrentVersionId();
  if (!currentVersionId) {
    return null;
  }

  const [snapshot] = await db
    .select()
    .from(investorPositionSnapshots)
    .where(
      and(
        eq(investorPositionSnapshots.publishedVersionId, currentVersionId),
        eq(investorPositionSnapshots.investorId, investorId),
      ),
    )
    .limit(1);

  if (!snapshot) {
    return null;
  }

  const performanceHistory = await db
    .select()
    .from(investorPerformanceSnapshots)
    .where(
      and(
        eq(investorPerformanceSnapshots.publishedVersionId, currentVersionId),
        eq(investorPerformanceSnapshots.investorId, investorId),
      ),
    )
    .orderBy(asc(investorPerformanceSnapshots.valuationDate));

  const unitPriceHistory = await db
    .select()
    .from(unitPriceSnapshots)
    .where(
      and(
        eq(unitPriceSnapshots.publishedVersionId, currentVersionId),
        eq(unitPriceSnapshots.investorId, investorId),
      ),
    )
    .orderBy(asc(unitPriceSnapshots.quoteDay));

  const preferences = await getResolvedPreferences(userId);

  const fxReference = await getFxReference(snapshot.currency, preferences.baseCurrency);
  const [unitPriceReference] = await db
    .select()
    .from(quoteReferenceSnapshots)
    .where(
      and(
        eq(quoteReferenceSnapshots.publishedVersionId, currentVersionId),
        eq(quoteReferenceSnapshots.referenceKind, "fund"),
        eq(quoteReferenceSnapshots.assetId, snapshot.fundAssetId),
      ),
    )
    .limit(1);

  return {
    snapshot,
    performanceHistory: performanceHistory.map((point) => ({
      ...point,
      displayNav: resolveDisplayMoney({
        value: point.nav,
        sourceCurrency: snapshot.currency,
        baseCurrency: preferences.baseCurrency,
        rate: fxReference.rate,
        mode: "convert",
      }).value,
    })),
    unitPriceHistory: unitPriceHistory.map((point) => ({
      ...point,
      displayUnitPrice: resolveDisplayMoney({
        value: point.unitPrice,
        sourceCurrency: snapshot.currency,
        baseCurrency: preferences.baseCurrency,
        rate: fxReference.rate,
        mode: "preserve-source",
      }).value,
      displayUnitPriceCurrency: resolveDisplayMoney({
        value: point.unitPrice,
        sourceCurrency: snapshot.currency,
        baseCurrency: preferences.baseCurrency,
        rate: fxReference.rate,
        mode: "preserve-source",
      }).currency,
    })),
    display: {
      locale: preferences.locale,
      theme: preferences.theme,
      sourceCurrency: snapshot.currency,
      baseCurrency: preferences.baseCurrency,
      fxRate: fxReference.rate,
      fxUpdatedAt: fxReference.quoteDay,
      latestNav: resolveDisplayMoney({
        value: snapshot.latestNav,
        sourceCurrency: snapshot.currency,
        baseCurrency: preferences.baseCurrency,
        rate: fxReference.rate,
        mode: "convert",
      }).value,
      latestNavCurrency: resolveDisplayMoney({
        value: snapshot.latestNav,
        sourceCurrency: snapshot.currency,
        baseCurrency: preferences.baseCurrency,
        rate: fxReference.rate,
        mode: "convert",
      }).currency,
      latestUnitPrice: resolveDisplayMoney({
        value: snapshot.latestUnitPrice,
        sourceCurrency: snapshot.currency,
        baseCurrency: preferences.baseCurrency,
        rate: fxReference.rate,
        mode: "preserve-source",
      }).value,
      latestUnitPriceCurrency: resolveDisplayMoney({
        value: snapshot.latestUnitPrice,
        sourceCurrency: snapshot.currency,
        baseCurrency: preferences.baseCurrency,
        rate: fxReference.rate,
        mode: "preserve-source",
      }).currency,
      unitPriceUpdatedAt: unitPriceReference?.quoteDay ?? unitPriceHistory.at(-1)?.quoteDay ?? null,
    },
  };
}
