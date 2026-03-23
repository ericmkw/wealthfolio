import { convertMoneyValue } from "@/lib/fx";

describe("overview display helpers", () => {
  it("converts USD display values into HKD using the latest FX rate", () => {
    expect(convertMoneyValue("100.00", "7.8")).toBe("780.00000000");
    expect(convertMoneyValue("19132.65", "7.8")).toBe("149234.67000000");
  });

  it("passes through nulls and missing rates safely", () => {
    expect(convertMoneyValue(null, "7.8")).toBeNull();
    expect(convertMoneyValue("100.00", null)).toBe("100.00");
  });
});
