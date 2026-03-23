import { publishRequestSchema } from "@/lib/validation/publish";

describe("publishRequestSchema", () => {
  it("accepts an empty payload for remote publish", () => {
    expect(publishRequestSchema.parse({})).toEqual({});
  });

  it("accepts both local file paths together", () => {
    expect(
      publishRequestSchema.parse({
        masterPath: "/Volumes/docker/master.db",
        distributionPath: "/Volumes/docker/distribution.db",
      }),
    ).toEqual({
      masterPath: "/Volumes/docker/master.db",
      distributionPath: "/Volumes/docker/distribution.db",
    });
  });

  it("rejects partial local file input", () => {
    expect(() =>
      publishRequestSchema.parse({
        masterPath: "/Volumes/docker/master.db",
      }),
    ).toThrow("Both masterPath and distributionPath are required");
  });
});
