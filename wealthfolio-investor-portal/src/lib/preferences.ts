import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { appSettings, userPreferences } from "@/db/schema";
import { canonicalizeTimeZone, DEFAULT_TIMEZONE } from "@/lib/timezone";

export type AppLocale = "en" | "zh-HK" | "zh-CN";
export type AppTheme = "dark" | "light";
export type BaseCurrency = "USD" | "HKD";
export type AppTimezone = string;

export interface ResolvedPreferences {
  locale: AppLocale;
  theme: AppTheme;
  baseCurrency: BaseCurrency;
  timezone: AppTimezone;
}

const DEFAULT_PREFERENCES: ResolvedPreferences = {
  locale: "zh-HK",
  theme: "dark",
  baseCurrency: "USD",
  timezone: DEFAULT_TIMEZONE,
};

export async function getAppDefaults(): Promise<ResolvedPreferences> {
  const [settings] = await db.select().from(appSettings).where(eq(appSettings.id, 1)).limit(1);
  if (!settings) {
    return DEFAULT_PREFERENCES;
  }

  return {
    locale: settings.defaultLocale,
    theme: settings.defaultTheme,
    baseCurrency: settings.defaultBaseCurrency,
    timezone: canonicalizeTimeZone(settings.defaultTimezone) ?? DEFAULT_TIMEZONE,
  };
}

export async function getResolvedPreferences(userId?: string | null): Promise<ResolvedPreferences> {
  const defaults = await getAppDefaults();
  if (!userId) {
    return defaults;
  }

  const [preferences] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  return {
    locale: preferences?.locale ?? defaults.locale,
    theme: preferences?.theme ?? defaults.theme,
    baseCurrency: preferences?.baseCurrency ?? defaults.baseCurrency,
    timezone: canonicalizeTimeZone(preferences?.timezone) ?? defaults.timezone,
  };
}

export async function setUserPreferences(
  userId: string,
  input: Partial<ResolvedPreferences>,
) {
  await db
    .insert(userPreferences)
    .values({
      userId,
      locale: input.locale,
      theme: input.theme,
      baseCurrency: input.baseCurrency,
      timezone: canonicalizeTimeZone(input.timezone) ?? DEFAULT_TIMEZONE,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: {
        locale: input.locale,
        theme: input.theme,
        baseCurrency: input.baseCurrency,
        timezone: canonicalizeTimeZone(input.timezone) ?? DEFAULT_TIMEZONE,
        updatedAt: new Date(),
      },
    });
}
