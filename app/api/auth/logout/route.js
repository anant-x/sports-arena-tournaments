import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { deleteUserSession } from "../../../../lib/platformRepository";
import { clearSessionCookie, SESSION_COOKIE } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const token = cookies().get(SESSION_COOKIE)?.value || "";

  try {
    await deleteUserSession(token);
  } finally {
    const response = NextResponse.json({ ok: true });
    clearSessionCookie(response);
    return response;
  }
}
