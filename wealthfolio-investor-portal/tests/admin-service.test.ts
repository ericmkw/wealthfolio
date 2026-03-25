import { beforeEach, describe, expect, it, vi } from "vitest";

function createQueryResult<T>(result: T) {
  const chain = {
    from: vi.fn(() => chain),
    leftJoin: vi.fn(() => chain),
    where: vi.fn(() => chain),
    limit: vi.fn(() => Promise.resolve(result)),
    then: (resolve: (value: T) => unknown) => Promise.resolve(result).then(resolve),
  };

  return chain;
}

function createInsertChain() {
  const result = {
    onConflictDoUpdate: vi.fn(() => Promise.resolve(undefined)),
    then: (resolve: (value: undefined) => unknown) => Promise.resolve(undefined).then(resolve),
  };

  return {
    values: vi.fn(() => result),
    result,
  };
}

function createUpdateChain() {
  return {
    set: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve(undefined)),
    })),
  };
}

function createDeleteChain() {
  return {
    where: vi.fn(() => Promise.resolve(undefined)),
  };
}

const mocks = vi.hoisted(() => {
  const tx = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  const db = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(),
  };

  return {
    db,
    tx,
    hashPassword: vi.fn(),
    eq: vi.fn(() => "eq"),
    or: vi.fn(() => "or"),
    and: vi.fn(() => "and"),
    desc: vi.fn(() => "desc"),
  };
});

vi.mock("drizzle-orm", () => ({
  eq: mocks.eq,
  or: mocks.or,
  and: mocks.and,
  desc: mocks.desc,
}));

vi.mock("@/db/client", () => ({
  db: mocks.db,
}));

vi.mock("@/lib/auth/password", () => ({
  hashPassword: mocks.hashPassword,
}));

import {
  createInvestorMapping,
  deleteInvestor,
  setInvestorActiveState,
  updateInvestorMapping,
} from "@/lib/services/admin-service";

describe("admin investor service", () => {
  beforeEach(() => {
    mocks.db.select.mockReset();
    mocks.db.insert.mockReset();
    mocks.db.update.mockReset();
    mocks.db.delete.mockReset();
    mocks.db.transaction.mockReset();
    mocks.tx.select.mockReset();
    mocks.tx.insert.mockReset();
    mocks.tx.update.mockReset();
    mocks.tx.delete.mockReset();
    mocks.hashPassword.mockReset();
    mocks.hashPassword.mockResolvedValue("hashed-password");

    mocks.db.transaction.mockImplementation(async (callback) => callback(mocks.tx));
  });

  it("rejects duplicate create requests instead of silently updating another investor", async () => {
    mocks.tx.select.mockReturnValueOnce(
      createQueryResult([
        {
          id: "user-1",
          username: "khm",
          email: "khm@gmail.com",
        },
      ]),
    );

    await expect(
      createInvestorMapping({
        name: "KHM",
        username: "khm",
        email: "khm@gmail.com",
        password: "secret",
        distributionAccountId: "acct-1",
        fundAssetId: "fund-1",
      }),
    ).rejects.toThrow("Username already exists.");
  });

  it("updates an investor without rewriting the password when edit password is blank", async () => {
    mocks.tx.select
      .mockReturnValueOnce(
        createQueryResult([
          {
            investorId: "investor-1",
            investorName: "KHM",
            userId: "user-1",
            username: "khm",
            email: "khm@gmail.com",
            isActive: true,
          },
        ]),
      )
      .mockReturnValueOnce(createQueryResult([]));

    const firstUpdate = createUpdateChain();
    const secondUpdate = createUpdateChain();
    const mappingInsert = createInsertChain();

    mocks.tx.update.mockReturnValueOnce(firstUpdate).mockReturnValueOnce(secondUpdate);
    mocks.tx.insert.mockReturnValueOnce(mappingInsert);

    await expect(
      updateInvestorMapping({
        investorId: "investor-1",
        name: "KHM",
        username: "khm",
        email: "khm@gmail.com",
        password: undefined,
        distributionAccountId: "acct-1",
        fundAssetId: "fund-1",
      }),
    ).resolves.toBe("investor-1");

    expect(mocks.tx.insert).toHaveBeenCalledTimes(1);
    expect(mocks.hashPassword).not.toHaveBeenCalled();
  });

  it("deactivates investors and revokes their sessions immediately", async () => {
    mocks.db.select.mockReturnValueOnce(
      createQueryResult([
        {
          investorId: "investor-1",
          investorName: "KHM",
          userId: "user-1",
          username: "khm",
          email: "khm@gmail.com",
          isActive: true,
        },
      ]),
    );

    const updateChain = createUpdateChain();
    const deleteChain = createDeleteChain();
    mocks.db.update.mockReturnValueOnce(updateChain);
    mocks.db.delete.mockReturnValueOnce(deleteChain);

    await expect(setInvestorActiveState("investor-1", false)).resolves.toBe("investor-1");

    expect(mocks.db.update).toHaveBeenCalledTimes(1);
    expect(mocks.db.delete).toHaveBeenCalledTimes(1);
  });

  it("refuses hard delete when username confirmation does not match", async () => {
    mocks.db.select.mockReturnValueOnce(
      createQueryResult([
        {
          investorId: "investor-1",
          investorName: "KHM",
          userId: "user-1",
          username: "khm",
          email: "khm@gmail.com",
          isActive: false,
        },
      ]),
    );

    await expect(deleteInvestor("investor-1", "wrong-user")).rejects.toThrow(
      "Username confirmation does not match.",
    );

    expect(mocks.db.transaction).not.toHaveBeenCalled();
  });
});
