import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  fundOperationEvents,
  investorCashflowEvents,
  investorPerformanceSnapshots,
  investorPositionSnapshots,
  publishRuns,
  publishedDistributionAccounts,
  publishedDistributionAssets,
  publishedVersions,
  quoteReferenceSnapshots,
  unitPriceSnapshots,
} from "@/db/schema";
import { getPortalEnv } from "@/lib/env";
import { buildInvestorProjection } from "@/lib/publish/distribution-transform";
import { readLocalSnapshotFile } from "@/lib/publish/local-snapshot";
import { extractFundOperationEvents } from "@/lib/publish/master-transform";
import {
  openReadonlySnapshot,
  readDistributionAccounts,
  readDistributionActivities,
  readDistributionFundAssets,
  readLatestFundQuoteReferences,
  readLatestFxQuoteReferences,
  readDistributionQuotes,
  readDistributionValuations,
  readLatestDistributionSnapshot,
  readMasterActivityRows,
} from "@/lib/publish/source-readers";
import { fetchWealthfolioSnapshot } from "@/lib/publish/wealthfolio-client";
import { listInvestorMappingsForPublish } from "@/lib/services/admin-service";

interface PublishPipelineOptions {
  masterPath?: string;
  distributionPath?: string;
}

export async function runPublishPipeline(options: PublishPipelineOptions = {}) {
  const runId = randomUUID();
  const env = getPortalEnv();
  const mappings = await listInvestorMappingsForPublish();

  await db.insert(publishRuns).values({
    id: runId,
    status: "running",
  });

  let publishDir = "";
  let masterSnapshotPath = "";
  let distributionSnapshotPath = "";

  try {
    const [masterSnapshot, distributionSnapshot] =
      options.masterPath && options.distributionPath
        ? await Promise.all([
            readLocalSnapshotFile(options.masterPath),
            readLocalSnapshotFile(options.distributionPath),
          ])
        : await Promise.all([
            fetchWealthfolioSnapshot(env.MASTER_BASE_URL, env.MASTER_PASSWORD),
            fetchWealthfolioSnapshot(env.DISTRIBUTION_BASE_URL, env.DISTRIBUTION_PASSWORD),
          ]);

    publishDir = path.join(env.PUBLISH_TMP_DIR, runId);
    await fs.mkdir(publishDir, { recursive: true });

    masterSnapshotPath = path.join(publishDir, `master-${masterSnapshot.filename}`);
    distributionSnapshotPath = path.join(publishDir, `distribution-${distributionSnapshot.filename}`);

    await Promise.all([
      fs.writeFile(masterSnapshotPath, masterSnapshot.bytes),
      fs.writeFile(distributionSnapshotPath, distributionSnapshot.bytes),
    ]);

    await db
      .update(publishRuns)
      .set({
        masterSnapshotFilename: masterSnapshot.filename,
        distributionSnapshotFilename: distributionSnapshot.filename,
      })
      .where(eq(publishRuns.id, runId));

    const masterDb = openReadonlySnapshot(masterSnapshotPath);
    const distributionDb = openReadonlySnapshot(distributionSnapshotPath);

    try {
      const fundOperations = extractFundOperationEvents(readMasterActivityRows(masterDb));
      const distributionAccounts = readDistributionAccounts(distributionDb);
      const distributionFundAssets = readDistributionFundAssets(distributionDb);
      const uniqueFundAssetIds = [...new Set(mappings.map((mapping) => mapping.fundAssetId))];
      const quoteReferences = [
        ...readLatestFundQuoteReferences(distributionDb, uniqueFundAssetIds),
        ...readLatestFxQuoteReferences(distributionDb),
      ];
      const investorPayloads = mappings.map((mapping) => {
        const valuations = readDistributionValuations(distributionDb, mapping.distributionAccountId);
        const snapshots = readLatestDistributionSnapshot(distributionDb, mapping.distributionAccountId);
        const quotes = readDistributionQuotes(distributionDb, mapping.fundAssetId);
        const activities = readDistributionActivities(distributionDb, mapping.distributionAccountId);
        const projection = buildInvestorProjection({
          accountId: mapping.distributionAccountId,
          fundAssetId: mapping.fundAssetId,
          valuations,
          snapshots,
          quotes,
          activities,
        });

        return {
          mapping,
          projection,
          quotes,
        };
      });

      const publishedVersionId = randomUUID();

      await db.transaction(async (tx) => {
        await tx
          .update(publishedVersions)
          .set({
            isCurrent: false,
          })
          .where(eq(publishedVersions.isCurrent, true));

        await tx.insert(publishedVersions).values({
          id: publishedVersionId,
          masterSnapshotFilename: masterSnapshot.filename,
          distributionSnapshotFilename: distributionSnapshot.filename,
          isCurrent: true,
        });

        if (distributionAccounts.length) {
          await tx.insert(publishedDistributionAccounts).values(
            distributionAccounts.map((account) => ({
              id: randomUUID(),
              publishedVersionId,
              accountId: account.id,
              accountName: account.label,
            })),
          );
        }

        if (distributionFundAssets.length) {
          await tx.insert(publishedDistributionAssets).values(
            distributionFundAssets.map((asset) => ({
              id: randomUUID(),
              publishedVersionId,
              assetId: asset.id,
              label: asset.label,
            })),
          );
        }

        if (fundOperations.length) {
          await tx.insert(fundOperationEvents).values(
            fundOperations.map((event) => ({
              id: randomUUID(),
              publishedVersionId,
              sourceActivityId: event.sourceActivityId,
              occurredAt: event.occurredAt,
              activityType: event.activityType,
              symbol: event.symbol,
              assetName: event.assetName,
              unitPrice: event.unitPrice,
              fee: event.fee,
              currency: event.currency,
              accountName: event.accountName,
            })),
          );
        }

        if (quoteReferences.length) {
          await tx.insert(quoteReferenceSnapshots).values(
            quoteReferences.map((quote) => ({
              id: randomUUID(),
              publishedVersionId,
              referenceKind: quote.targetCurrency ? "fx" : "fund",
              referenceKey: quote.targetCurrency
                ? `${quote.sourceCurrency}/${quote.targetCurrency}`
                : quote.assetId,
              assetId: quote.assetId,
              label: quote.label ?? quote.assetId,
              sourceCurrency: quote.sourceCurrency ?? "USD",
              targetCurrency: quote.targetCurrency ?? null,
              quoteDay: quote.day,
              quoteValue: quote.close,
            })),
          );
        }

        for (const payload of investorPayloads) {
          await tx.insert(investorPositionSnapshots).values({
            id: randomUUID(),
            publishedVersionId,
            investorId: payload.mapping.investorId,
            distributionAccountId: payload.mapping.distributionAccountId,
            fundAssetId: payload.mapping.fundAssetId,
            latestNav: payload.projection.latestNav,
            latestUnitPrice: payload.projection.latestUnitPrice,
            unitsHeld: payload.projection.unitsHeld,
            currency: "USD",
          });

          if (payload.projection.cashflows.length) {
            await tx.insert(investorCashflowEvents).values(
              payload.projection.cashflows.map((event) => ({
                id: randomUUID(),
                publishedVersionId,
                investorId: payload.mapping.investorId,
                sourceActivityId: event.sourceActivityId,
                eventType: event.eventType,
                occurredAt: event.occurredAt,
                amount: event.amount,
                currency: event.currency,
              })),
            );
          }

          if (payload.projection.performanceHistory.length) {
            await tx.insert(investorPerformanceSnapshots).values(
              payload.projection.performanceHistory.map((point) => ({
                id: randomUUID(),
                publishedVersionId,
                investorId: payload.mapping.investorId,
                valuationDate: point.date,
                nav: point.nav,
              })),
            );
          }

          if (payload.quotes.length) {
            await tx.insert(unitPriceSnapshots).values(
              payload.quotes.map((quote) => ({
                id: randomUUID(),
                publishedVersionId,
                investorId: payload.mapping.investorId,
                fundAssetId: payload.mapping.fundAssetId,
                quoteDay: quote.day,
                unitPrice: quote.close,
              })),
            );
          }
        }

        await tx
          .update(publishRuns)
          .set({
            status: "succeeded",
            publishedVersionId,
            finishedAt: new Date(),
          })
          .where(eq(publishRuns.id, runId));
      });

      return {
        runId,
        publishedVersionId,
      };
    } finally {
      masterDb.close();
      distributionDb.close();
    }
  } catch (error) {
    await db
      .update(publishRuns)
      .set({
        status: "failed",
        finishedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      })
      .where(eq(publishRuns.id, runId));

    throw error;
  } finally {
    if (publishDir) {
      await fs.rm(publishDir, { recursive: true, force: true });
    }
  }
}
