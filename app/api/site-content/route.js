import { NextResponse } from "next/server";
import { getSiteContent } from "../../../lib/platformRepository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const content = await getSiteContent();
    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Could not load site content." }, { status: 500 });
  }
}
