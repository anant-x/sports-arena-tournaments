import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/adminAuth";
import { listScoreboard, updateMatchScore, updateStanding } from "../../../../lib/platformRepository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const { searchParams } = new URL(request.url);
    const scoreboard = await listScoreboard(searchParams.get("slug") || undefined);
    return NextResponse.json({ scoreboard });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Could not load scoreboard." }, { status: 500 });
  }
}

export async function POST(request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const payload = await request.json();

    if (payload.type === "standing") {
      const standing = await updateStanding(payload);
      return NextResponse.json({ standing });
    }

    const match = await updateMatchScore(payload);
    return NextResponse.json({ match });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Could not update scoreboard." }, { status: 500 });
  }
}
