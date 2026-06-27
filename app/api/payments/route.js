import { NextResponse } from "next/server";
import { hasDatabase } from "../../../lib/db";
import { createPayment } from "../../../lib/platformRepository";
import { verifyRazorpaySignature } from "../../../lib/security";
import { getTournament } from "../../../lib/tournament";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const payload = await request.json();
    const tournament = getTournament(payload.tournamentSlug);

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found." }, { status: 404 });
    }

    let status = payload.status || "created";

    if (payload.providerOrderId && payload.providerPaymentId && payload.signature) {
      const verified = verifyRazorpaySignature({
        orderId: payload.providerOrderId,
        paymentId: payload.providerPaymentId,
        signature: payload.signature
      });

      if (!verified) {
        await createPayment({
          id: payload.id,
          registrationId: payload.registrationId,
          tournamentSlug: tournament.slug,
          amount: Number(payload.amount || tournament.advanceAmount * 100),
          currency: payload.currency || tournament.currency || "INR",
          providerOrderId: payload.providerOrderId,
          providerPaymentId: payload.providerPaymentId,
          status: "signature_failed",
          mode: "live",
          raw: payload
        });

        return NextResponse.json({ error: "Payment signature verification failed." }, { status: 400 });
      }

      status = "paid";
    }

    const payment = await createPayment({
      id: payload.id,
      registrationId: payload.registrationId,
      tournamentSlug: tournament.slug,
      amount: Number(payload.amount || tournament.advanceAmount * 100),
      currency: payload.currency || tournament.currency || "INR",
      provider: payload.provider || "razorpay",
      providerOrderId: payload.providerOrderId,
      providerPaymentId: payload.providerPaymentId,
      status,
      mode: payload.mode || "live",
      raw: payload.raw || payload
    });

    return NextResponse.json({
      databaseConfigured: hasDatabase(),
      payment
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Could not record payment." }, { status: 500 });
  }
}
