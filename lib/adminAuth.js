import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminSessionValue, expectedAdminPassword } from "./adminSession";

export function requireAdmin(request) {
  const expected = expectedAdminPassword();
  const provided = request.headers.get("x-admin-password") || "";
  const session = request.cookies.get(ADMIN_COOKIE)?.value || "";

  if (provided !== expected && session !== adminSessionValue()) {
    return NextResponse.json({ error: "Incorrect admin password." }, { status: 401 });
  }

  return null;
}
