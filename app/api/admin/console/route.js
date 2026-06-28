import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/adminAuth";
import { adminConsoleData, adminMutate } from "../../../../lib/platformRepository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const data = await adminConsoleData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message || "Could not load admin console." }, { status: 500 });
  }
}

export async function POST(request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const payload = await request.json();
    const result = await adminMutate(payload.action, payload.payload || {});
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message || "Could not save admin change." }, { status: 500 });
  }
}
