import "server-only";

export function assertAdmin(req: Request) {
  const expected = process.env.ADMIN_TOKEN?.trim();
  if (!expected) return false;

  const providedRaw =
    req.headers.get("x-admin-token") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  const provided = providedRaw?.trim();

  if (!provided || provided !== expected) {
    return false;
  }
  return true;
}
