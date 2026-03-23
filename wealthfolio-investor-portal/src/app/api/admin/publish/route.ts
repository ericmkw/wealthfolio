import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAuthenticatedUserFromToken } from "@/lib/auth/server";
import { runPublishPipeline } from "@/lib/publish/publish-service";
import { publishRequestSchema } from "@/lib/validation/publish";

export async function POST(request: Request) {
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

  const body = publishRequestSchema.safeParse(await request.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json({ message: body.error.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
  }

  try {
    const result = await runPublishPipeline(body.data);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Publish failed.",
      },
      { status: 500 },
    );
  }
}
