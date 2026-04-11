import "server-only";

type AdminAuthResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "missing_server_token"
        | "missing_request_token"
        | "token_mismatch";
    };

export function checkAdmin(req: Request): AdminAuthResult {
  const expected = process.env.ADMIN_TOKEN?.trim();
  if (!expected) return { ok: false, reason: "missing_server_token" };

  const providedRaw =
    req.headers.get("x-admin-token") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  const provided = providedRaw?.trim();
  if (!provided) return { ok: false, reason: "missing_request_token" };
  if (provided !== expected) return { ok: false, reason: "token_mismatch" };

  return { ok: true };
}

export function assertAdmin(req: Request) {
  return checkAdmin(req).ok;
}
