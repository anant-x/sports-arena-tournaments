import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/adminAuth";
import { dashboardSummary } from "../../../../lib/platformRepository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const summary = await dashboardSummary();
    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json({ error: error.message || "Could not load admin data." }, { status: 500 });
  }
}
