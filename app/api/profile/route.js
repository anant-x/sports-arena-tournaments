import { NextResponse } from "next/server";
import { hasDatabase } from "../../../lib/db";
import { upsertUser } from "../../../lib/platformRepository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const payload = await request.json();
    const email = String(payload.email || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const user = await upsertUser({
      name: String(payload.name || email.split("@")[0]).trim(),
      email,
      phone: String(payload.phone || "").trim(),
      city: String(payload.city || "").trim(),
      primarySport: String(payload.primarySport || "").trim()
    });

    return NextResponse.json({
      databaseConfigured: hasDatabase(),
      user
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Could not save profile." }, { status: 500 });
  }
}
