"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readUser, saveUser } from "./localStore";

const blankUser = {
  name: "",
  email: "",
  phone: "",
  city: "",
  primarySport: "Cricket",
  password: ""
};

export default function AuthForm({ mode = "login" }) {
  const [form, setForm] = useState(blankUser);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const saved = readUser();
    if (saved) {
      setForm((current) => ({ ...current, ...saved }));
    }
  }, []);

  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const endpoint = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          name: form.name || form.email.split("@")[0]
        })
      });
      const data = await response.json();

      if (response.ok && data.user) {
        if (!data.databaseConfigured) {
          setMessage("Database is not connected yet. Account login needs the production database.");
          return;
        }

        saveUser({
          ...data.user,
          savedAt: new Date().toISOString()
        });
        window.dispatchEvent(new Event("tth:auth-updated"));
        setMessage(
          mode === "signup"
            ? "Account created. Opening your profile..."
            : "Logged in. Opening your profile..."
        );
        window.setTimeout(() => {
          window.location.href = "/profile";
        }, 700);
        return;
      }

      if (data.databaseConfigured === false) {
        setMessage("Database is not connected yet. Account login needs the production database.");
        return;
      }

      setMessage(data.error || "Could not save account details.");
    } catch {
      setMessage("Could not reach the account service. Please try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="motion-card mx-auto max-w-2xl rounded-lg border border-graphite/10 bg-white p-4 shadow-sm sm:p-6">
      <form onSubmit={submit} className="grid gap-4">
        {mode === "signup" ? (
          <label className="grid gap-2 text-sm font-bold text-pitch">
            Full Name
            <input name="name" value={form.name} onChange={updateField} required className="rounded-md border border-graphite/15 px-4 py-3 font-semibold outline-none focus:border-turf" />
          </label>
        ) : null}
        <label className="grid gap-2 text-sm font-bold text-pitch">
          Email
          <input name="email" type="email" value={form.email} onChange={updateField} required className="rounded-md border border-graphite/15 px-4 py-3 font-semibold outline-none focus:border-turf" />
        </label>
        {mode === "signup" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-pitch">
              Phone
              <input name="phone" value={form.phone} onChange={updateField} required className="rounded-md border border-graphite/15 px-4 py-3 font-semibold outline-none focus:border-turf" />
            </label>
            <label className="grid gap-2 text-sm font-bold text-pitch">
              City
              <input name="city" value={form.city} onChange={updateField} required className="rounded-md border border-graphite/15 px-4 py-3 font-semibold outline-none focus:border-turf" />
            </label>
          </div>
        ) : null}
        <label className="grid gap-2 text-sm font-bold text-pitch">
          Password
          <input name="password" type="password" value={form.password} onChange={updateField} required className="rounded-md border border-graphite/15 px-4 py-3 font-semibold outline-none focus:border-turf" />
        </label>
        {mode === "signup" ? (
          <label className="grid gap-2 text-sm font-bold text-pitch">
            Primary Sport
            <select name="primarySport" value={form.primarySport} onChange={updateField} className="rounded-md border border-graphite/15 px-4 py-3 font-semibold outline-none focus:border-turf">
              {["Cricket", "Badminton", "Tennis", "Football"].map((sport) => (
                <option key={sport}>{sport}</option>
              ))}
            </select>
          </label>
        ) : null}
        <button disabled={busy} className="shine-button tap-target rounded-md bg-pitch px-5 py-3 text-sm font-black text-white transition hover:bg-scoreboard disabled:cursor-not-allowed disabled:opacity-60">
          {busy ? "Saving..." : mode === "signup" ? "Create Account" : "Login"}
        </button>
      </form>
      {message ? <p className="mt-4 rounded-md bg-floodlight px-4 py-3 text-sm font-black text-pitch">{message}</p> : null}
      <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold text-graphite/65">
        <span>
          {mode === "signup" ? "Already have a saved profile?" : "New here?"}{" "}
          <Link href={mode === "signup" ? "/login" : "/signup"} className="font-black text-turf">
            {mode === "signup" ? "Login" : "Create an account"}
          </Link>
        </span>
        {mode === "login" ? <Link href="/forgot-password" className="font-black text-turf">Forgot password?</Link> : null}
        <Link href="/privacy" className="font-black text-turf">Privacy</Link>
      </div>
      <p className="mt-4 rounded-md bg-floodlight px-4 py-3 text-xs font-semibold leading-5 text-graphite/70">
        Your account is stored in the tournament database and kept active with a secure session cookie for registrations, payment verification, score updates, and organizer communication.
      </p>
    </div>
  );
}
