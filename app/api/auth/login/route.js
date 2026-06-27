import { NextResponse } from "next/server";
import { authenticateUser, createUserSession } from "../../../../lib/platformRepository";
import { sessionCookieOptions, SESSION_COOKIE } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const payload = await request.json();
    const email = String(payload.email || "").trim().toLowerCase();
    const password = String(payload.password || "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const result = await authenticateUser(email, password);

    if (!result.databaseConfigured) {
      return NextResponse.json({
        databaseConfigured: false,
        error: "Database is not configured yet."
      });
    }

    if (!result.user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const response = NextResponse.json({
      databaseConfigured: true,
      user: result.user
    });

    const token = await createUserSession(result.user.id);
    if (token) {
      response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    }

    return response;
  } catch (error) {
    return NextResponse.json({ error: error.message || "Could not login." }, { status: 500 });
  }
}
