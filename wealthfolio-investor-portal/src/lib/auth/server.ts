import { randomUUID } from "node:crypto";
import { and, eq, gt, or } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { passwordCredentials, sessions, users } from "@/db/schema";
import { SESSION_COOKIE_NAME, createSessionToken, hashSessionToken } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;

export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string | null;
  role: "admin" | "investor";
  investorId: string | null;
  displayName: string;
}

function getSessionCookieExpiresAt() {
  return new Date(Date.now() + SESSION_DURATION_MS);
}

function buildSessionCookieOptions(expiresAt: Date) {
  return {
    name: SESSION_COOKIE_NAME,
    value: "",
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: expiresAt,
    },
  };
}

export async function authenticateUser(identifier: string, password: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(or(eq(users.username, identifier), eq(users.email, identifier)))
    .limit(1);

  if (!user || !user.isActive) {
    return null;
  }

  const [credential] = await db
    .select()
    .from(passwordCredentials)
    .where(eq(passwordCredentials.userId, user.id))
    .limit(1);

  if (!credential) {
    return null;
  }

  const isValid = await verifyPassword(credential.passwordHash, password);
  if (!isValid) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    investorId: user.investorId,
    displayName: user.displayName,
  } satisfies AuthenticatedUser;
}

export async function createSessionForUser(userId: string) {
  const token = createSessionToken();
  const tokenHash = await hashSessionToken(token);
  const expiresAt = getSessionCookieExpiresAt();

  await db.insert(sessions).values({
    id: randomUUID(),
    userId,
    tokenHash,
    expiresAt,
    lastSeenAt: new Date(),
  });

  return { token, expiresAt };
}

export async function persistSessionCookie(token: string, expiresAt: Date) {
  const store = await cookies();
  const cookie = buildSessionCookieOptions(expiresAt);
  store.set(cookie.name, token, cookie.options);
}

export async function clearSessionCookie() {
  const store = await cookies();
  const cookie = buildSessionCookieOptions(new Date(0));
  store.set(cookie.name, "", cookie.options);
}

export async function revokeSessionToken(token: string) {
  const tokenHash = await hashSessionToken(token);
  await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
}

export async function getAuthenticatedUserFromToken(token: string) {
  const tokenHash = await hashSessionToken(token);
  const record = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      investorId: users.investorId,
      displayName: users.displayName,
      sessionId: sessions.id,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, new Date())))
    .limit(1);

  const user = record[0];
  if (!user) {
    return null;
  }

  await db
    .update(sessions)
    .set({ lastSeenAt: new Date() })
    .where(eq(sessions.id, user.sessionId));

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    investorId: user.investorId,
    displayName: user.displayName,
  } satisfies AuthenticatedUser;
}

export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return getAuthenticatedUserFromToken(token);
}

export async function requireUser(role?: AuthenticatedUser["role"]) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (role && user.role !== role) {
    redirect(user.role === "admin" ? "/admin/publish" : "/overview");
  }

  return user;
}
