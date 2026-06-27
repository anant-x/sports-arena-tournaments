import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hasDatabase } from "../../../../lib/db";
import { getUserBySessionToken } from "../../../../lib/platformRepository";
import { SESSION_COOKIE } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const token = cookies().get(SESSION_COOKIE)?.value || "";
    const user = await getUserBySessionToken(token);

    return NextResponse.json({
      authenticated: Boolean(user),
      databaseConfigured: hasDatabase(),
      user
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false, error: error.message || "Could not read session." }, { status: 500 });
  }
}
