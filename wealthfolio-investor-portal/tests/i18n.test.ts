import { describe, expect, it } from "vitest";
import { getMessages } from "@/lib/i18n";
import { formatDate, formatMoney } from "@/lib/utils";

describe("i18n messages", () => {
  it("returns localized admin labels for zh-HK", () => {
    const messages = getMessages("zh-HK");

    expect(messages.common.logout).toBe("登出");
    expect(messages.admin.publishPanelTitle).toBe("發佈快照");
    expect(messages.admin.saveInvestor).toBe("儲存投資者對應");
  });

  it("returns localized admin labels for en", () => {
    const messages = getMessages("en");

    expect(messages.common.logout).toBe("Sign Out");
    expect(messages.admin.publishPanelTitle).toBe("Publish Snapshot");
    expect(messages.admin.saveInvestor).toBe("Save Investor Mapping");
  });

  it("formats money and dates by locale", () => {
    expect(formatMoney("1234.56", "HKD", "zh-HK")).toContain("HK$");
    expect(formatMoney("1234.56", "USD", "en")).toContain("$1,234.56");
    expect(formatMoney("1234.56", "USD", "zh-CN")).toContain("美元");
    expect(formatMoney("1234.56", "HKD", "zh-CN")).toContain("港币");
    expect(formatDate("2026-03-23T00:00:00.000Z", "zh-CN")).toMatch(/2026.*3.*23/);
  });
});
