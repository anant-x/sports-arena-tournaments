"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clearUser, readRegistrations, readUser, saveUser } from "./localStore";

export default function ProfilePanel({ tournaments }) {
  const [user, setUser] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const refresh = async () => {
      const savedUser = readUser();
      setUser(savedUser);
      setRegistrations(readRegistrations());

      if (savedUser?.email) {
        try {
          const response = await fetch(`/api/registrations?email=${encodeURIComponent(savedUser.email)}`);
          const data = await response.json();
          if (response.ok && data.registrations?.length) {
            setRegistrations(data.registrations);
          }
        } catch {
          setRegistrations(readRegistrations());
        }
      }
    };

    refresh();
    window.addEventListener("tth:user-updated", refresh);
    window.addEventListener("tth:registrations-updated", refresh);
    return () => {
      window.removeEventListener("tth:user-updated", refresh);
      window.removeEventListener("tth:registrations-updated", refresh);
    };
  }, []);

  function updateField(event) {
    setUser((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function saveProfile(event) {
    event.preventDefault();
    saveUser({ ...user, savedAt: new Date().toISOString() });

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user)
      });
      const data = await response.json();
      if (response.ok && data.user) {
        saveUser({ ...data.user, savedAt: new Date().toISOString() });
        setMessage(data.databaseConfigured ? "Profile saved in the database." : "Profile saved locally. Connect the database to store it centrally.");
      } else {
        setMessage(data.error || "Profile saved locally, but not in the database.");
      }
    } catch {
      setMessage("Profile saved locally, but the database could not be reached.");
    }

    setEditing(false);
  }

  const tournamentBySlug = Object.fromEntries(tournaments.map((tournament) => [tournament.slug, tournament]));

  if (!user) {
    return (
      <div className="motion-card rounded-lg border border-graphite/10 bg-white p-6 shadow-sm">
        <p className="text-xl font-black text-pitch">No saved profile yet</p>
        <p className="mt-2 text-sm leading-6 text-graphite/68">Create an account to keep your details ready for future tournament registrations on this browser.</p>
        <Link href="/signup" className="mt-5 inline-flex rounded-md bg-pitch px-5 py-3 text-sm font-black text-white">
          Create Account
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
      <section className="motion-card rounded-lg border border-graphite/10 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase text-turf">Saved Profile</p>
            <h2 className="mt-1 text-3xl font-black text-pitch">{user.name}</h2>
          </div>
          <button onClick={() => setEditing((value) => !value)} className="rounded-md border border-graphite/15 px-4 py-2 text-sm font-black text-pitch">
            Edit
          </button>
        </div>

        {editing ? (
          <form onSubmit={saveProfile} className="mt-6 grid gap-4">
            {["name", "email", "phone", "city", "primarySport"].map((field) => (
              <label key={field} className="grid gap-2 text-sm font-bold capitalize text-pitch">
                {field === "primarySport" ? "Primary Sport" : field}
                <input name={field} value={user[field] ?? ""} onChange={updateField} className="rounded-md border border-graphite/15 px-4 py-3 font-semibold outline-none focus:border-turf" />
              </label>
            ))}
            <button className="rounded-md bg-pitch px-5 py-3 text-sm font-black text-white">Save Details</button>
          </form>
        ) : (
          <dl className="mt-6 grid gap-4 text-sm">
            {[
              ["Email", user.email],
              ["Phone", user.phone],
              ["City", user.city],
              ["Primary Sport", user.primarySport]
            ].map(([label, value]) => (
              <div key={label} className="rounded-md bg-floodlight px-4 py-3">
                <dt className="font-black uppercase text-graphite/45">{label}</dt>
                <dd className="mt-1 font-black text-pitch">{value || "Not saved"}</dd>
              </div>
            ))}
          </dl>
        )}
        {message ? <p className="mt-4 rounded-md bg-floodlight px-4 py-3 text-sm font-black text-pitch">{message}</p> : null}

        <button
          onClick={() => {
            clearUser();
            setUser(null);
          }}
          className="mt-5 text-sm font-black text-red-700"
        >
          Clear saved profile
        </button>
      </section>

      <section>
        <p className="text-sm font-black uppercase text-turf">Registrations</p>
        <h2 className="mt-1 text-3xl font-black text-pitch">Saved tournament entries</h2>
        <div className="stagger-list mt-6 grid gap-4">
          {registrations.length ? (
            registrations.map((registration) => {
              const tournament = tournamentBySlug[registration.tournamentSlug];
              return (
                <article key={registration.id} className="motion-card rounded-lg border border-graphite/10 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase text-turf">{tournament?.sport ?? "Tournament"}</p>
                      <h3 className="mt-1 text-xl font-black text-pitch">{tournament?.name ?? registration.tournamentName}</h3>
                      <p className="mt-2 text-sm font-semibold text-graphite/65">{registration.teamName || registration.playerName}</p>
                    </div>
                    <span className="rounded-md bg-floodlight px-3 py-2 text-xs font-black uppercase text-pitch">{registration.status}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={`/payment?slug=${registration.tournamentSlug}&registration=${registration.id}`} className="shine-button rounded-md bg-pitch px-4 py-2 text-sm font-black text-white">
                      Continue Payment
                    </Link>
                    <Link href={`/tournaments/${registration.tournamentSlug}`} className="rounded-md border border-graphite/15 px-4 py-2 text-sm font-black text-pitch">
                      Tournament
                    </Link>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-lg border border-graphite/10 bg-white p-6 shadow-sm">
              <p className="font-black text-pitch">No registrations saved yet.</p>
              <Link href="/register" className="mt-4 inline-flex rounded-md bg-pitch px-4 py-2 text-sm font-black text-white">
                Register Now
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
