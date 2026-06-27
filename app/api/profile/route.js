import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hasDatabase } from "../../../lib/db";
import { getUserBySessionToken, updateUserProfile, upsertUser } from "../../../lib/platformRepository";
import { SESSION_COOKIE } from "../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const token = cookies().get(SESSION_COOKIE)?.value || "";
    const user = await getUserBySessionToken(token);

    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      databaseConfigured: hasDatabase(),
      user
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Could not load profile." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const email = String(payload.email || "").trim().toLowerCase();
    const token = cookies().get(SESSION_COOKIE)?.value || "";
    const sessionUser = await getUserBySessionToken(token);

    if (!sessionUser && !email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const user = sessionUser
      ? await updateUserProfile(sessionUser.id, {
          name: String(payload.name || sessionUser.name).trim(),
          phone: String(payload.phone || "").trim(),
          city: String(payload.city || "").trim(),
          primarySport: String(payload.primarySport || "").trim()
        })
      : await upsertUser({
          name: String(payload.name || email.split("@")[0]).trim(),
          email,
          phone: String(payload.phone || "").trim(),
          city: String(payload.city || "").trim(),
          primarySport: String(payload.primarySport || "").trim()
        });

    return NextResponse.json({
      authenticated: Boolean(sessionUser),
      databaseConfigured: hasDatabase(),
      user
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Could not save profile." }, { status: 500 });
  }
}
