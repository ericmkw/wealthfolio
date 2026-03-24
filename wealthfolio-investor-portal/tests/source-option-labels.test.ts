import { describe, expect, it } from "vitest";
import { resolveMappingLabels } from "@/lib/source-option-labels";

describe("resolveMappingLabels", () => {
  it("maps stored ids back to source labels", () => {
    expect(
      resolveMappingLabels(
        [
          { id: "acct-hkd", label: "WWQ_HKD" },
          { id: "acct-usd", label: "WWQ_USD" },
        ],
        [{ id: "fund-usd", label: "RICHUSD - Be Rich Fund - USD" }],
        {
          distributionAccountId: "acct-usd",
          fundAssetId: "fund-usd",
        },
      ),
    ).toEqual({
      distributionAccountLabel: "WWQ_USD",
      fundAssetLabel: "RICHUSD - Be Rich Fund - USD",
    });
  });

  it("returns null labels when ids are missing from the source options", () => {
    expect(resolveMappingLabels([], [], { distributionAccountId: "missing", fundAssetId: "missing" })).toEqual({
      distributionAccountLabel: null,
      fundAssetLabel: null,
    });
  });
});
