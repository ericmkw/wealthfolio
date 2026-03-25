import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

import { InvestorMappingForm } from "@/components/admin/investor-mapping-form";

describe("InvestorMappingForm", () => {
  it("renders edit mode with prefilled values and a cancel action", () => {
    const html = renderToStaticMarkup(
      React.createElement(InvestorMappingForm, {
        locale: "en",
        mode: "edit",
        initialValues: {
          investorId: "7f55b080-f620-45bc-a806-f6106531eb71",
          name: "Eric Ma",
          username: "ericma",
          email: "eric@example.com",
          password: "",
          distributionAccountId: "acct-1",
          fundAssetId: "fund-1",
        },
        sourceOptions: {
          accounts: [{ id: "acct-1", label: "KHM_USD" }],
          fundAssets: [{ id: "fund-1", label: "RICHUSD - Family Fund" }],
        },
        onSaved: () => undefined,
        onCancel: () => undefined,
      }),
    );

    expect(html).toContain("Edit Investor");
    expect(html).toContain("Update Investor");
    expect(html).toContain("Cancel");
    expect(html).toContain('value="ericma"');
  });
});
