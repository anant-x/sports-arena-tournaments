"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "../../lib/tournament";
import { readUser, saveUser, upsertRegistration } from "./localStore";

function initialForm(tournament) {
  return {
    playerName: "",
    email: "",
    phone: "",
    city: "",
    age: "",
    gender: "",
    emergencyContact: "",
    category: tournament.category.includes("Team") ? "Team" : "Individual",
    teamName: "",
    players: "",
    preferredPayment: "Razorpay",
    notes: "",
    termsAccepted: false
  };
}

export default function RegistrationForm({ tournament }) {
  const [form, setForm] = useState(() => initialForm(tournament));
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const user = readUser();
    if (user) {
      setForm((current) => ({
        ...current,
        playerName: user.name ?? "",
        email: user.email ?? "",
        phone: user.phone ?? "",
        city: user.city ?? ""
      }));
    }
  }, []);

  function updateField(event) {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((current) => ({
      ...current,
      [event.target.name]: value
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("Saving registration...");

    const registration = {
      id: `reg_${Date.now()}`,
      tournamentSlug: tournament.slug,
      tournamentName: tournament.name,
      sport: tournament.sport,
      playerName: form.playerName,
      email: form.email,
      phone: form.phone,
      city: form.city,
      age: form.age,
      gender: form.gender,
      emergencyContact: form.emergencyContact,
      category: form.category,
      teamName: form.teamName,
      players: form.players
        .split("\n")
        .map((player) => player.trim())
        .filter(Boolean),
      notes: form.notes,
      preferredPayment: form.preferredPayment,
      termsAccepted: form.termsAccepted,
      extras: {
        ageLimit: tournament.ageLimit || "Open",
        refundPolicy: tournament.refundPolicy || "Organizer cancellation refund only after fixtures are published."
      },
      fee: tournament.registrationFee,
      advanceAmount: tournament.advanceAmount,
      currency: tournament.currency,
      status: "Advance pending",
      createdAt: new Date().toISOString()
    };

    const user = {
      name: form.playerName,
      email: form.email,
      phone: form.phone,
      city: form.city,
      primarySport: tournament.sport,
      savedAt: new Date().toISOString()
    };

    saveUser(user);

    try {
      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registration)
      });
      const data = await response.json();
      const savedRegistration = response.ok && data.registration ? data.registration : registration;

      upsertRegistration(savedRegistration);
      setSaved(true);
      setMessage(
        data.databaseConfigured
          ? "Registration saved in the database. Opening payment page..."
          : "Database is not connected yet, so the registration is saved locally. Opening payment page..."
      );
      window.location.href = `/payment?slug=${tournament.slug}&registration=${savedRegistration.id}`;
    } catch {
      upsertRegistration(registration);
      setSaved(true);
      setMessage("Could not reach the database, so this registration is saved locally. Opening payment page...");
      window.location.href = `/payment?slug=${tournament.slug}&registration=${registration.id}`;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr]">
      <aside className="motion-card rounded-lg border border-graphite/10 bg-white p-6 shadow-sm">
        <p className="text-sm font-black uppercase text-turf">{tournament.sport}</p>
        <h2 className="mt-2 text-3xl font-black text-pitch">{tournament.name}</h2>
        <dl className="mt-6 grid gap-4 text-sm">
          {[
            ["Registration Fee", formatCurrency(tournament.registrationFee, tournament.currency)],
            ["Advance Payment", formatCurrency(tournament.advanceAmount, tournament.currency)],
            ["Team Size", tournament.teamSize],
            ["Age Limit", tournament.ageLimit || "Open category"],
            ["Deadline", tournament.registrationDeadline],
            ["Refund", tournament.refundPolicy || "Refund only if the organizer cancels the tournament."]
          ].map(([label, value]) => (
            <div key={label} className="rounded-md bg-floodlight px-4 py-3">
              <dt className="font-black uppercase text-graphite/45">{label}</dt>
              <dd className="mt-1 font-black text-pitch">{value}</dd>
            </div>
          ))}
        </dl>
      </aside>

      <form onSubmit={submit} className="motion-card rounded-lg border border-graphite/10 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold text-pitch">
            Captain / Player Name
            <input name="playerName" value={form.playerName} onChange={updateField} required className="rounded-md border border-graphite/15 px-4 py-3 font-semibold outline-none focus:border-turf" />
          </label>
          <label className="grid gap-2 text-sm font-bold text-pitch">
            Email
            <input name="email" type="email" value={form.email} onChange={updateField} required className="rounded-md border border-graphite/15 px-4 py-3 font-semibold outline-none focus:border-turf" />
          </label>
          <label className="grid gap-2 text-sm font-bold text-pitch">
            Phone
            <input name="phone" value={form.phone} onChange={updateField} required className="rounded-md border border-graphite/15 px-4 py-3 font-semibold outline-none focus:border-turf" />
          </label>
          <label className="grid gap-2 text-sm font-bold text-pitch">
            City
            <input name="city" value={form.city} onChange={updateField} required className="rounded-md border border-graphite/15 px-4 py-3 font-semibold outline-none focus:border-turf" />
          </label>
          <label className="grid gap-2 text-sm font-bold text-pitch">
            Age
            <input name="age" value={form.age} onChange={updateField} required className="rounded-md border border-graphite/15 px-4 py-3 font-semibold outline-none focus:border-turf" />
          </label>
          <label className="grid gap-2 text-sm font-bold text-pitch">
            Gender / Category
            <select name="gender" value={form.gender} onChange={updateField} required className="rounded-md border border-graphite/15 px-4 py-3 font-semibold outline-none focus:border-turf">
              <option value="">Select category</option>
              <option>Male</option>
              <option>Female</option>
              <option>Mixed</option>
              <option>Open</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-pitch">
            Category
            <select name="category" value={form.category} onChange={updateField} className="rounded-md border border-graphite/15 px-4 py-3 font-semibold outline-none focus:border-turf">
              <option>Team</option>
              <option>Individual</option>
              <option>Doubles</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-pitch">
            Team / Pair Name
            <input name="teamName" value={form.teamName} onChange={updateField} className="rounded-md border border-graphite/15 px-4 py-3 font-semibold outline-none focus:border-turf" />
          </label>
          <label className="grid gap-2 text-sm font-bold text-pitch">
            Emergency Contact
            <input name="emergencyContact" value={form.emergencyContact} onChange={updateField} required className="rounded-md border border-graphite/15 px-4 py-3 font-semibold outline-none focus:border-turf" />
          </label>
          <label className="grid gap-2 text-sm font-bold text-pitch">
            Payment Preference
            <select name="preferredPayment" value={form.preferredPayment} onChange={updateField} className="rounded-md border border-graphite/15 px-4 py-3 font-semibold outline-none focus:border-turf">
              <option>Razorpay</option>
              <option>UPI</option>
              <option>Pay at venue after approval</option>
            </select>
          </label>
        </div>
        <label className="mt-4 grid gap-2 text-sm font-bold text-pitch">
          Player List
          <textarea name="players" value={form.players} onChange={updateField} rows={6} placeholder="One player per line" className="rounded-md border border-graphite/15 px-4 py-3 font-semibold outline-none focus:border-turf" />
        </label>
        <label className="mt-4 grid gap-2 text-sm font-bold text-pitch">
          Notes
          <textarea name="notes" value={form.notes} onChange={updateField} rows={3} className="rounded-md border border-graphite/15 px-4 py-3 font-semibold outline-none focus:border-turf" />
        </label>
        <label className="mt-4 flex gap-3 rounded-lg bg-floodlight p-4 text-sm font-bold text-pitch">
          <input name="termsAccepted" type="checkbox" checked={form.termsAccepted} onChange={updateField} required className="mt-1 h-4 w-4" />
          <span>
            I confirm the details are correct and accept the tournament rules, privacy policy, and refund/cancellation policy.
          </span>
        </label>
        <button disabled={busy} className="shine-button mt-6 w-full rounded-md bg-pitch px-5 py-3 text-sm font-black text-white transition hover:bg-scoreboard disabled:cursor-not-allowed disabled:opacity-60">
          {busy ? "Saving Registration..." : "Save Registration & Pay Advance"}
        </button>
        {saved || message ? <p className="mt-4 rounded-md bg-floodlight px-4 py-3 text-sm font-black text-pitch">{message}</p> : null}
      </form>
    </div>
  );
}
