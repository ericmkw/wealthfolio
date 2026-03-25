import { randomUUID } from "node:crypto";
import { desc, eq, or } from "drizzle-orm";
import { db } from "@/db/client";
import {
  investorAccountMappings,
  investors,
  passwordCredentials,
  publishRuns,
  publishedVersions,
  sessions,
  users,
} from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";

export class AdminInvestorError extends Error {
  status: number;
  code: string;

  constructor(message: string, options: { status: number; code: string }) {
    super(message);
    this.name = "AdminInvestorError";
    this.status = options.status;
    this.code = options.code;
  }
}

type SelectExecutor = Pick<typeof db, "select">;

export interface InvestorMappingRecord {
  investorId: string;
  investorName: string;
  username: string | null;
  email: string | null;
  displayName: string | null;
  distributionAccountId: string | null;
  fundAssetId: string | null;
  createdAt: Date;
  userId: string | null;
  isActive: boolean | null;
}

function normalizeEmail(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function getDuplicateUserCondition(username: string, email: string | null) {
  return email ? or(eq(users.username, username), eq(users.email, email)) : eq(users.username, username);
}

async function findConflictingUser(
  executor: SelectExecutor,
  args: { username: string; email: string | null; ignoreUserId?: string | null },
) {
  const rows = await executor
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
    })
    .from(users)
    .where(getDuplicateUserCondition(args.username, args.email));

  return rows.find((row) => row.id !== args.ignoreUserId) ?? null;
}

async function getInvestorIdentity(executor: SelectExecutor, investorId: string) {
  const [record] = await executor
    .select({
      investorId: investors.id,
      investorName: investors.name,
      userId: users.id,
      username: users.username,
      email: users.email,
      isActive: users.isActive,
    })
    .from(investors)
    .leftJoin(users, eq(users.investorId, investors.id))
    .where(eq(investors.id, investorId))
    .limit(1);

  return record ?? null;
}

export async function listPublishRuns(limit = 20) {
  return db.select().from(publishRuns).orderBy(desc(publishRuns.startedAt)).limit(limit);
}

export async function getCurrentPublishedVersion() {
  const [current] = await db
    .select()
    .from(publishedVersions)
    .where(eq(publishedVersions.isCurrent, true))
    .limit(1);

  return current ?? null;
}

export async function listInvestorMappings() {
  const rows = await db
    .select({
      investorId: investors.id,
      investorName: investors.name,
      username: users.username,
      email: users.email,
      displayName: users.displayName,
      distributionAccountId: investorAccountMappings.distributionAccountId,
      fundAssetId: investorAccountMappings.fundAssetId,
      createdAt: investors.createdAt,
      userId: users.id,
      isActive: users.isActive,
    })
    .from(investors)
    .leftJoin(users, eq(users.investorId, investors.id))
    .leftJoin(investorAccountMappings, eq(investorAccountMappings.investorId, investors.id))
    .orderBy(investors.name);

  return rows satisfies InvestorMappingRecord[];
}

export async function listInvestorMappingsForPublish() {
  return db
    .select({
      investorId: investors.id,
      investorName: investors.name,
      distributionAccountId: investorAccountMappings.distributionAccountId,
      fundAssetId: investorAccountMappings.fundAssetId,
    })
    .from(investorAccountMappings)
    .innerJoin(investors, eq(investors.id, investorAccountMappings.investorId));
}

export interface InvestorMappingCreateInput {
  name: string;
  username: string;
  email?: string | null;
  password: string;
  distributionAccountId: string;
  fundAssetId: string;
}

export interface InvestorMappingUpdateInput {
  investorId: string;
  name: string;
  username: string;
  email?: string | null;
  password?: string;
  distributionAccountId: string;
  fundAssetId: string;
}

export async function createInvestorMapping(input: InvestorMappingCreateInput) {
  return db.transaction(async (tx) => {
    const normalizedEmail = normalizeEmail(input.email);
    const conflictingUser = await findConflictingUser(tx, {
      username: input.username,
      email: normalizedEmail,
    });

    if (conflictingUser) {
      throw new AdminInvestorError(
        conflictingUser.username === input.username ? "Username already exists." : "Email already exists.",
        { status: 409, code: "duplicate_user" },
      );
    }

    const investorId = randomUUID();
    const userId = randomUUID();

    await tx.insert(investors).values({
      id: investorId,
      name: input.name,
    });

    await tx.insert(users).values({
      id: userId,
      username: input.username,
      email: normalizedEmail,
      role: "investor",
      investorId,
      displayName: input.name,
      isActive: true,
    });

    await tx.insert(passwordCredentials).values({
      userId,
      passwordHash: await hashPassword(input.password),
    });

    await tx
      .insert(investorAccountMappings)
      .values({
        investorId,
        distributionAccountId: input.distributionAccountId,
        fundAssetId: input.fundAssetId,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: investorAccountMappings.investorId,
        set: {
          distributionAccountId: input.distributionAccountId,
          fundAssetId: input.fundAssetId,
          updatedAt: new Date(),
        },
      });

    return investorId;
  });
}

export async function updateInvestorMapping(input: InvestorMappingUpdateInput) {
  return db.transaction(async (tx) => {
    const normalizedEmail = normalizeEmail(input.email);
    const existingIdentity = await getInvestorIdentity(tx, input.investorId);

    if (!existingIdentity) {
      throw new AdminInvestorError("Investor not found.", { status: 404, code: "investor_not_found" });
    }

    const conflictingUser = await findConflictingUser(tx, {
      username: input.username,
      email: normalizedEmail,
      ignoreUserId: existingIdentity.userId,
    });

    if (conflictingUser) {
      throw new AdminInvestorError(
        conflictingUser.username === input.username ? "Username already exists." : "Email already exists.",
        { status: 409, code: "duplicate_user" },
      );
    }

    await tx
      .update(investors)
      .set({
        name: input.name,
        updatedAt: new Date(),
      })
      .where(eq(investors.id, input.investorId));

    if (existingIdentity.userId) {
      await tx
        .update(users)
        .set({
          username: input.username,
          email: normalizedEmail,
          displayName: input.name,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingIdentity.userId));

      if (input.password) {
        await tx
          .insert(passwordCredentials)
          .values({
            userId: existingIdentity.userId,
            passwordHash: await hashPassword(input.password),
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: passwordCredentials.userId,
            set: {
              passwordHash: await hashPassword(input.password),
              updatedAt: new Date(),
            },
          });
      }
    } else {
      if (!input.password) {
        throw new AdminInvestorError("Password is required to recreate the missing login.", {
          status: 400,
          code: "missing_password",
        });
      }

      const userId = randomUUID();

      await tx.insert(users).values({
        id: userId,
        username: input.username,
        email: normalizedEmail,
        role: "investor",
        investorId: input.investorId,
        displayName: input.name,
        isActive: true,
      });

      await tx.insert(passwordCredentials).values({
        userId,
        passwordHash: await hashPassword(input.password),
      });
    }

    await tx
      .insert(investorAccountMappings)
      .values({
        investorId: input.investorId,
        distributionAccountId: input.distributionAccountId,
        fundAssetId: input.fundAssetId,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: investorAccountMappings.investorId,
        set: {
          distributionAccountId: input.distributionAccountId,
          fundAssetId: input.fundAssetId,
          updatedAt: new Date(),
        },
      });

    return input.investorId;
  });
}

export async function setInvestorActiveState(investorId: string, isActive: boolean) {
  const identity = await getInvestorIdentity(db, investorId);
  if (!identity || !identity.userId) {
    throw new AdminInvestorError("Investor login not found.", { status: 404, code: "investor_user_not_found" });
  }

  await db
    .update(users)
    .set({
      isActive,
      updatedAt: new Date(),
    })
    .where(eq(users.id, identity.userId));

  if (!isActive) {
    await db.delete(sessions).where(eq(sessions.userId, identity.userId));
  }

  return investorId;
}

export async function deleteInvestor(investorId: string, usernameConfirmation: string) {
  const identity = await getInvestorIdentity(db, investorId);

  if (!identity || !identity.userId || !identity.username) {
    throw new AdminInvestorError("Investor not found.", { status: 404, code: "investor_not_found" });
  }

  if (identity.isActive) {
    throw new AdminInvestorError("Deactivate the investor before deleting.", {
      status: 409,
      code: "investor_active",
    });
  }

  if (identity.username !== usernameConfirmation.trim()) {
    throw new AdminInvestorError("Username confirmation does not match.", {
      status: 400,
      code: "username_confirmation_mismatch",
    });
  }

  await db.transaction(async (tx) => {
    await tx.delete(sessions).where(eq(sessions.userId, identity.userId!));
    await tx.delete(passwordCredentials).where(eq(passwordCredentials.userId, identity.userId!));
    await tx.delete(users).where(eq(users.id, identity.userId!));
    await tx.delete(investors).where(eq(investors.id, investorId));
  });

  return investorId;
}
