import { describe, expect, it } from "vitest";
import { resolveDisplayMoney } from "@/lib/display-money";
import { zhHK } from "@/lib/messages/zh-HK";

describe("display money rules", () => {
  it("converts NAV-like amounts into base currency", () => {
    expect(
      resolveDisplayMoney({
        value: "100.77",
        sourceCurrency: "USD",
        baseCurrency: "HKD",
        rate: "7.8312",
        mode: "convert",
      }),
    ).toEqual({
      value: "789.15002400",
      currency: "HKD",
    });
  });

  it("keeps quoted fund prices in source currency", () => {
    expect(
      resolveDisplayMoney({
        value: "100.77",
        sourceCurrency: "USD",
        baseCurrency: "HKD",
        rate: "7.8312",
        mode: "preserve-source",
      }),
    ).toEqual({
      value: "100.77",
      currency: "USD",
    });
  });
});

describe("updated copy", () => {
  it("uses fund wording, holdings labels, and simpler NAV history wording", () => {
    expect(zhHK.overview.performanceHistoryDescription).toBe("你的 NAV 記錄");
    expect(zhHK.overview.unitPriceHistoryDescription).toBe("你嘅 fund 報價紀錄。");
    expect(zhHK.activities.assetName).toBe("股票名");
    expect(zhHK.activities.fundHoldings).toBe("基金持倉");
    expect(zhHK.activities.position).toBe("倉位");
    expect(zhHK.activities.holdingComposition).toBe("持倉組合");
  });
});
