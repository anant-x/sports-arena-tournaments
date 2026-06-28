"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function AdminLoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/admin";
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Incorrect admin password.");
        return;
      }

      window.location.href = next;
    } catch {
      setMessage("Could not reach admin login.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="motion-card mx-auto max-w-xl rounded-lg border border-graphite/10 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-sm font-black uppercase text-turf">Organizer Only</p>
      <h1 className="mt-2 text-3xl font-black text-pitch">Admin Login</h1>
      <p className="mt-2 text-sm font-semibold leading-6 text-graphite/66">Enter the production admin password to open the protected console.</p>
      <label className="mt-6 grid gap-2 text-sm font-bold text-pitch">
        Admin Password
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="rounded-md border border-graphite/15 px-4 py-3 font-semibold outline-none focus:border-turf"
          autoFocus
        />
      </label>
      <button disabled={busy} className="shine-button tap-target mt-5 w-full rounded-md bg-pitch px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60">
        {busy ? "Checking..." : "Open Admin Panel"}
      </button>
      {message ? <p className="mt-4 rounded-md bg-floodlight px-4 py-3 text-sm font-black text-pitch">{message}</p> : null}
    </form>
  );
}
