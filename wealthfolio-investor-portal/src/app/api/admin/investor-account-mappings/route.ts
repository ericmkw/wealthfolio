import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAuthenticatedUserFromToken } from "@/lib/auth/server";
import { resolveMappingLabels } from "@/lib/source-option-labels";
import { upsertInvestorMapping } from "@/lib/services/admin-service";
import { getAdminSourceOptions } from "@/lib/services/source-options-service";
import { investorMappingSchema } from "@/lib/validation/admin";

export async function PUT(request: Request) {
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

  const payload = investorMappingSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json(
      { message: payload.error.issues[0]?.message ?? "Invalid investor mapping payload." },
      { status: 400 },
    );
  }

  try {
    const sourceOptions = await getAdminSourceOptions();
    const labels = resolveMappingLabels(sourceOptions.accounts, sourceOptions.fundAssets, payload.data);

    if (!labels.distributionAccountLabel) {
      return NextResponse.json({ message: "Selected Distribution account is not available." }, { status: 400 });
    }

    if (!labels.fundAssetLabel) {
      return NextResponse.json({ message: "Selected fund asset is not available." }, { status: 400 });
    }

    const investorId = await upsertInvestorMapping(payload.data);
    return NextResponse.json({
      investorId,
      distributionAccountId: payload.data.distributionAccountId,
      distributionAccountLabel: labels.distributionAccountLabel,
      fundAssetId: payload.data.fundAssetId,
      fundAssetLabel: labels.fundAssetLabel,
    });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "cause" in error &&
      error.cause &&
      typeof error.cause === "object" &&
      "code" in error.cause &&
      error.cause.code === "23505"
    ) {
      return NextResponse.json({ message: "Email already exists." }, { status: 409 });
    }

    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Unable to save investor mapping.",
      },
      { status: 500 },
    );
  }
}
