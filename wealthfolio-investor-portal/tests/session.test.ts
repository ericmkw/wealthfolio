import {
  createSessionToken,
  hashSessionToken,
  SESSION_COOKIE_NAME,
  shouldUseSecureCookie,
} from "@/lib/auth/session";

describe("session helpers", () => {
  it("creates a high-entropy session token and stores only a stable hash", async () => {
    const token = createSessionToken();
    const secondToken = createSessionToken();

    expect(SESSION_COOKIE_NAME).toBe("wf_investor_portal_session");
    expect(token).toHaveLength(64);
    expect(secondToken).toHaveLength(64);
    expect(secondToken).not.toBe(token);

    const hash = await hashSessionToken(token);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).toBe(await hashSessionToken(token));
    expect(hash).not.toBe(token);
  });

  it("does not mark cookies secure for plain http local testing", () => {
    const request = new Request("http://localhost:3001/api/auth/login", {
      method: "POST",
    });

    expect(shouldUseSecureCookie(request)).toBe(false);
  });

  it("marks cookies secure when the request is https behind a proxy", () => {
    const request = new Request("http://192.168.5.7:3001/api/auth/login", {
      method: "POST",
      headers: {
        "x-forwarded-proto": "https",
      },
    });

    expect(shouldUseSecureCookie(request)).toBe(true);
  });
});
