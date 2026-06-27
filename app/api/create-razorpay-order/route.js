import { NextResponse } from "next/server";
import { hasDatabase } from "../../../lib/db";
import { createPayment } from "../../../lib/platformRepository";
import { getTournament } from "../../../lib/tournament";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const payload = await request.json();
  const tournament = getTournament(payload.tournamentSlug);

  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }

  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const amount = tournament.advanceAmount * 100;
  const currency = tournament.currency || "INR";

  if (!keyId || !keySecret) {
    const payment = await createPayment({
      registrationId: payload.registrationId,
      tournamentSlug: tournament.slug,
      amount,
      currency,
      status: "demo_created",
      mode: "demo",
      raw: {
        reason: "Razorpay keys are not configured.",
        payer: payload.payer || {}
      }
    });

    return NextResponse.json({
      demoMode: true,
      databaseConfigured: hasDatabase(),
      paymentId: payment.id,
      amount,
      currency,
      message: "Razorpay keys are not configured. Demo payment mode enabled."
    });
  }

  const receipt = `tth_${Date.now()}`.slice(0, 40);
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      amount,
      currency,
      receipt,
      notes: {
        tournamentSlug: tournament.slug,
        tournamentName: tournament.name,
        registrationId: payload.registrationId || "direct-payment",
        payerName: payload.payer?.name || "",
        payerEmail: payload.payer?.email || "",
        payerPhone: payload.payer?.phone || ""
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    return NextResponse.json({ error: "Could not create Razorpay order", details: error }, { status: 502 });
  }

  const order = await response.json();
  const payment = await createPayment({
    registrationId: payload.registrationId,
    tournamentSlug: tournament.slug,
    amount: order.amount,
    currency: order.currency,
    providerOrderId: order.id,
    status: "created",
    mode: "live",
    raw: order
  });

  return NextResponse.json({
    orderId: order.id,
    paymentId: payment.id,
    databaseConfigured: hasDatabase(),
    keyId,
    amount: order.amount,
    currency: order.currency,
    receipt: order.receipt
  });
}
