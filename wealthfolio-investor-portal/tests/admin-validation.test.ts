import { investorMappingSchema } from "@/lib/validation/admin";

describe("investorMappingSchema", () => {
  it("rejects passwords shorter than 8 characters with a clear message", () => {
    expect(() =>
      investorMappingSchema.parse({
        name: "KHM",
        username: "khm",
        email: "khm@gmail.com",
        password: "",
        distributionAccountId: "af5f8242-3b55-4748-bea7-1a8bb5c40354",
        fundAssetId: "913cb2e9-ed3e-4ff5-955b-7370546ba228",
      }),
    ).toThrow("Password is required.");
  });
});
