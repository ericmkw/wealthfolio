import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAuthenticatedUserFromToken } from "@/lib/auth/server";
import { listFundOperations } from "@/lib/services/activity-service";

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

  const activities = await listFundOperations();
  return NextResponse.json({ activities });
}
