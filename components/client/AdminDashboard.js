"use client";

import { useEffect, useMemo, useState } from "react";
import { formatCurrency } from "../../lib/tournament";
import AdminScoreboardManager from "./AdminScoreboardManager";

const tabs = [
  { id: "registrations", label: "Registrations" },
  { id: "payments", label: "Payments" },
  { id: "users", label: "Users" },
  { id: "tournaments", label: "Tournaments" },
  { id: "scoreboard", label: "Scoreboard" }
];

const columns = {
  registrations: [
    ["tournamentName", "Tournament"],
    ["playerName", "Player"],
    ["teamName", "Team / Pair"],
    ["email", "Email"],
    ["phone", "Phone"],
    ["sport", "Sport"],
    ["status", "Status"],
    ["createdAt", "Created"]
  ],
  payments: [
    ["registrationId", "Registration"],
    ["tournamentSlug", "Tournament"],
    ["amount", "Amount"],
    ["providerPaymentId", "Payment ID"],
    ["status", "Status"],
    ["mode", "Mode"],
    ["createdAt", "Created"]
  ],
  users: [
    ["name", "Name"],
    ["email", "Email"],
    ["phone", "Phone"],
    ["city", "City"],
    ["primarySport", "Sport"],
    ["createdAt", "Created"]
  ],
  tournaments: [
    ["name", "Tournament"],
    ["sport", "Sport"],
    ["format", "Format"],
    ["city", "City"],
    ["registrationFee", "Fee"],
    ["advanceAmount", "Advance"],
    ["status", "Status"]
  ]
};

function formatDate(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function renderValue(row, key) {
  if (["createdAt", "updatedAt"].includes(key)) {
    return formatDate(row[key]);
  }

  if (["amount"].includes(key)) {
    return formatCurrency((row[key] || 0) / 100, row.currency || "INR");
  }

  if (["registrationFee", "advanceAmount"].includes(key)) {
    return formatCurrency(row[key] || 0, row.currency || "INR");
  }

  if (Array.isArray(row[key])) {
    return row[key].join(", ");
  }

  return row[key] || "";
}

export default function AdminDashboard() {
  const [password, setPassword] = useState("");
  const [summary, setSummary] = useState(null);
  const [activeTab, setActiveTab] = useState("registrations");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const saved = window.sessionStorage.getItem("tth_admin_password");
    if (saved) {
      setPassword(saved);
      loadAdmin(saved);
    }
  }, []);

  async function loadAdmin(secret = password) {
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/summary", {
        headers: { "x-admin-password": secret }
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Could not load admin dashboard.");
        setSummary(null);
        return;
      }

      window.sessionStorage.setItem("tth_admin_password", secret);
      setSummary(data);
      setMessage(data.database.configured ? "Database connected." : "Database is not connected yet.");
    } catch {
      setMessage("Could not reach the admin service.");
    } finally {
      setBusy(false);
    }
  }

  async function exportCsv(table) {
    setMessage("Preparing CSV export...");

    try {
      const response = await fetch(`/api/admin/export?table=${table}`, {
        headers: { "x-admin-password": password }
      });

      if (!response.ok) {
        const data = await response.json();
        setMessage(data.error || "Could not export CSV.");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `tth-${table}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage("CSV export downloaded.");
    } catch {
      setMessage("Could not export CSV.");
    }
  }

  const rows = useMemo(() => summary?.[activeTab] || [], [summary, activeTab]);
  const activeColumns = columns[activeTab];

  return (
    <div className="grid gap-8">
      <section className="motion-card rounded-lg border border-graphite/10 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5">
          <p className="text-sm font-black uppercase text-turf">Organizer Access Only</p>
          <h2 className="mt-1 text-2xl font-black text-pitch">Secure admin login</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-graphite/66">
            The page is hidden from public navigation. Registration, payment, export, and scoreboard APIs require the production admin password.
          </p>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            loadAdmin();
          }}
          className="grid gap-4 sm:grid-cols-[1fr_auto]"
        >
          <label className="grid gap-2 text-sm font-bold text-pitch">
            Admin Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-md border border-graphite/15 px-4 py-3 font-semibold outline-none focus:border-turf"
            />
          </label>
          <button disabled={busy} className="shine-button tap-target self-end rounded-md bg-pitch px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60">
            {busy ? "Loading..." : "Open Dashboard"}
          </button>
        </form>
        {message ? <p className="mt-4 rounded-md bg-floodlight px-4 py-3 text-sm font-black text-pitch">{message}</p> : null}
      </section>

      {summary ? (
        <>
          <section className="stagger-list grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["Tournaments", summary.stats.tournaments],
              ["Users", summary.stats.users],
              ["Registrations", summary.stats.registrations],
              ["Paid", summary.stats.paidRegistrations],
              ["Payments", summary.stats.payments]
            ].map(([label, value]) => (
              <div key={label} className="motion-card rounded-lg border border-graphite/10 bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase text-graphite/45">{label}</p>
                <p className="mt-2 text-3xl font-black text-pitch">{value}</p>
              </div>
            ))}
          </section>

          <section className="motion-card rounded-lg border border-graphite/10 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase text-turf">Database</p>
                <h2 className="mt-1 break-words text-xl font-black text-pitch sm:text-2xl">{summary.database.host}</h2>
              </div>
              <div className="mobile-scroll -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`tap-target shrink-0 rounded-md px-4 py-2 text-sm font-black transition ${
                      activeTab === tab.id ? "bg-pitch text-white" : "border border-graphite/15 text-pitch"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {!summary.database.configured ? (
              <div className="mt-6 rounded-lg bg-floodlight p-5 text-sm font-semibold leading-6 text-graphite/72">
                Add a managed Postgres `DATABASE_URL` in Vercel and redeploy. Once connected, this dashboard will show live users, registrations, and payments.
              </div>
            ) : null}

            {activeTab === "scoreboard" ? (
              <div className="mt-6">
                <AdminScoreboardManager password={password} />
              </div>
            ) : (
              <>
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-black text-pitch">{rows.length} records</p>
                  <button onClick={() => exportCsv(activeTab)} className="rounded-md bg-crease px-4 py-2 text-sm font-black text-pitch">
                    Export CSV
                  </button>
                </div>

                <div className="table-scroll mobile-scroll mt-4">
                  <table className="min-w-[760px] border-separate border-spacing-0 text-left text-sm">
                    <thead>
                      <tr>
                        {activeColumns.map(([key, label]) => (
                          <th key={key} className="border-b border-graphite/10 px-3 py-3 font-black uppercase text-graphite/45">
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length ? (
                        rows.map((row) => (
                          <tr key={row.id || row.slug} className="align-top">
                            {activeColumns.map(([key]) => (
                              <td key={key} className="border-b border-graphite/10 px-3 py-3 font-semibold text-pitch">
                                {renderValue(row, key)}
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={activeColumns.length} className="px-3 py-8 text-center font-semibold text-graphite/60">
                            No records yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
