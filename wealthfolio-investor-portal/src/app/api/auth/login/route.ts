import { NextResponse } from "next/server";
import { authenticateUser, createSessionForUser } from "@/lib/auth/server";
import { SESSION_COOKIE_NAME, shouldUseSecureCookie } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  const payload = loginSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json({ message: "Invalid login payload." }, { status: 400 });
  }

  const user = await authenticateUser(payload.data.identifier, payload.data.password);
  if (!user) {
    return NextResponse.json({ message: "Invalid username or password." }, { status: 401 });
  }

  const { token, expiresAt } = await createSessionForUser(user.id);
  const response = NextResponse.json({ user });

  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(request),
    path: "/",
    expires: expiresAt,
  });

  return response;
}
