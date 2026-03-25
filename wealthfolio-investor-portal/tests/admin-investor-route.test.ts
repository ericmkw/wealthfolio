import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuthenticatedUserFromToken: vi.fn(),
  setInvestorActiveState: vi.fn(),
  deleteInvestor: vi.fn(),
}));

vi.mock("@/lib/auth/server", () => ({
  getAuthenticatedUserFromToken: mocks.getAuthenticatedUserFromToken,
}));

vi.mock("@/lib/services/admin-service", async () => {
  const actual = await vi.importActual<typeof import("@/lib/services/admin-service")>(
    "@/lib/services/admin-service",
  );

  return {
    ...actual,
    setInvestorActiveState: mocks.setInvestorActiveState,
    deleteInvestor: mocks.deleteInvestor,
  };
});

import { PATCH, DELETE } from "@/app/api/admin/investor-account-mappings/[investorId]/route";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { AdminInvestorError } from "@/lib/services/admin-service";

describe("admin investor routes", () => {
  beforeEach(() => {
    mocks.getAuthenticatedUserFromToken.mockReset();
    mocks.setInvestorActiveState.mockReset();
    mocks.deleteInvestor.mockReset();
    mocks.getAuthenticatedUserFromToken.mockResolvedValue({
      id: "admin-1",
      role: "admin",
      username: "admin",
      email: "admin@example.com",
      investorId: null,
      displayName: "Admin",
    });
  });

  it("accepts valid PATCH payloads for status changes", async () => {
    mocks.setInvestorActiveState.mockResolvedValue("investor-1");

    const response = await PATCH(
      new Request("http://localhost/api/admin/investor-account-mappings/investor-1", {
        method: "PATCH",
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=token`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: false }),
      }),
      { params: Promise.resolve({ investorId: "investor-1" }) },
    );

    expect(response.status).toBe(200);
    expect(mocks.setInvestorActiveState).toHaveBeenCalledWith("investor-1", false);
  });

  it("rejects invalid PATCH payloads before touching the service", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/admin/investor-account-mappings/investor-1", {
        method: "PATCH",
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=token`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ investorId: "investor-1" }) },
    );

    expect(response.status).toBe(400);
    expect(mocks.setInvestorActiveState).not.toHaveBeenCalled();
  });

  it("requires username confirmation for DELETE", async () => {
    const response = await DELETE(
      new Request("http://localhost/api/admin/investor-account-mappings/investor-1", {
        method: "DELETE",
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=token`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ usernameConfirmation: "" }),
      }),
      { params: Promise.resolve({ investorId: "investor-1" }) },
    );

    expect(response.status).toBe(400);
    expect(mocks.deleteInvestor).not.toHaveBeenCalled();
  });

  it("passes through inactive-only delete conflicts from the service", async () => {
    mocks.deleteInvestor.mockRejectedValue(
      new AdminInvestorError("Deactivate the investor before deleting.", {
        status: 409,
        code: "investor_active",
      }),
    );

    const response = await DELETE(
      new Request("http://localhost/api/admin/investor-account-mappings/investor-1", {
        method: "DELETE",
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=token`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ usernameConfirmation: "active-user" }),
      }),
      { params: Promise.resolve({ investorId: "investor-1" }) },
    );

    expect(response.status).toBe(409);
  });
});
