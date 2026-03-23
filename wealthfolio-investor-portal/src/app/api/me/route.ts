import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAuthenticatedUserFromToken } from "@/lib/auth/server";

export async function GET(request: Request) {
  const token = request.headers
    .get("cookie")
    ?.split(";")
    .map((pair) => pair.trim())
    .find((pair) => pair.startsWith(`${SESSION_COOKIE_NAME}=`))
    ?.split("=")[1];

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await getAuthenticatedUserFromToken(token);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ user });
}
