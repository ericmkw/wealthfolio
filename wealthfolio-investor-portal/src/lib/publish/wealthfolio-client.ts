import { Buffer } from "node:buffer";
import axios from "axios";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import { z } from "zod";

const backupResponseSchema = z
  .object({
    filename: z.string().min(1),
    data_b64: z.string().min(1).optional(),
    dataB64: z.string().min(1).optional(),
  })
  .transform((value) => ({
    filename: value.filename,
    dataB64: value.dataB64 ?? value.data_b64 ?? "",
  }));

export interface WealthfolioSnapshot {
  filename: string;
  bytes: Buffer;
}

function buildCannotReachMessage(baseUrl: string) {
  return `Cannot reach Wealthfolio at ${baseUrl}.`;
}

function normalizeWealthfolioError(error: unknown, baseUrl: string, phase: "login" | "backup", hasPassword: boolean) {
  if (axios.isAxiosError(error)) {
    if (error.code === "ECONNABORTED" || error.code === "ERR_NETWORK" || error.code === "ECONNREFUSED") {
      return new Error(buildCannotReachMessage(baseUrl));
    }

    const status = error.response?.status;

    if (phase === "login" && (status === 401 || status === 403)) {
      return new Error(`Wealthfolio login failed for ${baseUrl}. Check the password.`);
    }

    if (phase === "backup" && (status === 401 || status === 403)) {
      if (!hasPassword) {
        return new Error(
          `Wealthfolio backup route at ${baseUrl} requires authentication. Set the password in portal env.`,
        );
      }

      return new Error(`Wealthfolio backup route denied access at ${baseUrl}.`);
    }
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error(
    phase === "login"
      ? `Wealthfolio login failed for ${baseUrl}.`
      : `Wealthfolio backup request failed for ${baseUrl}.`,
  );
}

function isAuthNotConfiguredLoginError(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  if (error.response?.status !== 404) {
    return false;
  }

  const responseData = error.response.data;
  const message =
    typeof responseData === "object" && responseData && "message" in responseData ? String(responseData.message) : "";

  return message.includes("Authentication is not configured");
}

export async function fetchWealthfolioSnapshot(baseUrl: string, password?: string) {
  const jar = new CookieJar();
  const client = wrapper(
    axios.create({
      baseURL: baseUrl,
      jar,
      withCredentials: true,
      timeout: 30_000,
    }),
  );

  const normalizedPassword = password?.trim();

  if (normalizedPassword) {
    try {
      await client.post("/api/v1/auth/login", { password: normalizedPassword });
    } catch (error) {
      if (!isAuthNotConfiguredLoginError(error)) {
        throw normalizeWealthfolioError(error, baseUrl, "login", true);
      }
    }
  }

  let response;

  try {
    response = await client.post("/api/v1/utilities/database/backup");
  } catch (error) {
    throw normalizeWealthfolioError(error, baseUrl, "backup", Boolean(normalizedPassword));
  }

  const parsed = backupResponseSchema.parse(response.data);

  return {
    filename: parsed.filename,
    bytes: Buffer.from(parsed.dataB64, "base64"),
  } satisfies WealthfolioSnapshot;
}
