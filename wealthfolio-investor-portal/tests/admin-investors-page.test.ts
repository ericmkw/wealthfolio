import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  getResolvedPreferences: vi.fn(),
  listInvestorMappings: vi.fn(),
  getAdminSourceOptions: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mocks.refresh,
  }),
}));

vi.mock("@/components/layout/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children),
}));

vi.mock("@/lib/auth/server", () => ({
  requireUser: mocks.requireUser,
}));

vi.mock("@/lib/preferences", () => ({
  getResolvedPreferences: mocks.getResolvedPreferences,
}));

vi.mock("@/lib/services/admin-service", () => ({
  listInvestorMappings: mocks.listInvestorMappings,
}));

vi.mock("@/lib/services/source-options-service", () => ({
  getAdminSourceOptions: mocks.getAdminSourceOptions,
}));

import AdminInvestorsPage from "@/app/admin/investors/page";

describe("AdminInvestorsPage", () => {
  beforeEach(() => {
    mocks.requireUser.mockResolvedValue({
      id: "admin-1",
      role: "admin",
      username: "admin",
      email: "admin@example.com",
      investorId: null,
      displayName: "Admin",
    });
    mocks.getResolvedPreferences.mockResolvedValue({
      locale: "en",
      theme: "dark",
      baseCurrency: "USD",
      timezone: "Asia/Hong_Kong",
    });
    mocks.listInvestorMappings.mockResolvedValue([
      {
        investorId: "investor-1",
        investorName: "Active Investor",
        username: "active-user",
        email: "active@example.com",
        displayName: "Active Investor",
        distributionAccountId: "acct-1",
        fundAssetId: "fund-1",
        userId: "user-1",
        isActive: true,
      },
      {
        investorId: "investor-2",
        investorName: "Inactive Investor",
        username: "inactive-user",
        email: "inactive@example.com",
        displayName: "Inactive Investor",
        distributionAccountId: "acct-2",
        fundAssetId: "fund-2",
        userId: "user-2",
        isActive: false,
      },
    ]);
    mocks.getAdminSourceOptions.mockResolvedValue({
      masterPath: "",
      distributionPath: "",
      accounts: [
        { id: "acct-1", label: "KHM_USD" },
        { id: "acct-2", label: "BE_RICH_FUND_USD" },
      ],
      fundAssets: [
        { id: "fund-1", label: "RICHUSD - Family Fund" },
        { id: "fund-2", label: "BRICHUSD - Growth Fund" },
      ],
    });
  });

  it("renders status and action controls for configured investors", async () => {
    const html = renderToStaticMarkup(await AdminInvestorsPage());

    expect(html).toContain("Status");
    expect(html).toContain("Actions");
    expect(html).toContain("Edit");
    expect(html).toContain("Deactivate");
    expect(html).toContain("Reactivate");
    expect(html).toContain("Delete");
  });
});
