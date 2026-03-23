import { describe, expect, it } from "vitest";
import { loginSchema } from "@/lib/validation/auth";

describe("login validation", () => {
  it("accepts username-first payloads", () => {
    const payload = loginSchema.safeParse({
      username: "admin",
      password: "1234",
    });

    expect(payload.success).toBe(true);
    if (payload.success) {
      expect(payload.data.identifier).toBe("admin");
      expect(payload.data.password).toBe("1234");
    }
  });

  it("keeps backward compatibility for identifier payloads", () => {
    const payload = loginSchema.safeParse({
      identifier: "admin",
      password: "1234",
    });

    expect(payload.success).toBe(true);
    if (payload.success) {
      expect(payload.data.identifier).toBe("admin");
    }
  });
});
