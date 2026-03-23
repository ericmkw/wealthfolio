import { createHash, randomBytes } from "node:crypto";

export const SESSION_COOKIE_NAME = "wf_investor_portal_session";

export function shouldUseSecureCookie(request: Pick<Request, "headers" | "url">) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedProto) {
    return forwardedProto.split(",")[0]?.trim().toLowerCase() === "https";
  }

  return new URL(request.url).protocol === "https:";
}

export function createSessionToken() {
  return randomBytes(32).toString("hex");
}

export async function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
