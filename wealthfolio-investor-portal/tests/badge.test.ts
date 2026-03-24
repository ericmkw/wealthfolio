import { getBadgeClassName } from "@/components/ui/badge";

describe("badge styles", () => {
  it("gives BUY a darker green light theme style while keeping dark theme styling", () => {
    const className = getBadgeClassName("BUY");

    expect(className).toContain("bg-lime-100");
    expect(className).toContain("text-green-700");
    expect(className).toContain("dark:bg-lime-500/15");
    expect(className).toContain("dark:text-lime-300");
  });
});
