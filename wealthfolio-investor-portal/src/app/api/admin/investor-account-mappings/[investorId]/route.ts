import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAuthenticatedUserFromToken } from "@/lib/auth/server";
import { AdminInvestorError, deleteInvestor, setInvestorActiveState } from "@/lib/services/admin-service";
import { deleteInvestorSchema, toggleInvestorStatusSchema } from "@/lib/validation/admin";

interface RouteContext {
  params: Promise<{
    investorId: string;
  }>;
}

async function authenticateAdmin(request: Request) {
  const token = request.headers
    .get("cookie")
    ?.split(";")
    .map((pair) => pair.trim())
    .find((pair) => pair.startsWith(`${SESSION_COOKIE_NAME}=`))
    ?.split("=")[1];

  if (!token) {
    return { status: 401 as const };
  }

  const user = await getAuthenticatedUserFromToken(token);
  if (!user || user.role !== "admin") {
    return { status: 403 as const };
  }

  return { status: 200 as const, user };
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await authenticateAdmin(request);
  if (auth.status !== 200) {
    return NextResponse.json(
      { message: auth.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: auth.status },
    );
  }

  const payload = toggleInvestorStatusSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json(
      { message: payload.error.issues[0]?.message ?? "Invalid investor status payload." },
      { status: 400 },
    );
  }

  try {
    const { investorId } = await context.params;
    await setInvestorActiveState(investorId, payload.data.isActive);
    return NextResponse.json({ investorId, isActive: payload.data.isActive });
  } catch (error) {
    if (error instanceof AdminInvestorError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update investor status." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await authenticateAdmin(request);
  if (auth.status !== 200) {
    return NextResponse.json(
      { message: auth.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: auth.status },
    );
  }

  const payload = deleteInvestorSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json(
      { message: payload.error.issues[0]?.message ?? "Invalid investor delete payload." },
      { status: 400 },
    );
  }

  try {
    const { investorId } = await context.params;
    await deleteInvestor(investorId, payload.data.usernameConfirmation);
    return NextResponse.json({ investorId });
  } catch (error) {
    if (error instanceof AdminInvestorError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to delete investor." },
      { status: 500 },
    );
  }
}
