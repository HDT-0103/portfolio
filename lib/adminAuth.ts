import "server-only";

export function assertAdmin(req: Request) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return false;

  const provided =
    req.headers.get("x-admin-token") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!provided || provided !== expected) {
    return false;
  }
  return true;
}
