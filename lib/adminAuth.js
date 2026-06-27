import { NextResponse } from "next/server";

export function requireAdmin(request) {
  const expected = process.env.ADMIN_PASSWORD || "admin123";
  const provided = request.headers.get("x-admin-password") || "";

  if (provided !== expected) {
    return NextResponse.json({ error: "Incorrect admin password." }, { status: 401 });
  }

  return null;
}
