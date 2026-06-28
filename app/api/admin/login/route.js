import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminCookieOptions, adminSessionValue, expectedAdminPassword } from "../../../../lib/adminSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const payload = await request.json();
  const password = String(payload.password || "");

  if (password !== expectedAdminPassword()) {
    return NextResponse.json({ error: "Incorrect admin password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, adminSessionValue(), adminCookieOptions());
  return response;
}
