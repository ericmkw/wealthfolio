import { Buffer } from "node:buffer";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const post = vi.fn();
  const create = vi.fn(() => ({ post }));
  const wrapper = vi.fn((client) => client);

  return { post, create, wrapper };
});

vi.mock("axios", () => ({
  default: {
    create: mocks.create,
    isAxiosError: (error: unknown) => Boolean((error as { isAxiosError?: boolean })?.isAxiosError),
  },
}));

vi.mock("axios-cookiejar-support", () => ({
  wrapper: mocks.wrapper,
}));

import { fetchWealthfolioSnapshot } from "@/lib/publish/wealthfolio-client";

describe("fetchWealthfolioSnapshot", () => {
  beforeEach(() => {
    mocks.post.mockReset();
    mocks.create.mockClear();
    mocks.wrapper.mockClear();
  });

  it("logs in before requesting backup when password exists", async () => {
    mocks.post.mockResolvedValueOnce({ data: {} }).mockResolvedValueOnce({
      data: {
        filename: "wealthfolio_backup_test.db",
        data_b64: Buffer.from("snapshot").toString("base64"),
      },
    });

    const result = await fetchWealthfolioSnapshot("http://master.test", "secret");

    expect(mocks.post).toHaveBeenNthCalledWith(1, "/api/v1/auth/login", { password: "secret" });
    expect(mocks.post).toHaveBeenNthCalledWith(2, "/api/v1/utilities/database/backup");
    expect(result.filename).toBe("wealthfolio_backup_test.db");
    expect(result.bytes.toString("utf8")).toBe("snapshot");
  });

  it("requests backup directly when password is missing", async () => {
    mocks.post.mockResolvedValueOnce({
      data: {
        filename: "wealthfolio_backup_test.db",
        data_b64: Buffer.from("snapshot").toString("base64"),
      },
    });

    await fetchWealthfolioSnapshot("http://distribution.test", undefined);

    expect(mocks.post).toHaveBeenCalledTimes(1);
    expect(mocks.post).toHaveBeenCalledWith("/api/v1/utilities/database/backup");
  });

  it("accepts the live Wealthfolio backup response shape with dataB64", async () => {
    mocks.post.mockResolvedValueOnce({
      data: {
        filename: "wealthfolio_backup_test.db",
        dataB64: Buffer.from("snapshot").toString("base64"),
      },
    });

    const result = await fetchWealthfolioSnapshot("http://distribution.test", undefined);

    expect(result.bytes.toString("utf8")).toBe("snapshot");
  });

  it("shows a clear login error when password auth fails", async () => {
    mocks.post.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 401 },
    });

    await expect(fetchWealthfolioSnapshot("http://master.test", "wrong-password")).rejects.toThrow(
      "Wealthfolio login failed for http://master.test. Check the password.",
    );
  });

  it("continues to backup when login returns 404 because auth is not configured", async () => {
    mocks.post
      .mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          status: 404,
          data: {
            message: "Authentication is not configured for this server",
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          filename: "wealthfolio_backup_test.db",
          data_b64: Buffer.from("snapshot").toString("base64"),
        },
      });

    const result = await fetchWealthfolioSnapshot("http://master.test", "unused-password");

    expect(mocks.post).toHaveBeenNthCalledWith(1, "/api/v1/auth/login", { password: "unused-password" });
    expect(mocks.post).toHaveBeenNthCalledWith(2, "/api/v1/utilities/database/backup");
    expect(result.bytes.toString("utf8")).toBe("snapshot");
  });

  it("shows a clear auth-required error when password is omitted but backup route is protected", async () => {
    mocks.post.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 401 },
    });

    await expect(fetchWealthfolioSnapshot("http://distribution.test", undefined)).rejects.toThrow(
      "Wealthfolio backup route at http://distribution.test requires authentication. Set the password in portal env.",
    );
  });

  it("shows a clear network error when the instance cannot be reached", async () => {
    mocks.post.mockRejectedValueOnce({
      isAxiosError: true,
      code: "ECONNREFUSED",
    });

    await expect(fetchWealthfolioSnapshot("http://master.test", undefined)).rejects.toThrow(
      "Cannot reach Wealthfolio at http://master.test.",
    );
  });
});
