import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAuthenticatedUserFromToken } from "@/lib/auth/server";
import { listPublishRuns } from "@/lib/services/admin-service";

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
  if (!user || user.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ runs: await listPublishRuns() });
}
