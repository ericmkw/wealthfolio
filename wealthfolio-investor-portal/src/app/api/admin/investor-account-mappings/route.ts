import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAuthenticatedUserFromToken } from "@/lib/auth/server";
import {
  AdminInvestorError,
  createInvestorMapping,
  updateInvestorMapping,
} from "@/lib/services/admin-service";
import { getAdminSourceOptions } from "@/lib/services/source-options-service";
import { createInvestorSchema, updateInvestorSchema } from "@/lib/validation/admin";

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

export async function PUT(request: Request) {
  const auth = await authenticateAdmin(request);
  if (auth.status !== 200) {
    return NextResponse.json(
      { message: auth.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: auth.status },
    );
  }

  const rawPayload = await request.json().catch(() => null);
  const isUpdatePayload =
    !!rawPayload &&
    typeof rawPayload === "object" &&
    "investorId" in rawPayload &&
    typeof rawPayload.investorId === "string" &&
    rawPayload.investorId.length > 0;
  if (isUpdatePayload) {
    const payload = updateInvestorSchema.safeParse(rawPayload);

    if (!payload.success) {
      return NextResponse.json(
        { message: payload.error.issues[0]?.message ?? "Invalid investor mapping payload." },
        { status: 400 },
      );
    }

    try {
      const sourceOptions = await getAdminSourceOptions();
      const hasDistributionAccount = sourceOptions.accounts.some(
        (account) => account.id === payload.data.distributionAccountId,
      );
      const hasFundAsset = sourceOptions.fundAssets.some((asset) => asset.id === payload.data.fundAssetId);

      if (!hasDistributionAccount) {
        return NextResponse.json({ message: "Selected Distribution account is not available." }, { status: 400 });
      }

      if (!hasFundAsset) {
        return NextResponse.json({ message: "Selected fund asset is not available." }, { status: 400 });
      }

      const investorId = await updateInvestorMapping(payload.data);

      return NextResponse.json({
        investorId,
      });
    } catch (error) {
      if (error instanceof AdminInvestorError) {
        return NextResponse.json({ message: error.message }, { status: error.status });
      }

      return NextResponse.json(
        {
          message: error instanceof Error ? error.message : "Unable to save investor mapping.",
        },
        { status: 500 },
      );
    }
  }

  const payload = createInvestorSchema.safeParse(rawPayload);

  if (!payload.success) {
    return NextResponse.json(
      { message: payload.error.issues[0]?.message ?? "Invalid investor mapping payload." },
      { status: 400 },
    );
  }

  try {
    const sourceOptions = await getAdminSourceOptions();
    const hasDistributionAccount = sourceOptions.accounts.some(
      (account) => account.id === payload.data.distributionAccountId,
    );
    const hasFundAsset = sourceOptions.fundAssets.some((asset) => asset.id === payload.data.fundAssetId);

    if (!hasDistributionAccount) {
      return NextResponse.json({ message: "Selected Distribution account is not available." }, { status: 400 });
    }

    if (!hasFundAsset) {
      return NextResponse.json({ message: "Selected fund asset is not available." }, { status: 400 });
    }

    const investorId = await createInvestorMapping(payload.data);

    return NextResponse.json({
      investorId,
    });
  } catch (error) {
    if (error instanceof AdminInvestorError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Unable to save investor mapping.",
      },
      { status: 500 },
    );
  }
}
