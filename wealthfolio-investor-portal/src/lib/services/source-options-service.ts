import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  publishedDistributionAccounts,
  publishedDistributionAssets,
  publishedVersions,
} from "@/db/schema";
import { getLocalBackupSources, type LocalBackupSources } from "@/lib/services/local-backup-service";

async function getCurrentPublishedVersionId() {
  const [current] = await db
    .select({ id: publishedVersions.id })
    .from(publishedVersions)
    .where(eq(publishedVersions.isCurrent, true))
    .limit(1);

  return current?.id ?? null;
}

async function getPublishedSourceOptions(publishedVersionId: string) {
  const [accounts, fundAssets] = await Promise.all([
    db
      .select({
        id: publishedDistributionAccounts.accountId,
        label: publishedDistributionAccounts.accountName,
      })
      .from(publishedDistributionAccounts)
      .where(eq(publishedDistributionAccounts.publishedVersionId, publishedVersionId))
      .orderBy(asc(publishedDistributionAccounts.accountName)),
    db
      .select({
        id: publishedDistributionAssets.assetId,
        label: publishedDistributionAssets.label,
      })
      .from(publishedDistributionAssets)
      .where(eq(publishedDistributionAssets.publishedVersionId, publishedVersionId))
      .orderBy(asc(publishedDistributionAssets.label)),
  ]);

  return { accounts, fundAssets };
}

export async function getAdminSourceOptions(): Promise<LocalBackupSources> {
  const localSources = await getLocalBackupSources();
  const currentPublishedVersionId = await getCurrentPublishedVersionId();

  if (!currentPublishedVersionId) {
    return localSources;
  }

  const publishedOptions = await getPublishedSourceOptions(currentPublishedVersionId);

  return {
    masterPath: localSources.masterPath,
    distributionPath: localSources.distributionPath,
    accounts: publishedOptions.accounts.length ? publishedOptions.accounts : localSources.accounts,
    fundAssets: publishedOptions.fundAssets.length ? publishedOptions.fundAssets : localSources.fundAssets,
  };
}
