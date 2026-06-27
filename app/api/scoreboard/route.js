import { NextResponse } from "next/server";
import { listScoreboard } from "../../../lib/platformRepository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug") || "";
    const scoreboard = await listScoreboard(slug || undefined);

    return NextResponse.json({ scoreboard });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Could not load scoreboard." }, { status: 500 });
  }
}
