import { NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAuthenticatedUserFromToken } from "@/lib/auth/server";
import { getResolvedPreferences, setUserPreferences } from "@/lib/preferences";
import { canonicalizeTimeZone } from "@/lib/timezone";

const preferencesSchema = z.object({
  locale: z.enum(["en", "zh-HK", "zh-CN"]),
  theme: z.enum(["dark", "light"]),
  baseCurrency: z.enum(["USD", "HKD"]),
  timezone: z
    .string()
    .trim()
    .min(1)
    .transform((value, ctx) => {
      const canonicalized = canonicalizeTimeZone(value);
      if (!canonicalized) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid timezone.",
        });
        return z.NEVER;
      }

      return canonicalized;
    }),
});

async function authenticate(request: Request) {
  const token = request.headers
    .get("cookie")
    ?.split(";")
    .map((pair) => pair.trim())
    .find((pair) => pair.startsWith(`${SESSION_COOKIE_NAME}=`))
    ?.split("=")[1];

  if (!token) {
    return null;
  }

  return getAuthenticatedUserFromToken(token);
}

export async function GET(request: Request) {
  const user = await authenticate(request);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ preferences: await getResolvedPreferences(user.id) });
}

export async function PUT(request: Request) {
  const user = await authenticate(request);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const payload = preferencesSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json({ message: payload.error.issues[0]?.message ?? "Invalid preferences payload." }, { status: 400 });
  }

  await setUserPreferences(user.id, payload.data);
  return NextResponse.json({ preferences: await getResolvedPreferences(user.id) });
}
