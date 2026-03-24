import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, pool } from "@/db/client";
import { passwordCredentials, users } from "@/db/schema";
import { getSeedEnv } from "@/lib/env";
import { hashPassword } from "@/lib/auth/password";

async function main() {
  const env = getSeedEnv();
  const adminEmail = env.ADMIN_EMAIL || null;
  const [existing] = await db.select().from(users).where(eq(users.username, env.ADMIN_USERNAME)).limit(1);

  const passwordHash = await hashPassword(env.ADMIN_PASSWORD);

  if (existing) {
    await db
      .update(users)
      .set({
        username: env.ADMIN_USERNAME,
        email: adminEmail,
        role: "admin",
        displayName: "Portal Admin",
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id));

    await db
      .insert(passwordCredentials)
      .values({
        userId: existing.id,
        passwordHash,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: passwordCredentials.userId,
        set: {
          passwordHash,
          updatedAt: new Date(),
        },
      });

    return;
  }

  const adminUserId = randomUUID();

  await db.insert(users).values({
    id: adminUserId,
    username: env.ADMIN_USERNAME,
    email: adminEmail,
    role: "admin",
    displayName: "Portal Admin",
    isActive: true,
  });

  await db.insert(passwordCredentials).values({
    userId: adminUserId,
    passwordHash,
  });
}

main()
  .then(async () => {
    await pool.end();
  })
  .catch(async (error) => {
    console.error(error);
    await pool.end();
    process.exit(1);
  });
