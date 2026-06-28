import { NextResponse } from "next/server";
import { answerTournamentQuestion } from "../../../lib/chatbot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const payload = await request.json();
    const message = String(payload.message || "").trim();
    const profile = payload.profile && typeof payload.profile === "object" ? payload.profile : {};

    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const answer = await answerTournamentQuestion({ message, profile });

    return NextResponse.json(answer);
  } catch (error) {
    return NextResponse.json({ error: error.message || "Could not answer this question." }, { status: 500 });
  }
}
