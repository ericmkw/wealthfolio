import { randomUUID } from "node:crypto";
import { and, desc, eq, or } from "drizzle-orm";
import { db } from "@/db/client";
import {
  investorAccountMappings,
  investors,
  passwordCredentials,
  publishRuns,
  publishedVersions,
  users,
} from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";

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
    })
    .from(investors)
    .leftJoin(users, eq(users.investorId, investors.id))
    .leftJoin(investorAccountMappings, eq(investorAccountMappings.investorId, investors.id))
    .orderBy(investors.name);

  return rows;
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

export interface InvestorMappingUpsertInput {
  investorId?: string;
  name: string;
  username: string;
  email?: string | null;
  password?: string;
  distributionAccountId: string;
  fundAssetId: string;
}

export async function upsertInvestorMapping(input: InvestorMappingUpsertInput) {
  return db.transaction(async (tx) => {
    const normalizedEmail = input.email?.trim() ? input.email.trim() : null;
    let investorId = input.investorId;
    const matchCondition = input.investorId
      ? eq(users.investorId, input.investorId)
      : and(
          eq(users.role, "investor"),
          normalizedEmail
            ? or(eq(users.username, input.username), eq(users.email, normalizedEmail))
            : eq(users.username, input.username),
        );

    const [matchedUser] = await tx
      .select()
      .from(users)
      .where(matchCondition)
      .limit(1);

    if (!investorId && matchedUser?.investorId) {
      investorId = matchedUser.investorId;
    }

    if (investorId) {
      await tx
        .update(investors)
        .set({
          name: input.name,
          updatedAt: new Date(),
        })
        .where(eq(investors.id, investorId));
    } else {
      investorId = randomUUID();
      await tx.insert(investors).values({
        id: investorId,
        name: input.name,
      });
    }

    const [existingUser] = await tx.select().from(users).where(eq(users.investorId, investorId)).limit(1);

    if (existingUser) {
      await tx
        .update(users)
        .set({
          username: input.username,
          email: normalizedEmail,
          displayName: input.name,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser.id));

      if (input.password) {
        await tx
          .insert(passwordCredentials)
          .values({
            userId: existingUser.id,
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
      const userId = randomUUID();
      const password = input.password ?? randomUUID();

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
        passwordHash: await hashPassword(password),
      });
    }

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
