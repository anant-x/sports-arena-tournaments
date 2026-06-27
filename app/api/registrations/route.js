import { NextResponse } from "next/server";
import { hasDatabase } from "../../../lib/db";
import { createRegistration, listRegistrations, upsertUser } from "../../../lib/platformRepository";
import { getTournament } from "../../../lib/tournament";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email") || "";
    const registrations = await listRegistrations({ email });

    return NextResponse.json({
      databaseConfigured: hasDatabase(),
      registrations
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Could not load registrations." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const tournament = getTournament(payload.tournamentSlug);

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found." }, { status: 404 });
    }

    const registration = await createRegistration({
      id: payload.id,
      tournamentSlug: tournament.slug,
      tournamentName: tournament.name,
      sport: tournament.sport,
      playerName: String(payload.playerName || "").trim(),
      email: String(payload.email || "").trim(),
      phone: String(payload.phone || "").trim(),
      city: String(payload.city || "").trim(),
      category: String(payload.category || "").trim(),
      teamName: String(payload.teamName || "").trim(),
      players: Array.isArray(payload.players) ? payload.players : [],
      age: String(payload.age || "").trim(),
      gender: String(payload.gender || "").trim(),
      emergencyContact: String(payload.emergencyContact || "").trim(),
      preferredPayment: String(payload.preferredPayment || "").trim(),
      termsAccepted: Boolean(payload.termsAccepted),
      extras: payload.extras || {},
      notes: String(payload.notes || "").trim(),
      fee: tournament.registrationFee,
      advanceAmount: tournament.advanceAmount,
      currency: tournament.currency,
      status: payload.status || "Advance pending"
    });

    await upsertUser({
      name: registration.playerName,
      email: registration.email,
      phone: registration.phone,
      city: registration.city,
      primarySport: tournament.sport
    });

    return NextResponse.json({
      databaseConfigured: hasDatabase(),
      registration
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Could not save registration." }, { status: 500 });
  }
}
