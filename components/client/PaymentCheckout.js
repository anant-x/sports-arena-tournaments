"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatCurrency, isRegistrationOpen, platform } from "../../lib/tournament";
import { readRegistrations, readUser, updateRegistration } from "./localStore";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PaymentCheckout({ tournaments, paymentConfig, contact }) {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug") || tournaments[0]?.slug;
  const registrationId = searchParams.get("registration");
  const tournament = useMemo(() => tournaments.find((item) => item.slug === slug) ?? tournaments[0], [slug, tournaments]);
  const canRegister = isRegistrationOpen(tournament);
  const [user, setUser] = useState(null);
  const [registration, setRegistration] = useState(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState("razorpay");

  useEffect(() => {
    setUser(readUser());
    const registrations = readRegistrations();
    const selected = registrations.find((item) => item.id === registrationId && item.tournamentSlug === tournament.slug);
    setRegistration(selected ?? null);
  }, [registrationId, tournament.slug]);

  async function startPayment() {
    if (!canRegister) {
      setStatus("Registration is closed for this tournament. Payment is disabled for new entries.");
      return;
    }

    setBusy(true);
    setStatus("Preparing secure payment...");

    try {
      const response = await fetch("/api/create-razorpay-order/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournamentSlug: tournament.slug,
          registrationId,
          payer: {
            name: registration?.playerName || user?.name,
            email: registration?.email || user?.email,
            phone: registration?.phone || user?.phone
          }
        })
      });
      const order = await response.json();
      if (!response.ok) {
        setStatus(order.error || "Could not create payment order.");
        setBusy(false);
        return;
      }

      if (order.demoMode) {
        const paymentId = `demo_pay_${Date.now()}`;
        await fetch("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: order.paymentId,
            tournamentSlug: tournament.slug,
            registrationId,
            amount: order.amount,
            currency: order.currency,
            providerPaymentId: paymentId,
            status: "demo_paid",
            mode: "demo"
          })
        });
        if (registrationId) {
          updateRegistration(registrationId, {
            status: "Advance paid",
            paymentId,
            paidAmount: tournament.advanceAmount,
            paidAt: new Date().toISOString()
          });
        }
        setStatus(
          order.databaseConfigured
            ? "Demo payment recorded in the database. Add Razorpay keys in Vercel to collect real payments."
            : "Demo payment marked as paid locally. Connect the database to record this centrally."
        );
        setBusy(false);
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setStatus("Could not load Razorpay Checkout. Please try again.");
        setBusy(false);
        return;
      }

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: platform.name,
        description: `${tournament.name} advance registration`,
        order_id: order.orderId,
        prefill: {
          name: registration?.playerName || user?.name || "",
          email: registration?.email || user?.email || "",
          contact: registration?.phone || user?.phone || ""
        },
        notes: {
          tournament: tournament.slug,
          registration: registrationId || "direct-payment"
        },
        async handler(paymentResponse) {
          const confirm = await fetch("/api/payments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: order.paymentId,
              tournamentSlug: tournament.slug,
              registrationId,
              amount: order.amount,
              currency: order.currency,
              providerOrderId: paymentResponse.razorpay_order_id,
              providerPaymentId: paymentResponse.razorpay_payment_id,
              signature: paymentResponse.razorpay_signature,
              status: "paid",
              mode: "live",
              raw: paymentResponse
            })
          });
          const confirmation = await confirm.json();

          if (!confirm.ok) {
            setStatus(confirmation.error || "Payment completed but could not be verified. Please contact the organizer.");
            setBusy(false);
            return;
          }

          if (registrationId) {
            updateRegistration(registrationId, {
              status: "Advance paid",
              paymentId: paymentResponse.razorpay_payment_id,
              orderId: paymentResponse.razorpay_order_id,
              paidAmount: tournament.advanceAmount,
              paidAt: new Date().toISOString()
            });
          }
          setStatus(
            confirmation.databaseConfigured
              ? `Payment successful and saved in the database. Payment ID: ${paymentResponse.razorpay_payment_id}`
              : `Payment successful. Payment ID: ${paymentResponse.razorpay_payment_id}`
          );
          setBusy(false);
        },
        modal: {
          ondismiss() {
            setStatus("Payment window closed.");
            setBusy(false);
          }
        }
      };

      const checkout = new window.Razorpay(options);
      checkout.open();
    } catch (error) {
      setStatus("Payment setup failed. Please try again.");
      setBusy(false);
    }
  }

  const upiAmount = tournament.advanceAmount;
  const upiUrl = paymentConfig?.upiId
    ? `upi://pay?pa=${encodeURIComponent(paymentConfig.upiId)}&pn=${encodeURIComponent(paymentConfig.payeeName || platform.name)}&am=${encodeURIComponent(upiAmount)}&cu=${encodeURIComponent(tournament.currency || "INR")}&tn=${encodeURIComponent(`${tournament.name} advance ${registrationId || ""}`)}`
    : "";
  const whatsapp = contact?.whatsappUrl
    ? `${contact.whatsappUrl}?text=${encodeURIComponent(`Hi, I have paid the advance for ${tournament.name}. Registration ID: ${registrationId || "direct"}. Please verify.`)}`
    : "";

  async function copyUpi() {
    if (!paymentConfig?.upiId) return;
    await navigator.clipboard.writeText(paymentConfig.upiId);
    setStatus("UPI ID copied. Complete payment in your UPI app and mark it for verification.");
  }

  async function markUpiPaid() {
    setBusy(true);
    setStatus("Saving UPI verification request...");

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournamentSlug: tournament.slug,
          registrationId,
          amount: tournament.advanceAmount * 100,
          currency: tournament.currency,
          provider: "upi",
          status: "upi_pending_verification",
          mode: "upi",
          raw: {
            upiId: paymentConfig?.upiId || "",
            payer: registration?.email || user?.email || ""
          }
        })
      });
      const data = await response.json();

      if (registrationId) {
        updateRegistration(registrationId, {
          status: "UPI verification pending",
          paymentId: data.payment?.id,
          paidAmount: tournament.advanceAmount,
          paidAt: new Date().toISOString()
        });
      }

      setStatus(
        data.databaseConfigured
          ? "UPI payment request saved. The organizer can verify it from the admin dashboard."
          : "UPI payment marked locally. Connect the database so the organizer can verify centrally."
      );
    } catch {
      setStatus("Could not save UPI verification request. Please WhatsApp the organizer with your payment screenshot.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
      <aside className="motion-card rounded-lg border border-graphite/10 bg-white p-6 shadow-sm">
        <p className="text-sm font-black uppercase text-turf">{tournament.sport}</p>
        <h2 className="mt-2 text-3xl font-black text-pitch">{tournament.name}</h2>
        <dl className="mt-6 grid gap-4 text-sm">
          <div className="rounded-md bg-floodlight px-4 py-3">
            <dt className="font-black uppercase text-graphite/45">Advance Due</dt>
            <dd className="mt-1 text-2xl font-black text-pitch">{formatCurrency(tournament.advanceAmount, tournament.currency)}</dd>
          </div>
          <div className="rounded-md bg-floodlight px-4 py-3">
            <dt className="font-black uppercase text-graphite/45">Full Fee</dt>
            <dd className="mt-1 font-black text-pitch">{formatCurrency(tournament.registrationFee, tournament.currency)}</dd>
          </div>
          <div className="rounded-md bg-floodlight px-4 py-3">
            <dt className="font-black uppercase text-graphite/45">Balance After Advance</dt>
            <dd className="mt-1 font-black text-pitch">{formatCurrency(tournament.registrationFee - tournament.advanceAmount, tournament.currency)}</dd>
          </div>
        </dl>
      </aside>

      <section className="motion-card rounded-lg border border-graphite/10 bg-white p-6 shadow-sm">
        <p className="text-sm font-black uppercase text-turf">Secure Checkout</p>
        <h1 className="mt-2 text-4xl font-black text-pitch">Pay advance amount</h1>
        <p className="mt-4 text-sm leading-6 text-graphite/68">
          Choose Razorpay for card/netbanking/UPI through Checkout, or pay directly with UPI and submit it for organizer verification.
        </p>

        {canRegister ? (
          <div className="mt-6 grid grid-cols-2 gap-2 rounded-lg bg-floodlight p-1">
          {[
            ["razorpay", "Razorpay"],
            ["upi", "UPI"]
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setMethod(id)}
                className={`rounded-md px-4 py-3 text-sm font-black transition ${method === id ? "bg-pitch text-white" : "text-pitch"}`}
            >
              {label}
            </button>
          ))}
          </div>
        ) : (
          <p className="mt-6 rounded-lg bg-floodlight px-4 py-3 text-sm font-black text-pitch">
            Registration is closed for this tournament. Payment is disabled for new entries.
          </p>
        )}

        <div className="mt-6 rounded-lg bg-floodlight p-5">
          <p className="text-xs font-black uppercase text-graphite/45">Registration</p>
          <p className="mt-1 font-black text-pitch">{registration?.teamName || registration?.playerName || "Direct tournament advance"}</p>
          <p className="mt-2 text-sm font-semibold text-graphite/62">{registration?.email || user?.email || "No saved profile email"}</p>
        </div>

        {canRegister && method === "razorpay" ? (
          <button
            onClick={startPayment}
            disabled={busy}
            className="shine-button mt-6 w-full rounded-md bg-pitch px-5 py-3 text-sm font-black text-white transition hover:bg-scoreboard disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Opening Payment..." : `Pay ${formatCurrency(tournament.advanceAmount, tournament.currency)} with Razorpay`}
          </button>
        ) : canRegister ? (
          <div className="mt-6 rounded-lg border border-graphite/10 bg-floodlight p-5">
            <p className="text-sm font-black uppercase text-turf">UPI Payment</p>
            {paymentConfig?.upiId ? (
              <>
                <p className="mt-2 text-2xl font-black text-pitch">{paymentConfig.upiId}</p>
                <p className="mt-2 text-sm font-semibold text-graphite/65">Amount: {formatCurrency(tournament.advanceAmount, tournament.currency)}</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <a href={upiUrl} className="shine-button rounded-md bg-pitch px-4 py-3 text-center text-sm font-black text-white">
                    Open UPI App
                  </a>
                  <button onClick={copyUpi} className="rounded-md border border-graphite/15 bg-white px-4 py-3 text-sm font-black text-pitch">
                    Copy UPI ID
                  </button>
                </div>
                <button onClick={markUpiPaid} disabled={busy} className="shine-button mt-3 w-full rounded-md bg-crease px-4 py-3 text-sm font-black text-pitch disabled:opacity-60">
                  I Paid via UPI
                </button>
              </>
            ) : (
              <div className="grid gap-3">
                <p className="text-sm font-semibold leading-6 text-graphite/70">
                  UPI ID is not configured yet. Add `NEXT_PUBLIC_PAYMENT_UPI_ID` in Vercel to enable direct UPI payments.
                </p>
                {whatsapp ? (
                  <a href={whatsapp} target="_blank" rel="noreferrer" className="rounded-md bg-[#25D366] px-4 py-3 text-center text-sm font-black text-pitch">
                    Ask Organizer on WhatsApp
                  </a>
                ) : null}
              </div>
            )}
          </div>
        ) : null}

        {status ? <p className="mt-4 rounded-md bg-floodlight px-4 py-3 text-sm font-black text-pitch">{status}</p> : null}

        <div className="mt-6 flex flex-wrap gap-2">
          <Link href={`/register/${tournament.slug}`} className="rounded-md border border-graphite/15 px-4 py-2 text-sm font-black text-pitch">
            Edit Registration
          </Link>
          <Link href="/profile" className="rounded-md border border-graphite/15 px-4 py-2 text-sm font-black text-pitch">
            View Profile
          </Link>
        </div>
      </section>
    </div>
  );
}
