import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const select = vi.fn();

  return {
    db: { select },
    select,
    eq: vi.fn(() => "eq-condition"),
    asc: vi.fn((value) => value),
    getLocalBackupSources: vi.fn(),
  };
});

vi.mock("drizzle-orm", () => ({
  asc: mocks.asc,
  eq: mocks.eq,
}));

vi.mock("@/db/client", () => ({
  db: mocks.db,
}));

vi.mock("@/lib/services/local-backup-service", () => ({
  getLocalBackupSources: mocks.getLocalBackupSources,
}));

import { getAdminSourceOptions } from "@/lib/services/source-options-service";

describe("getAdminSourceOptions", () => {
  beforeEach(() => {
    mocks.select.mockReset();
    mocks.eq.mockClear();
    mocks.asc.mockClear();
    mocks.getLocalBackupSources.mockReset();
  });

  it("prefers latest published source metadata over local backup dropdown options", async () => {
    mocks.getLocalBackupSources.mockResolvedValue({
      masterPath: null,
      distributionPath: null,
      accounts: [{ id: "local-acct", label: "Local Account" }],
      fundAssets: [{ id: "local-fund", label: "Local Fund" }],
    });

    const currentVersionLimit = vi.fn().mockResolvedValue([{ id: "published-1" }]);
    const currentVersionWhere = vi.fn(() => ({ limit: currentVersionLimit }));
    const currentVersionFrom = vi.fn(() => ({ where: currentVersionWhere }));

    const publishedAccountsOrderBy = vi.fn().mockResolvedValue([{ id: "acct-1", label: "KHM_USD" }]);
    const publishedAccountsWhere = vi.fn(() => ({ orderBy: publishedAccountsOrderBy }));
    const publishedAccountsFrom = vi.fn(() => ({ where: publishedAccountsWhere }));

    const publishedAssetsOrderBy = vi
      .fn()
      .mockResolvedValue([{ id: "fund-1", label: "RICHUSD - Family Fund" }]);
    const publishedAssetsWhere = vi.fn(() => ({ orderBy: publishedAssetsOrderBy }));
    const publishedAssetsFrom = vi.fn(() => ({ where: publishedAssetsWhere }));

    mocks.select
      .mockReturnValueOnce({ from: currentVersionFrom })
      .mockReturnValueOnce({ from: publishedAccountsFrom })
      .mockReturnValueOnce({ from: publishedAssetsFrom });

    await expect(getAdminSourceOptions()).resolves.toEqual({
      masterPath: null,
      distributionPath: null,
      accounts: [{ id: "acct-1", label: "KHM_USD" }],
      fundAssets: [{ id: "fund-1", label: "RICHUSD - Family Fund" }],
    });
  });
});
