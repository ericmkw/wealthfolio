import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const insert = vi.fn();
  const update = vi.fn();
  const transaction = vi.fn();
  const db = {
    insert,
    update,
    transaction,
  };

  return {
    db,
    insert,
    update,
    transaction,
    eq: vi.fn(() => "eq-condition"),
    mkdir: vi.fn(),
    writeFile: vi.fn(),
    rm: vi.fn(),
    fetchWealthfolioSnapshot: vi.fn(),
    listInvestorMappingsForPublish: vi.fn(),
    openReadonlySnapshot: vi.fn(),
    readMasterActivityRows: vi.fn(),
    extractFundOperationEvents: vi.fn(),
    readDistributionAccounts: vi.fn(),
    readDistributionFundAssets: vi.fn(),
    readLatestFundQuoteReferences: vi.fn(),
    readLatestFxQuoteReferences: vi.fn(),
    readDistributionValuations: vi.fn(),
    readLatestDistributionSnapshot: vi.fn(),
    readDistributionQuotes: vi.fn(),
    readDistributionActivities: vi.fn(),
    buildInvestorProjection: vi.fn(),
    getPortalEnv: vi.fn(),
  };
});

vi.mock("node:fs/promises", () => ({
  default: {
    mkdir: mocks.mkdir,
    writeFile: mocks.writeFile,
    rm: mocks.rm,
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: mocks.eq,
}));

vi.mock("@/db/client", () => ({
  db: mocks.db,
}));

vi.mock("@/lib/env", () => ({
  getPortalEnv: mocks.getPortalEnv,
}));

vi.mock("@/lib/publish/wealthfolio-client", () => ({
  fetchWealthfolioSnapshot: mocks.fetchWealthfolioSnapshot,
}));

vi.mock("@/lib/services/admin-service", () => ({
  listInvestorMappingsForPublish: mocks.listInvestorMappingsForPublish,
}));

vi.mock("@/lib/publish/source-readers", () => ({
  openReadonlySnapshot: mocks.openReadonlySnapshot,
  readMasterActivityRows: mocks.readMasterActivityRows,
  readDistributionAccounts: mocks.readDistributionAccounts,
  readDistributionFundAssets: mocks.readDistributionFundAssets,
  readLatestFundQuoteReferences: mocks.readLatestFundQuoteReferences,
  readLatestFxQuoteReferences: mocks.readLatestFxQuoteReferences,
  readDistributionValuations: mocks.readDistributionValuations,
  readLatestDistributionSnapshot: mocks.readLatestDistributionSnapshot,
  readDistributionQuotes: mocks.readDistributionQuotes,
  readDistributionActivities: mocks.readDistributionActivities,
}));

vi.mock("@/lib/publish/master-transform", () => ({
  extractFundOperationEvents: mocks.extractFundOperationEvents,
}));

vi.mock("@/lib/publish/distribution-transform", () => ({
  buildInvestorProjection: mocks.buildInvestorProjection,
}));

import { runPublishPipeline } from "@/lib/publish/publish-service";

describe("runPublishPipeline", () => {
  beforeEach(() => {
    mocks.insert.mockReset();
    mocks.update.mockReset();
    mocks.transaction.mockReset();
    mocks.eq.mockClear();
    mocks.mkdir.mockReset();
    mocks.writeFile.mockReset();
    mocks.rm.mockReset();
    mocks.fetchWealthfolioSnapshot.mockReset();
    mocks.listInvestorMappingsForPublish.mockReset();
    mocks.openReadonlySnapshot.mockReset();
    mocks.readMasterActivityRows.mockReset();
    mocks.extractFundOperationEvents.mockReset();
    mocks.readDistributionAccounts.mockReset();
    mocks.readDistributionFundAssets.mockReset();
    mocks.readLatestFundQuoteReferences.mockReset();
    mocks.readLatestFxQuoteReferences.mockReset();
    mocks.readDistributionValuations.mockReset();
    mocks.readLatestDistributionSnapshot.mockReset();
    mocks.readDistributionQuotes.mockReset();
    mocks.readDistributionActivities.mockReset();
    mocks.buildInvestorProjection.mockReset();
    mocks.getPortalEnv.mockReset();

    mocks.getPortalEnv.mockReturnValue({
      MASTER_BASE_URL: "http://master.test",
      MASTER_PASSWORD: undefined,
      DISTRIBUTION_BASE_URL: "http://distribution.test",
      DISTRIBUTION_PASSWORD: undefined,
      PUBLISH_TMP_DIR: "/tmp/wf-publish",
    });

    const insertChain = { values: vi.fn().mockResolvedValue(undefined) };
    const updateChain = { set: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) })) };
    mocks.insert.mockReturnValue(insertChain);
    mocks.update.mockReturnValue(updateChain);

    mocks.transaction.mockImplementation(async (callback) => {
      const txInsert = vi.fn(() => ({ values: vi.fn().mockResolvedValue(undefined) }));
      const txUpdate = vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) })) }));

      return callback({
        insert: txInsert,
        update: txUpdate,
      });
    });

    mocks.fetchWealthfolioSnapshot
      .mockResolvedValueOnce({
        filename: "master.db",
        bytes: Buffer.from("master"),
      })
      .mockResolvedValueOnce({
        filename: "distribution.db",
        bytes: Buffer.from("distribution"),
      });

    mocks.listInvestorMappingsForPublish.mockResolvedValue([]);
    mocks.openReadonlySnapshot
      .mockReturnValueOnce({ close: vi.fn() })
      .mockReturnValueOnce({ close: vi.fn() });
    mocks.readMasterActivityRows.mockReturnValue([]);
    mocks.extractFundOperationEvents.mockReturnValue([]);
    mocks.readDistributionAccounts.mockReturnValue([{ id: "acct-1", label: "KHM_USD" }]);
    mocks.readDistributionFundAssets.mockReturnValue([{ id: "fund-1", label: "RICHUSD - Family Fund" }]);
    mocks.readLatestFundQuoteReferences.mockReturnValue([]);
    mocks.readLatestFxQuoteReferences.mockReturnValue([]);
  });

  it("publishes source metadata even when investor mappings are not configured yet", async () => {
    await expect(runPublishPipeline({})).resolves.toMatchObject({
      runId: expect.any(String),
      publishedVersionId: expect.any(String),
    });

    expect(mocks.fetchWealthfolioSnapshot).toHaveBeenCalledTimes(2);
    expect(mocks.readDistributionAccounts).toHaveBeenCalledTimes(1);
    expect(mocks.readDistributionFundAssets).toHaveBeenCalledTimes(1);
  });

  it("writes master and distribution snapshots to distinct temp paths even when filenames match", async () => {
    mocks.fetchWealthfolioSnapshot
      .mockReset()
      .mockResolvedValueOnce({
        filename: "wealthfolio_backup_20260323_103106.db",
        bytes: Buffer.from("master"),
      })
      .mockResolvedValueOnce({
        filename: "wealthfolio_backup_20260323_103106.db",
        bytes: Buffer.from("distribution"),
      });

    await runPublishPipeline({});

    expect(mocks.writeFile).toHaveBeenCalledTimes(2);

    const snapshotPaths = mocks.writeFile.mock.calls.map((call) => String(call[0]));
    expect(new Set(snapshotPaths).size).toBe(2);
    expect(snapshotPaths[0]).toContain("master-wealthfolio_backup_20260323_103106.db");
    expect(snapshotPaths[1]).toContain("distribution-wealthfolio_backup_20260323_103106.db");
  });
});
