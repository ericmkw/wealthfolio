import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { publishedVersions, quoteReferenceSnapshots } from "@/db/schema";

export interface FxReference {
  rate: string | null;
  quoteDay: string | null;
}

async function getCurrentVersionId() {
  const [current] = await db
    .select({ id: publishedVersions.id })
    .from(publishedVersions)
    .where(eq(publishedVersions.isCurrent, true))
    .limit(1);

  return current?.id ?? null;
}

export async function getFxReference(sourceCurrency: string, targetCurrency: string): Promise<FxReference> {
  if (sourceCurrency === targetCurrency) {
    return {
      rate: "1",
      quoteDay: null,
    };
  }

  const currentVersionId = await getCurrentVersionId();
  if (!currentVersionId) {
    return { rate: null, quoteDay: null };
  }

  const [direct] = await db
    .select()
    .from(quoteReferenceSnapshots)
    .where(
      and(
        eq(quoteReferenceSnapshots.publishedVersionId, currentVersionId),
        eq(quoteReferenceSnapshots.referenceKind, "fx"),
        eq(quoteReferenceSnapshots.sourceCurrency, sourceCurrency),
        eq(quoteReferenceSnapshots.targetCurrency, targetCurrency),
      ),
    )
    .limit(1);

  if (direct) {
    return {
      rate: direct.quoteValue,
      quoteDay: direct.quoteDay,
    };
  }

  const [inverse] = await db
    .select()
    .from(quoteReferenceSnapshots)
    .where(
      and(
        eq(quoteReferenceSnapshots.publishedVersionId, currentVersionId),
        eq(quoteReferenceSnapshots.referenceKind, "fx"),
        eq(quoteReferenceSnapshots.sourceCurrency, targetCurrency),
        eq(quoteReferenceSnapshots.targetCurrency, sourceCurrency),
      ),
    )
    .limit(1);

  if (!inverse) {
    return {
      rate: null,
      quoteDay: null,
    };
  }

  const inverseRate = Number(inverse.quoteValue);
  if (!inverseRate) {
    return {
      rate: null,
      quoteDay: inverse.quoteDay,
    };
  }

  return {
    rate: String(1 / inverseRate),
    quoteDay: inverse.quoteDay,
  };
}

export function convertMoneyValue(value: string | null | undefined, rate: string | null) {
  if (!value || !rate) {
    return value ?? null;
  }

  const numericValue = Number(value);
  const numericRate = Number(rate);
  if (Number.isNaN(numericValue) || Number.isNaN(numericRate)) {
    return value;
  }

  return (numericValue * numericRate).toFixed(8);
}
