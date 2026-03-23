import { Buffer } from "node:buffer";
import axios from "axios";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import { z } from "zod";

const backupResponseSchema = z.object({
  filename: z.string().min(1),
  data_b64: z.string().min(1),
});

export interface WealthfolioSnapshot {
  filename: string;
  bytes: Buffer;
}

export async function fetchWealthfolioSnapshot(baseUrl: string, password: string) {
  const jar = new CookieJar();
  const client = wrapper(
    axios.create({
      baseURL: baseUrl,
      jar,
      withCredentials: true,
      timeout: 30_000,
    }),
  );

  await client.post("/api/v1/auth/login", { password });
  const response = await client.post("/api/v1/utilities/database/backup");
  const parsed = backupResponseSchema.parse(response.data);

  return {
    filename: parsed.filename,
    bytes: Buffer.from(parsed.data_b64, "base64"),
  } satisfies WealthfolioSnapshot;
}
