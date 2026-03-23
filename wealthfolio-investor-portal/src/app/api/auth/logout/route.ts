import { NextResponse } from "next/server";
import { revokeSessionToken } from "@/lib/auth/server";
import { SESSION_COOKIE_NAME, shouldUseSecureCookie } from "@/lib/auth/session";

export async function POST(request: Request) {
  const token = request.headers
    .get("cookie")
    ?.split(";")
    .map((pair) => pair.trim())
    .find((pair) => pair.startsWith(`${SESSION_COOKIE_NAME}=`))
    ?.split("=")[1];

  if (token) {
    await revokeSessionToken(token);
  }

  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(request),
    path: "/",
    expires: new Date(0),
  });

  return response;
}
