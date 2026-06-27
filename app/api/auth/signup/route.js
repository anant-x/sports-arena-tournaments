import { NextResponse } from "next/server";
import { hasDatabase } from "../../../../lib/db";
import { createUserSession, upsertUser } from "../../../../lib/platformRepository";
import { sessionCookieOptions, SESSION_COOKIE } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const payload = await request.json();
    const email = String(payload.email || "").trim().toLowerCase();
    const password = String(payload.password || "");
    const name = String(payload.name || "").trim();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
    }

    const user = await upsertUser(
      {
        name,
        email,
        phone: String(payload.phone || "").trim(),
        city: String(payload.city || "").trim(),
        primarySport: String(payload.primarySport || "").trim(),
        password
      },
      { setPassword: true }
    );

    const response = NextResponse.json({
      databaseConfigured: hasDatabase(),
      user
    });

    const token = await createUserSession(user.id);
    if (token) {
      response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    }

    return response;
  } catch (error) {
    return NextResponse.json({ error: error.message || "Could not create account." }, { status: 500 });
  }
}
