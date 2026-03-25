import * as adminValidation from "@/lib/validation/admin";

describe("admin validation", () => {
  it("keeps a dedicated create schema that requires password", () => {
    expect(adminValidation.createInvestorSchema).toBeDefined();

    expect(() =>
      adminValidation.createInvestorSchema?.parse({
        name: "KHM",
        username: "khm",
        email: "khm@gmail.com",
        password: "",
        distributionAccountId: "af5f8242-3b55-4748-bea7-1a8bb5c40354",
        fundAssetId: "913cb2e9-ed3e-4ff5-955b-7370546ba228",
      }),
    ).toThrow("Password is required.");
  });

  it("keeps a dedicated update schema that allows blank password and requires investorId", () => {
    expect(adminValidation.updateInvestorSchema).toBeDefined();

    expect(() =>
      adminValidation.updateInvestorSchema?.parse({
        investorId: "7f55b080-f620-45bc-a806-f6106531eb71",
        name: "KHM",
        username: "khm",
        email: "khm@gmail.com",
        password: "",
        distributionAccountId: "af5f8242-3b55-4748-bea7-1a8bb5c40354",
        fundAssetId: "913cb2e9-ed3e-4ff5-955b-7370546ba228",
      }),
    ).not.toThrow();
  });

  it("requires a dedicated delete schema with username confirmation", () => {
    expect(adminValidation.deleteInvestorSchema).toBeDefined();

    expect(() =>
      adminValidation.deleteInvestorSchema?.parse({
        usernameConfirmation: "",
      }),
    ).toThrow();
  });
});
