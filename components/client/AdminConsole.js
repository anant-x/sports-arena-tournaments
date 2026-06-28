"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const navItems = [
  { id: "dashboard", label: "Dashboard", href: "/admin" },
  { id: "tournaments", label: "Tournaments", href: "/admin/tournaments" },
  { id: "teams", label: "Teams", href: "/admin/teams" },
  { id: "matches", label: "Matches", href: "/admin/matches" },
  { id: "points", label: "Points", href: "/admin/points" },
  { id: "players", label: "Players", href: "/admin/players" },
  { id: "content", label: "Content", href: "/admin/content" },
  { id: "notifications", label: "Notifications", href: "/admin/notifications" },
  { id: "log", label: "Action Log", href: "/admin/log" }
];

const tournamentStatuses = ["Open", "Closed", "Upcoming", "Ongoing", "Completed"];
const paymentStatuses = ["Pending", "Advance Paid", "Full Paid"];
const approvalStatuses = ["Pending", "Approved", "Rejected"];
const matchStatuses = ["upcoming", "live", "completed", "cancelled"];

const blankTournament = {
  slug: "",
  name: "",
  sport: "Cricket",
  format: "T10",
  city: "Ghaziabad",
  venue: "",
  startDate: "",
  endDate: "",
  registrationFee: "",
  advanceAmount: "",
  prizeMoney: "",
  maxTeams: "",
  description: "",
  status: "Upcoming"
};

const blankMatch = {
  tournamentSlug: "",
  matchId: "",
  team1: "",
  team2: "",
  date: "",
  time: "",
  venue: "",
  status: "upcoming",
  result: "",
  team1Score: "",
  team2Score: "",
  playerOfMatch: "",
  highlights: ""
};

const blankPlayer = {
  id: "",
  playerName: "",
  team: "",
  tournamentSlug: "",
  role: "All-rounder",
  runs: 0,
  wickets: 0,
  catches: 0,
  matchesPlayed: 0
};

const blankNotification = {
  audience: "specific",
  registrationId: "",
  tournamentSlug: "",
  type: "custom",
  message: ""
};

function money(value, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function dateTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function digits(value) {
  return String(value || "").replace(/\D/g, "");
}

function playerLabel(player) {
  if (typeof player === "string") {
    return player;
  }

  if (!player || typeof player !== "object") {
    return "";
  }

  return [player.name, player.role].filter(Boolean).join(" - ");
}

function normalizeGalleryItem(item) {
  if (typeof item === "string") {
    return { url: item, caption: "" };
  }

  return {
    url: item?.url || item?.src || item?.image || "",
    caption: item?.caption || item?.alt || ""
  };
}

function statusBadgeClass(status) {
  const value = String(status || "").toLowerCase();
  if (["open", "approved", "live", "full paid", "advance paid", "completed"].includes(value)) {
    return "bg-emerald-400/16 text-emerald-100 ring-emerald-300/20";
  }

  if (["closed", "cancelled", "rejected"].includes(value)) {
    return "bg-red-400/16 text-red-100 ring-red-300/20";
  }

  return "bg-amber-400/16 text-amber-100 ring-amber-300/20";
}

function Panel({ children, className = "" }) {
  return <section className={`rounded-lg border border-white/10 bg-white/[0.075] p-4 shadow-2xl shadow-black/10 sm:p-5 ${className}`}>{children}</section>;
}

function Field({ label, value, onChange, type = "text", options, textarea = false, placeholder = "", className = "" }) {
  const controlClass =
    "w-full rounded-md border border-white/12 bg-white/10 px-3 py-2.5 text-sm font-semibold text-white outline-none placeholder:text-white/35 focus:border-emerald-300";

  return (
    <label className={`grid gap-2 text-xs font-black uppercase tracking-wide text-white/58 ${className}`}>
      {label}
      {textarea ? (
        <textarea value={value ?? ""} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={4} className={`${controlClass} min-h-[118px]`} />
      ) : options ? (
        <select value={value ?? ""} onChange={(event) => onChange(event.target.value)} className={controlClass}>
          {options.map((option) => {
            const item = Array.isArray(option) ? { value: option[0], label: option[1] } : { value: option, label: option };
            return (
              <option key={item.value} value={item.value} className="bg-[#0b1711] text-white">
                {item.label}
              </option>
            );
          })}
        </select>
      ) : (
        <input value={value ?? ""} onChange={(event) => onChange(event.target.value)} type={type} placeholder={placeholder} className={controlClass} />
      )}
    </label>
  );
}

function ActionButton({ children, onClick, busy, variant = "primary", type = "button", href, target }) {
  const palette =
    variant === "danger"
      ? "bg-red-500 text-white hover:bg-red-400"
      : variant === "muted"
        ? "border border-white/12 bg-white/8 text-white hover:bg-white/14"
        : variant === "whatsapp"
          ? "bg-[#25D366] text-[#0b1711] hover:bg-white"
          : "bg-emerald-300 text-[#0b1711] hover:bg-white";
  const className = `tap-target inline-flex items-center justify-center rounded-md px-3 py-2 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-55 ${palette}`;

  if (href) {
    return (
      <a href={href} target={target} rel={target ? "noreferrer" : undefined} className={className}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={busy} className={className}>
      {busy ? "Working..." : children}
    </button>
  );
}

function SectionTitle({ eyebrow, title, children }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-wide text-emerald-200/80">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-black tracking-normal text-white sm:text-3xl">{title}</h1>
      </div>
      {children}
    </div>
  );
}

function EmptyState({ children = "No records yet." }) {
  return <div className="rounded-lg border border-dashed border-white/12 bg-white/[0.045] p-6 text-center text-sm font-bold text-white/58">{children}</div>;
}

export default function AdminConsole({ section = "dashboard" }) {
  const activeSection = navItems.some((item) => item.id === section) ? section : "dashboard";
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [toast, setToast] = useState("");
  const [tournamentForm, setTournamentForm] = useState(blankTournament);
  const [teamSearch, setTeamSearch] = useState("");
  const [teamFilters, setTeamFilters] = useState({ tournament: "all", payment: "all", approval: "all" });
  const [expandedTeam, setExpandedTeam] = useState("");
  const [matchForm, setMatchForm] = useState(blankMatch);
  const [pointsTournament, setPointsTournament] = useState("");
  const [pointsDraft, setPointsDraft] = useState([]);
  const [playerForm, setPlayerForm] = useState(blankPlayer);
  const [contentForm, setContentForm] = useState(null);
  const [galleryUrl, setGalleryUrl] = useState("");
  const [notificationForm, setNotificationForm] = useState(blankNotification);

  async function load() {
    try {
      const response = await fetch("/api/admin/console", { cache: "no-store" });
      const payload = await response.json();

      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      if (!response.ok) {
        throw new Error(payload.error || "Could not load admin console.");
      }

      setData(payload);
      setToast(payload.database?.configured ? "" : "Database is not connected. Viewing seeded fallback data.");
    } catch (error) {
      setToast(error.message || "Could not load admin console.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!data) {
      return;
    }

    if (!matchForm.tournamentSlug && data.scoreboard?.[0]?.tournamentSlug) {
      setMatchForm((current) => ({ ...current, tournamentSlug: data.scoreboard[0].tournamentSlug }));
    }

    if (!pointsTournament && data.scoreboard?.[0]?.tournamentSlug) {
      setPointsTournament(data.scoreboard[0].tournamentSlug);
    }

    if (!contentForm && data.content) {
      setContentForm(data.content);
    }

    if (!notificationForm.tournamentSlug && data.scoreboard?.[0]?.tournamentSlug) {
      setNotificationForm((current) => ({ ...current, tournamentSlug: data.scoreboard[0].tournamentSlug }));
    }
  }, [data, contentForm, matchForm.tournamentSlug, notificationForm.tournamentSlug, pointsTournament]);

  const selectedPointsEvent = useMemo(
    () => data?.scoreboard?.find((event) => event.tournamentSlug === pointsTournament) || data?.scoreboard?.[0],
    [data, pointsTournament]
  );

  useEffect(() => {
    if (!selectedPointsEvent) {
      return;
    }

    const existing = new Map((selectedPointsEvent.standings || []).map((row) => [row.team, row]));
    const teams = selectedPointsEvent.teams?.length ? selectedPointsEvent.teams.map((team) => team.shortName || team.name) : [...existing.keys()];
    const rows = teams.map((team) => ({
      tournamentSlug: selectedPointsEvent.tournamentSlug,
      team,
      played: existing.get(team)?.played || 0,
      won: existing.get(team)?.won || 0,
      lost: existing.get(team)?.lost || 0,
      points: existing.get(team)?.points || 0,
      nrr: existing.get(team)?.nrr || "0.000"
    }));
    setPointsDraft(rows);
  }, [selectedPointsEvent]);

  async function postAdminAction(action, payload) {
    const response = await fetch("/api/admin/console", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload })
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.error || "Could not save admin change.");
    }

    return result;
  }

  async function mutate(action, payload, success = "Saved.") {
    setBusy(action);
    setToast("");

    try {
      await postAdminAction(action, payload);
      await load();
      setToast(success);
    } catch (error) {
      setToast(error.message || "Could not save admin change.");
    } finally {
      setBusy("");
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  const registrations = data?.registrations || [];
  const tournaments = data?.tournaments || [];
  const scoreboard = data?.scoreboard || [];
  const flatMatches = useMemo(
    () =>
      scoreboard.flatMap((event) =>
        (event.matches || []).map((match) => ({
          ...match,
          tournamentSlug: event.tournamentSlug,
          tournamentName: event.tournamentName,
          sport: event.sport
        }))
      ),
    [scoreboard]
  );

  const selectedMatchEvent = useMemo(
    () => scoreboard.find((event) => event.tournamentSlug === matchForm.tournamentSlug) || scoreboard[0],
    [scoreboard, matchForm.tournamentSlug]
  );

  const teamOptions = useMemo(() => {
    const teams = new Map();
    for (const team of selectedMatchEvent?.teams || []) {
      teams.set(team.shortName || team.name, team.name || team.shortName);
    }
    for (const row of registrations.filter((item) => item.tournamentSlug === selectedMatchEvent?.tournamentSlug)) {
      if (row.teamName) {
        teams.set(row.teamName, row.teamName);
      }
    }
    return [["", "Select team"], ...[...teams.entries()].map(([value, label]) => [value, label])];
  }, [registrations, selectedMatchEvent]);

  const filteredTeams = useMemo(() => {
    const query = teamSearch.trim().toLowerCase();
    return registrations.filter((row) => {
      const text = [row.teamName, row.playerName, row.phone, row.email, row.tournamentName].join(" ").toLowerCase();
      const tournamentOk = teamFilters.tournament === "all" || row.tournamentSlug === teamFilters.tournament;
      const paymentOk = teamFilters.payment === "all" || (row.paymentStatus || row.status) === teamFilters.payment;
      const approvalOk = teamFilters.approval === "all" || (row.approvalStatus || "Pending") === teamFilters.approval;
      return tournamentOk && paymentOk && approvalOk && (!query || text.includes(query));
    });
  }, [registrations, teamFilters, teamSearch]);

  const notificationPreview = useMemo(() => {
    if (notificationForm.type === "custom" && notificationForm.message.trim()) {
      return notificationForm.message.trim();
    }

    const event = scoreboard.find((item) => item.tournamentSlug === notificationForm.tournamentSlug) || scoreboard[0];
    const upcoming = event?.matches?.find((match) => match.status !== "completed" && match.status !== "cancelled");
    const result = [...(event?.matches || [])].reverse().find((match) => match.status === "completed");

    if (notificationForm.type === "match") {
      return upcoming
        ? `Match reminder: ${upcoming.team1} vs ${upcoming.team2} at ${upcoming.time || "TBD"} on ${upcoming.date || "TBD"}, venue ${upcoming.venue || event?.tournamentName}. Please report early.`
        : `Match reminder: fixtures for ${event?.tournamentName || "your tournament"} will be shared soon.`;
    }

    if (notificationForm.type === "result") {
      return result
        ? `Result update: ${result.team1} vs ${result.team2}. ${result.result || "Scorecard updated."}`
        : `Result update: no completed match is available for ${event?.tournamentName || "this tournament"} yet.`;
    }

    return notificationForm.message || "Write a custom message for captains.";
  }, [notificationForm, scoreboard]);

  async function exportRegistrations() {
    setBusy("exportRegistrations");
    setToast("Preparing CSV export...");

    try {
      const response = await fetch("/api/admin/export?table=registrations");
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || "Could not export registrations.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "sports-arena-registrations.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setToast("Registrations CSV downloaded.");
    } catch (error) {
      setToast(error.message || "Could not export registrations.");
    } finally {
      setBusy("");
    }
  }

  function editTournament(tournament) {
    setTournamentForm({
      slug: tournament.slug || "",
      name: tournament.name || "",
      sport: tournament.sport || "Cricket",
      format: tournament.format || "T10",
      city: tournament.city || "",
      venue: tournament.venue || "",
      startDate: tournament.startDate || "",
      endDate: tournament.details?.endDate || tournament.registrationDeadline || "",
      registrationFee: tournament.registrationFee || "",
      advanceAmount: tournament.advanceAmount || "",
      prizeMoney: tournament.details?.prizeMoney || "",
      maxTeams: tournament.details?.maxTeams || tournament.details?.slots || "",
      description: tournament.details?.description || "",
      status: tournament.status || "Upcoming"
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveTournament(event) {
    event.preventDefault();
    await mutate("saveTournament", tournamentForm, "Tournament saved.");
    setTournamentForm(blankTournament);
  }

  async function deleteTournament(tournament) {
    const typed = window.prompt(`This will delete all fixtures and registrations for this tournament. Type "${tournament.name}" to confirm.`);
    if (typed !== tournament.name) {
      return;
    }

    await mutate("deleteTournament", { slug: tournament.slug, name: tournament.name }, "Tournament deleted.");
  }

  async function markPayment(row) {
    const paymentStatus = window.prompt("Payment status: Pending, Advance Paid, or Full Paid", row.paymentStatus || row.status || "Pending");
    if (!paymentStatus) {
      return;
    }
    const paidAmount = window.prompt("Paid amount", String(row.paidAmount || row.advanceAmount || 0));
    if (paidAmount === null) {
      return;
    }
    const paidAt = window.prompt("Payment date", row.paidAt || today());
    if (paidAt === null) {
      return;
    }

    await mutate(
      "updateRegistration",
      {
        id: row.id,
        teamName: row.teamName,
        paymentStatus,
        status: paymentStatus,
        paidAmount: Number(paidAmount || 0),
        paidAt
      },
      "Payment updated."
    );
  }

  async function editTeam(row) {
    const teamName = window.prompt("Team name", row.teamName || "");
    if (teamName === null) {
      return;
    }
    const playerName = window.prompt("Captain name", row.playerName || "");
    if (playerName === null) {
      return;
    }
    const phone = window.prompt("Captain phone", row.phone || "");
    if (phone === null) {
      return;
    }

    await mutate("updateRegistration", { id: row.id, teamName, playerName, phone }, "Team updated.");
  }

  async function deleteTeam(row) {
    if (!window.confirm(`Delete registration for ${row.teamName || row.playerName}?`)) {
      return;
    }

    await mutate("deleteRegistration", { id: row.id, teamName: row.teamName }, "Registration deleted.");
  }

  function fillMatchForm(row) {
    setMatchForm({
      tournamentSlug: row.tournamentSlug || "",
      matchId: row.id || row.matchId || "",
      team1: row.team1 || "",
      team2: row.team2 || "",
      date: row.date || "",
      time: row.time || "",
      venue: row.venue || "",
      status: row.status || "upcoming",
      result: row.result || "",
      team1Score: row.scorecard?.team1Score || "",
      team2Score: row.scorecard?.team2Score || "",
      playerOfMatch: row.scorecard?.playerOfMatch || "",
      highlights: (row.scorecard?.highlights || []).join("\n")
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveMatch(event) {
    event.preventDefault();
    const matchId = matchForm.matchId || `M-${Date.now().toString().slice(-6)}`;
    await mutate("saveMatch", { ...matchForm, matchId }, "Fixture saved.");
    setMatchForm({ ...blankMatch, tournamentSlug: matchForm.tournamentSlug });
  }

  async function quickLive(row) {
    const battingSide = window.prompt(`Which side is batting? Type 1 for ${row.team1}, 2 for ${row.team2}`, "1");
    if (!battingSide) {
      return;
    }
    const currentScore = window.prompt("Current score, for example 78/3 (7.2 ov)", battingSide === "2" ? row.scorecard?.team2Score || "" : row.scorecard?.team1Score || "");
    if (currentScore === null) {
      return;
    }

    await mutate(
      "saveMatch",
      {
        ...row,
        matchId: row.id,
        status: "live",
        team1Score: battingSide === "2" ? row.scorecard?.team1Score || "" : currentScore,
        team2Score: battingSide === "2" ? currentScore : row.scorecard?.team2Score || "",
        playerOfMatch: row.scorecard?.playerOfMatch || "",
        highlights: (row.scorecard?.highlights || []).join("\n")
      },
      "Live score updated."
    );
  }

  async function cancelMatch(row) {
    const reason = window.prompt("Cancellation reason", row.result || "Cancelled by organizer");
    if (reason === null) {
      return;
    }

    await mutate("saveMatch", { ...row, matchId: row.id, status: "cancelled", result: `Cancelled: ${reason}` }, "Match cancelled.");
  }

  async function deleteMatch(row) {
    if (!window.confirm(`Delete fixture ${row.id}: ${row.team1} vs ${row.team2}?`)) {
      return;
    }

    await mutate("deleteMatch", { tournamentSlug: row.tournamentSlug, matchId: row.id }, "Fixture deleted.");
  }

  async function savePoints() {
    setBusy("savePoints");
    setToast("");

    try {
      for (const row of pointsDraft) {
        await postAdminAction("saveStanding", row);
      }
      await load();
      setToast("Points table saved.");
    } catch (error) {
      setToast(error.message || "Could not save points table.");
    } finally {
      setBusy("");
    }
  }

  async function savePlayer(event) {
    event.preventDefault();
    await mutate("savePlayer", playerForm, "Player stats saved.");
    setPlayerForm(blankPlayer);
  }

  function updateContent(path, value) {
    setContentForm((current) => {
      const base = current || {};
      if (path.length === 1) {
        return { ...base, [path[0]]: value };
      }

      const [head, child] = path;
      return { ...base, [head]: { ...(base[head] || {}), [child]: value } };
    });
  }

  async function saveContent(event) {
    event.preventDefault();
    await mutate("saveContent", { content: contentForm }, "Content saved.");
  }

  function addGalleryUrl() {
    if (!galleryUrl.trim()) {
      return;
    }

    updateContent(["gallery"], [...(contentForm?.gallery || []), { url: galleryUrl.trim(), caption: "" }]);
    setGalleryUrl("");
  }

  async function sendNotification() {
    const selectedRegistration = registrations.find((row) => row.id === notificationForm.registrationId);
    const recipient =
      notificationForm.audience === "specific"
        ? selectedRegistration?.teamName || selectedRegistration?.playerName || "Selected captain"
        : notificationForm.audience === "tournament"
          ? scoreboard.find((event) => event.tournamentSlug === notificationForm.tournamentSlug)?.tournamentName || "Tournament captains"
          : "All captains";
    const phone = notificationForm.audience === "specific" ? digits(selectedRegistration?.phone) : "";
    const message = notificationPreview;

    await mutate(
      "sendNotification",
      {
        recipient,
        phone,
        message,
        type: notificationForm.type,
        target: notificationForm.audience === "specific" ? notificationForm.registrationId : notificationForm.tournamentSlug || "all"
      },
      "WhatsApp message logged."
    );

    const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function renderDashboard() {
    const stats = data?.stats || {};
    const cards = [
      ["Tournaments", `${stats.tournaments || 0}`, `${stats.activeTournaments || 0} active / ${stats.completedTournaments || 0} completed / ${stats.upcomingTournaments || 0} upcoming`],
      ["Teams Registered", `${stats.teamsRegistered || stats.registrations || 0}`, "Approved, pending, and rejected registrations"],
      ["Payments", money(stats.paymentsReceived || 0), `${money(stats.paymentsPending || 0)} pending`],
      ["Today Matches", `${stats.matchesPlayedToday || 0} played`, `${stats.matchesRemainingToday || 0} remaining today`],
      ["Top Scorer", stats.topScorer?.name || "Not set", stats.topScorer?.stat || "Add stats from Players"],
      ["Top Wicket Taker", stats.topWicketTaker?.name || "Not set", stats.topWicketTaker?.stat || "Add stats from Players"]
    ];

    return (
      <div className="grid gap-5">
        <SectionTitle eyebrow="Admin" title="Organizer dashboard">
          <div className="flex flex-wrap gap-2">
            <ActionButton href="/admin/tournaments">Add Tournament</ActionButton>
            <ActionButton href="/admin/matches" variant="muted">Add Match</ActionButton>
            <ActionButton href="/admin/notifications" variant="whatsapp">Broadcast WhatsApp</ActionButton>
          </div>
        </SectionTitle>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map(([label, value, helper]) => (
            <Panel key={label}>
              <p className="text-xs font-black uppercase tracking-wide text-white/48">{label}</p>
              <p className="mt-2 text-2xl font-black text-white">{value}</p>
              <p className="mt-2 text-sm font-semibold text-white/54">{helper}</p>
            </Panel>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <Panel>
            <p className="text-xs font-black uppercase tracking-wide text-emerald-200/80">Database</p>
            <h2 className="mt-2 break-words text-xl font-black text-white">{data?.database?.host || "Not configured"}</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-white/58">
              Admin edits, registrations, UPI verification requests, scorecards, points, and action logs are stored centrally when DATABASE_URL is configured.
            </p>
          </Panel>
          <Panel>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-emerald-200/80">Recent actions</p>
                <h2 className="mt-2 text-xl font-black text-white">Latest admin activity</h2>
              </div>
              <Link href="/admin/log" className="text-xs font-black text-emerald-200 underline underline-offset-4">View log</Link>
            </div>
            <div className="mt-4 grid gap-2">
              {(data?.logs || []).slice(0, 5).map((row) => (
                <div key={row.id} className="rounded-md bg-black/18 p-3">
                  <p className="text-sm font-black text-white">{row.message}</p>
                  <p className="mt-1 text-xs font-bold text-white/45">{dateTime(row.createdAt)}</p>
                </div>
              ))}
              {!data?.logs?.length ? <EmptyState>No actions logged yet.</EmptyState> : null}
            </div>
          </Panel>
        </div>
      </div>
    );
  }

  function renderTournaments() {
    return (
      <div className="grid gap-5">
        <SectionTitle eyebrow="Tournaments" title="Manage hosted tournaments" />
        <Panel>
          <form onSubmit={saveTournament} className="grid gap-3 lg:grid-cols-4">
            <Field label="Name" value={tournamentForm.name} onChange={(value) => setTournamentForm((row) => ({ ...row, name: value }))} className="lg:col-span-2" />
            <Field label="Slug" value={tournamentForm.slug} onChange={(value) => setTournamentForm((row) => ({ ...row, slug: value }))} placeholder="auto-generated if empty" />
            <Field label="Sport" value={tournamentForm.sport} onChange={(value) => setTournamentForm((row) => ({ ...row, sport: value }))} options={["Cricket", "Badminton", "Tennis", "Football"]} />
            <Field label="Format" value={tournamentForm.format} onChange={(value) => setTournamentForm((row) => ({ ...row, format: value }))} options={["T10", "T20", "Knockout", "League", "Round Robin"]} />
            <Field label="Start date" type="date" value={tournamentForm.startDate} onChange={(value) => setTournamentForm((row) => ({ ...row, startDate: value }))} />
            <Field label="End/last date" type="date" value={tournamentForm.endDate} onChange={(value) => setTournamentForm((row) => ({ ...row, endDate: value }))} />
            <Field label="City" value={tournamentForm.city} onChange={(value) => setTournamentForm((row) => ({ ...row, city: value }))} />
            <Field label="Venue" value={tournamentForm.venue} onChange={(value) => setTournamentForm((row) => ({ ...row, venue: value }))} className="lg:col-span-2" />
            <Field label="Entry fee" type="number" value={tournamentForm.registrationFee} onChange={(value) => setTournamentForm((row) => ({ ...row, registrationFee: value }))} />
            <Field label="Advance" type="number" value={tournamentForm.advanceAmount} onChange={(value) => setTournamentForm((row) => ({ ...row, advanceAmount: value }))} />
            <Field label="Prize money" value={tournamentForm.prizeMoney} onChange={(value) => setTournamentForm((row) => ({ ...row, prizeMoney: value }))} />
            <Field label="Max teams" type="number" value={tournamentForm.maxTeams} onChange={(value) => setTournamentForm((row) => ({ ...row, maxTeams: value }))} />
            <Field label="Status" value={tournamentForm.status} onChange={(value) => setTournamentForm((row) => ({ ...row, status: value }))} options={tournamentStatuses} />
            <Field label="Description" textarea value={tournamentForm.description} onChange={(value) => setTournamentForm((row) => ({ ...row, description: value }))} className="lg:col-span-4" />
            <div className="flex flex-wrap gap-2 lg:col-span-4">
              <ActionButton type="submit" busy={busy === "saveTournament"}>{tournamentForm.slug ? "Save Tournament" : "Add Tournament"}</ActionButton>
              <ActionButton onClick={() => setTournamentForm(blankTournament)} variant="muted">Clear</ActionButton>
            </div>
          </form>
        </Panel>

        <Panel>
          <div className="table-scroll mobile-scroll">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-white/48">
                <tr>
                  {["Name", "Format", "Dates", "Entry Fee", "Teams", "Status", "Actions"].map((head) => (
                    <th key={head} className="border-b border-white/10 px-3 py-3">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tournaments.map((tournament) => {
                  const registered = registrations.filter((row) => row.tournamentSlug === tournament.slug).length;
                  return (
                    <tr key={tournament.slug} className="align-top text-white/78">
                      <td className="border-b border-white/8 px-3 py-4">
                        <p className="font-black text-white">{tournament.name}</p>
                        <p className="mt-1 text-xs font-bold text-white/42">{tournament.slug}</p>
                      </td>
                      <td className="border-b border-white/8 px-3 py-4">{tournament.sport} / {tournament.format}</td>
                      <td className="border-b border-white/8 px-3 py-4">{tournament.startDate || "TBD"}<br />{tournament.registrationDeadline || tournament.details?.endDate || ""}</td>
                      <td className="border-b border-white/8 px-3 py-4">{money(tournament.registrationFee, tournament.currency)}</td>
                      <td className="border-b border-white/8 px-3 py-4">{registered}</td>
                      <td className="border-b border-white/8 px-3 py-4">
                        <select
                          value={tournament.status || "Upcoming"}
                          onChange={(event) => mutate("setTournamentStatus", { slug: tournament.slug, status: event.target.value }, "Tournament status updated.")}
                          className="rounded-md border border-white/12 bg-white/10 px-2 py-2 text-xs font-black text-white"
                        >
                          {tournamentStatuses.map((status) => <option key={status} className="bg-[#0b1711] text-white">{status}</option>)}
                        </select>
                      </td>
                      <td className="border-b border-white/8 px-3 py-4">
                        <div className="flex flex-wrap gap-2">
                          <ActionButton onClick={() => editTournament(tournament)} variant="muted">Edit</ActionButton>
                          <ActionButton
                            onClick={() =>
                              window.confirm(`Set registration ${tournament.status === "Open" ? "Closed" : "Open"} for ${tournament.name}?`) &&
                              mutate("toggleRegistration", { slug: tournament.slug, currentStatus: tournament.status }, "Registration status updated.")
                            }
                          >
                            {tournament.status === "Open" ? "Close" : "Open"}
                          </ActionButton>
                          <ActionButton onClick={() => deleteTournament(tournament)} variant="danger">Delete</ActionButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    );
  }

  function renderTeams() {
    return (
      <div className="grid gap-5">
        <SectionTitle eyebrow="Teams" title="Registrations and payments">
          <ActionButton onClick={exportRegistrations} busy={busy === "exportRegistrations"}>Export CSV</ActionButton>
        </SectionTitle>

        <Panel>
          <div className="grid gap-3 md:grid-cols-4">
            <Field label="Search" value={teamSearch} onChange={setTeamSearch} placeholder="Team, captain, phone" className="md:col-span-2" />
            <Field
              label="Tournament"
              value={teamFilters.tournament}
              onChange={(value) => setTeamFilters((row) => ({ ...row, tournament: value }))}
              options={[["all", "All tournaments"], ...tournaments.map((tournament) => [tournament.slug, tournament.name])]}
            />
            <Field
              label="Payment"
              value={teamFilters.payment}
              onChange={(value) => setTeamFilters((row) => ({ ...row, payment: value }))}
              options={[["all", "All payments"], ...paymentStatuses]}
            />
            <Field
              label="Approval"
              value={teamFilters.approval}
              onChange={(value) => setTeamFilters((row) => ({ ...row, approval: value }))}
              options={[["all", "All approvals"], ...approvalStatuses]}
            />
          </div>
        </Panel>

        <Panel>
          <div className="table-scroll mobile-scroll">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-white/48">
                <tr>
                  {["Team", "Captain", "Phone", "Tournament", "Players", "Payment", "Registered", "Actions"].map((head) => (
                    <th key={head} className="border-b border-white/10 px-3 py-3">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTeams.map((row) => {
                  const phone = digits(row.phone);
                  const whatsapp = phone
                    ? `https://wa.me/${phone}?text=${encodeURIComponent(`Hi ${row.playerName || "Captain"}, this is Sports Arena Tournaments about ${row.tournamentName}.`)}`
                    : "";
                  return (
                    <tr key={row.id} className="align-top text-white/76">
                      <td className="border-b border-white/8 px-3 py-4">
                        <button onClick={() => setExpandedTeam(expandedTeam === row.id ? "" : row.id)} className="text-left font-black text-white underline decoration-white/20 underline-offset-4">
                          {row.teamName || row.playerName || "Unnamed team"}
                        </button>
                        <p className="mt-1 text-xs font-bold text-white/42">{row.approvalStatus || "Pending"}</p>
                        {expandedTeam === row.id ? (
                          <div className="mt-3 rounded-md bg-black/22 p-3">
                            <p className="text-xs font-black uppercase text-white/45">Squad</p>
                            <ul className="mt-2 grid gap-1 text-xs font-semibold text-white/70">
                              {(row.players || []).length ? row.players.map((player, index) => <li key={`${row.id}-${index}`}>{index + 1}. {playerLabel(player)}</li>) : <li>No player list saved.</li>}
                            </ul>
                          </div>
                        ) : null}
                      </td>
                      <td className="border-b border-white/8 px-3 py-4">{row.playerName}</td>
                      <td className="border-b border-white/8 px-3 py-4">{row.phone}</td>
                      <td className="border-b border-white/8 px-3 py-4">{row.tournamentName}</td>
                      <td className="border-b border-white/8 px-3 py-4">{(row.players || []).length || 1}</td>
                      <td className="border-b border-white/8 px-3 py-4">
                        <span className={`rounded-md px-2 py-1 text-xs font-black ring-1 ${statusBadgeClass(row.paymentStatus || row.status)}`}>{row.paymentStatus || row.status}</span>
                        <p className="mt-2 text-xs font-bold text-white/50">{money(row.paidAmount || 0)} paid</p>
                      </td>
                      <td className="border-b border-white/8 px-3 py-4">{dateTime(row.createdAt)}</td>
                      <td className="border-b border-white/8 px-3 py-4">
                        <div className="flex flex-wrap gap-2">
                          <ActionButton onClick={() => editTeam(row)} variant="muted">Edit</ActionButton>
                          <ActionButton onClick={() => markPayment(row)}>Payment</ActionButton>
                          <ActionButton onClick={() => mutate("updateRegistration", { id: row.id, approvalStatus: "Approved" }, "Registration approved.")} variant="muted">Approve</ActionButton>
                          <ActionButton onClick={() => mutate("updateRegistration", { id: row.id, approvalStatus: "Rejected" }, "Registration rejected.")} variant="muted">Reject</ActionButton>
                          {whatsapp ? <ActionButton href={whatsapp} target="_blank" variant="whatsapp">WhatsApp</ActionButton> : null}
                          <ActionButton onClick={() => deleteTeam(row)} variant="danger">Delete</ActionButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!filteredTeams.length ? <div className="mt-4"><EmptyState>No matching registrations.</EmptyState></div> : null}
        </Panel>
      </div>
    );
  }

  function renderMatches() {
    return (
      <div className="grid gap-5">
        <SectionTitle eyebrow="Fixtures" title="Matches, results, and live score" />
        <Panel>
          <form onSubmit={saveMatch} className="grid gap-3 lg:grid-cols-4">
            <Field
              label="Tournament"
              value={matchForm.tournamentSlug}
              onChange={(value) => setMatchForm((row) => ({ ...row, tournamentSlug: value }))}
              options={scoreboard.map((event) => [event.tournamentSlug, event.tournamentName])}
              className="lg:col-span-2"
            />
            <Field label="Match No" value={matchForm.matchId} onChange={(value) => setMatchForm((row) => ({ ...row, matchId: value }))} placeholder="auto if empty" />
            <Field label="Status" value={matchForm.status} onChange={(value) => setMatchForm((row) => ({ ...row, status: value }))} options={matchStatuses} />
            <Field label="Team A" value={matchForm.team1} onChange={(value) => setMatchForm((row) => ({ ...row, team1: value }))} options={teamOptions} />
            <Field label="Team B" value={matchForm.team2} onChange={(value) => setMatchForm((row) => ({ ...row, team2: value }))} options={teamOptions} />
            <Field label="Date" type="date" value={matchForm.date} onChange={(value) => setMatchForm((row) => ({ ...row, date: value }))} />
            <Field label="Time" value={matchForm.time} onChange={(value) => setMatchForm((row) => ({ ...row, time: value }))} placeholder="6:00 AM" />
            <Field label="Venue" value={matchForm.venue} onChange={(value) => setMatchForm((row) => ({ ...row, venue: value }))} className="lg:col-span-2" />
            <Field label="Team A score" value={matchForm.team1Score} onChange={(value) => setMatchForm((row) => ({ ...row, team1Score: value }))} placeholder="98/4 (10 ov)" />
            <Field label="Team B score" value={matchForm.team2Score} onChange={(value) => setMatchForm((row) => ({ ...row, team2Score: value }))} placeholder="84/7 (10 ov)" />
            <Field label="Winner / result text" value={matchForm.result} onChange={(value) => setMatchForm((row) => ({ ...row, result: value }))} className="lg:col-span-2" />
            <Field label="Man of the match" value={matchForm.playerOfMatch} onChange={(value) => setMatchForm((row) => ({ ...row, playerOfMatch: value }))} className="lg:col-span-2" />
            <Field label="Match summary" textarea value={matchForm.highlights} onChange={(value) => setMatchForm((row) => ({ ...row, highlights: value }))} className="lg:col-span-4" placeholder="One highlight per line" />
            <div className="flex flex-wrap gap-2 lg:col-span-4">
              <ActionButton type="submit" busy={busy === "saveMatch"}>{matchForm.matchId ? "Save Fixture" : "Add Fixture"}</ActionButton>
              <ActionButton onClick={() => setMatchForm({ ...blankMatch, tournamentSlug: matchForm.tournamentSlug })} variant="muted">Clear</ActionButton>
            </div>
          </form>
        </Panel>

        <Panel>
          <div className="table-scroll mobile-scroll">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-white/48">
                <tr>
                  {["Tournament", "Match", "Teams", "Date", "Time", "Venue", "Status", "Result", "Actions"].map((head) => (
                    <th key={head} className="border-b border-white/10 px-3 py-3">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {flatMatches.map((row) => (
                  <tr key={`${row.tournamentSlug}-${row.id}`} className="align-top text-white/76">
                    <td className="border-b border-white/8 px-3 py-4">{row.tournamentName}</td>
                    <td className="border-b border-white/8 px-3 py-4 font-black text-white">{row.id}</td>
                    <td className="border-b border-white/8 px-3 py-4">{row.team1} vs {row.team2}</td>
                    <td className="border-b border-white/8 px-3 py-4">{row.date}</td>
                    <td className="border-b border-white/8 px-3 py-4">{row.time}</td>
                    <td className="border-b border-white/8 px-3 py-4">{row.venue}</td>
                    <td className="border-b border-white/8 px-3 py-4"><span className={`rounded-md px-2 py-1 text-xs font-black ring-1 ${statusBadgeClass(row.status)}`}>{row.status}</span></td>
                    <td className="border-b border-white/8 px-3 py-4">{row.result || "Pending"}</td>
                    <td className="border-b border-white/8 px-3 py-4">
                      <div className="flex flex-wrap gap-2">
                        <ActionButton onClick={() => fillMatchForm(row)} variant="muted">Edit</ActionButton>
                        <ActionButton onClick={() => quickLive(row)}>Live</ActionButton>
                        <ActionButton onClick={() => fillMatchForm({ ...row, status: "completed" })} variant="muted">Result</ActionButton>
                        <ActionButton onClick={() => cancelMatch(row)} variant="muted">Cancel</ActionButton>
                        <ActionButton onClick={() => deleteMatch(row)} variant="danger">Delete</ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!flatMatches.length ? <div className="mt-4"><EmptyState>No fixtures yet.</EmptyState></div> : null}
        </Panel>
      </div>
    );
  }

  function renderPoints() {
    return (
      <div className="grid gap-5">
        <SectionTitle eyebrow="Points" title="Editable standings">
          <div className="flex flex-wrap gap-2">
            <ActionButton onClick={savePoints} busy={busy === "savePoints"}>Save Changes</ActionButton>
            <ActionButton onClick={() => mutate("recalculateStandings", { tournamentSlug: pointsTournament }, "Standings recalculated.")} variant="muted">Recalculate</ActionButton>
          </div>
        </SectionTitle>

        <Panel>
          <Field
            label="Tournament"
            value={pointsTournament}
            onChange={setPointsTournament}
            options={scoreboard.map((event) => [event.tournamentSlug, event.tournamentName])}
            className="max-w-xl"
          />
        </Panel>

        <Panel>
          <div className="table-scroll mobile-scroll">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-white/48">
                <tr>
                  {["Team", "Played", "Won", "Lost", "NRR", "Points"].map((head) => (
                    <th key={head} className="border-b border-white/10 px-3 py-3">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pointsDraft.map((row, index) => (
                  <tr key={row.team} className="text-white/76">
                    <td className="border-b border-white/8 px-3 py-3 font-black text-white">{row.team}</td>
                    {["played", "won", "lost", "nrr", "points"].map((key) => (
                      <td key={key} className="border-b border-white/8 px-3 py-3">
                        <input
                          value={row[key] ?? ""}
                          onChange={(event) =>
                            setPointsDraft((rows) =>
                              rows.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: key === "nrr" ? event.target.value : Number(event.target.value || 0) } : item))
                            )
                          }
                          className="w-full rounded-md border border-white/12 bg-white/10 px-2 py-2 text-sm font-bold text-white outline-none"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!pointsDraft.length ? <div className="mt-4"><EmptyState>No teams are available for this points table.</EmptyState></div> : null}
        </Panel>
      </div>
    );
  }

  function renderPlayers() {
    return (
      <div className="grid gap-5">
        <SectionTitle eyebrow="Players" title="Player stats and leaderboard data" />
        <Panel>
          <form onSubmit={savePlayer} className="grid gap-3 lg:grid-cols-4">
            <Field label="Player name" value={playerForm.playerName} onChange={(value) => setPlayerForm((row) => ({ ...row, playerName: value }))} className="lg:col-span-2" />
            <Field label="Team" value={playerForm.team} onChange={(value) => setPlayerForm((row) => ({ ...row, team: value }))} />
            <Field label="Tournament" value={playerForm.tournamentSlug} onChange={(value) => setPlayerForm((row) => ({ ...row, tournamentSlug: value }))} options={[["", "All tournaments"], ...scoreboard.map((event) => [event.tournamentSlug, event.tournamentName])]} />
            <Field label="Role" value={playerForm.role} onChange={(value) => setPlayerForm((row) => ({ ...row, role: value }))} options={["Batsman", "Bowler", "All-rounder", "WK"]} />
            <Field label="Runs" type="number" value={playerForm.runs} onChange={(value) => setPlayerForm((row) => ({ ...row, runs: value }))} />
            <Field label="Wickets" type="number" value={playerForm.wickets} onChange={(value) => setPlayerForm((row) => ({ ...row, wickets: value }))} />
            <Field label="Catches" type="number" value={playerForm.catches} onChange={(value) => setPlayerForm((row) => ({ ...row, catches: value }))} />
            <Field label="Matches" type="number" value={playerForm.matchesPlayed} onChange={(value) => setPlayerForm((row) => ({ ...row, matchesPlayed: value }))} />
            <div className="flex flex-wrap gap-2 lg:col-span-4">
              <ActionButton type="submit" busy={busy === "savePlayer"}>{playerForm.id ? "Save Player" : "Add Player"}</ActionButton>
              <ActionButton onClick={() => setPlayerForm(blankPlayer)} variant="muted">Clear</ActionButton>
            </div>
          </form>
        </Panel>
        <Panel>
          <div className="table-scroll mobile-scroll">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-white/48">
                <tr>
                  {["Player", "Team", "Tournament", "Role", "Runs", "Wickets", "Catches", "Matches", "Actions"].map((head) => (
                    <th key={head} className="border-b border-white/10 px-3 py-3">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.players || []).map((row) => (
                  <tr key={row.id} className="text-white/76">
                    <td className="border-b border-white/8 px-3 py-4 font-black text-white">{row.playerName}</td>
                    <td className="border-b border-white/8 px-3 py-4">{row.team}</td>
                    <td className="border-b border-white/8 px-3 py-4">{row.tournamentSlug}</td>
                    <td className="border-b border-white/8 px-3 py-4">{row.role}</td>
                    <td className="border-b border-white/8 px-3 py-4">{row.runs}</td>
                    <td className="border-b border-white/8 px-3 py-4">{row.wickets}</td>
                    <td className="border-b border-white/8 px-3 py-4">{row.catches}</td>
                    <td className="border-b border-white/8 px-3 py-4">{row.matchesPlayed}</td>
                    <td className="border-b border-white/8 px-3 py-4">
                      <div className="flex flex-wrap gap-2">
                        <ActionButton onClick={() => setPlayerForm(row)} variant="muted">Edit</ActionButton>
                        <ActionButton onClick={() => window.confirm(`Delete ${row.playerName}?`) && mutate("deletePlayer", { id: row.id, playerName: row.playerName }, "Player deleted.")} variant="danger">Delete</ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    );
  }

  function renderContent() {
    const content = contentForm || {};
    const gallery = (content.gallery || []).map(normalizeGalleryItem);

    return (
      <div className="grid gap-5">
        <SectionTitle eyebrow="Content" title="Homepage, gallery, and contact details" />
        <Panel>
          <form onSubmit={saveContent} className="grid gap-4">
            <div className="grid gap-3 lg:grid-cols-3">
              <Field label="Organizer phone" value={content.contact?.phone || ""} onChange={(value) => updateContent(["contact", "phone"], value)} />
              <Field label="Organizer email" value={content.contact?.email || ""} onChange={(value) => updateContent(["contact", "email"], value)} />
              <Field label="WhatsApp number" value={content.contact?.whatsapp || ""} onChange={(value) => updateContent(["contact", "whatsapp"], value)} />
              <Field label="Instagram URL" value={content.socials?.instagram || ""} onChange={(value) => updateContent(["socials", "instagram"], value)} />
              <Field label="Facebook URL" value={content.socials?.facebook || ""} onChange={(value) => updateContent(["socials", "facebook"], value)} />
              <Field label="Announcement published" value={content.announcementPublished ? "yes" : "no"} onChange={(value) => updateContent(["announcementPublished"], value === "yes")} options={[["yes", "Published"], ["no", "Hidden"]]} />
            </div>
            <Field label="Homepage announcement" textarea value={content.announcement || ""} onChange={(value) => updateContent(["announcement"], value)} />

            <div className="rounded-lg border border-white/10 bg-black/14 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-white/48">Gallery URLs</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                <input value={galleryUrl} onChange={(event) => setGalleryUrl(event.target.value)} placeholder="https://..." className="rounded-md border border-white/12 bg-white/10 px-3 py-2.5 text-sm font-semibold text-white outline-none" />
                <ActionButton onClick={addGalleryUrl}>Add Image</ActionButton>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {gallery.map((item, index) => (
                  <div key={`${item.url}-${index}`} className="rounded-md bg-white/8 p-3">
                    <p className="break-all text-xs font-bold text-white/70">{item.url}</p>
                    <input
                      value={item.caption}
                      onChange={(event) =>
                        updateContent(
                          ["gallery"],
                          gallery.map((galleryItem, galleryIndex) => (galleryIndex === index ? { ...galleryItem, caption: event.target.value } : galleryItem))
                        )
                      }
                      placeholder="Caption"
                      className="mt-2 w-full rounded-md border border-white/12 bg-white/10 px-3 py-2 text-sm font-semibold text-white outline-none"
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      <ActionButton
                        onClick={() => updateContent(["gallery"], gallery.filter((_, galleryIndex) => galleryIndex !== index))}
                        variant="danger"
                      >
                        Delete
                      </ActionButton>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <ActionButton type="submit" busy={busy === "saveContent"}>Save Content</ActionButton>
          </form>
        </Panel>
      </div>
    );
  }

  function renderNotifications() {
    const selectedRegistration = registrations.find((row) => row.id === notificationForm.registrationId);
    return (
      <div className="grid gap-5">
        <SectionTitle eyebrow="Notifications" title="WhatsApp message center" />
        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <Panel>
            <div className="grid gap-3">
              <Field
                label="Send to"
                value={notificationForm.audience}
                onChange={(value) => setNotificationForm((row) => ({ ...row, audience: value }))}
                options={[["specific", "Specific team"], ["tournament", "All teams in tournament"], ["all", "All captains"]]}
              />
              {notificationForm.audience === "specific" ? (
                <Field
                  label="Team"
                  value={notificationForm.registrationId}
                  onChange={(value) => setNotificationForm((row) => ({ ...row, registrationId: value }))}
                  options={[["", "Select team"], ...registrations.map((row) => [row.id, `${row.teamName || row.playerName} - ${row.phone || "no phone"}`])]}
                />
              ) : null}
              {notificationForm.audience !== "all" ? (
                <Field
                  label="Tournament"
                  value={notificationForm.tournamentSlug}
                  onChange={(value) => setNotificationForm((row) => ({ ...row, tournamentSlug: value }))}
                  options={scoreboard.map((event) => [event.tournamentSlug, event.tournamentName])}
                />
              ) : null}
              <Field
                label="Message type"
                value={notificationForm.type}
                onChange={(value) => setNotificationForm((row) => ({ ...row, type: value }))}
                options={[["match", "Match reminder"], ["result", "Result announcement"], ["custom", "Custom message"]]}
              />
              <Field label="Custom message" textarea value={notificationForm.message} onChange={(value) => setNotificationForm((row) => ({ ...row, message: value }))} />
              <ActionButton onClick={sendNotification} busy={busy === "sendNotification"} variant="whatsapp">Preview, Log, Open WhatsApp</ActionButton>
              {notificationForm.audience === "specific" && !digits(selectedRegistration?.phone) ? (
                <p className="rounded-md bg-red-400/12 px-3 py-2 text-sm font-bold text-red-100">Selected team has no phone number.</p>
              ) : null}
            </div>
          </Panel>
          <Panel>
            <p className="text-xs font-black uppercase tracking-wide text-emerald-200/80">Preview</p>
            <div className="mt-3 rounded-lg bg-black/24 p-4 text-sm font-semibold leading-6 text-white/78">{notificationPreview}</div>
            <p className="mt-5 text-xs font-black uppercase tracking-wide text-white/48">Notification log</p>
            <div className="mt-3 grid max-h-[440px] gap-2 overflow-y-auto pr-1">
              {(data?.notifications || []).map((row) => (
                <div key={row.id} className="rounded-md bg-white/8 p-3">
                  <p className="text-sm font-black text-white">{row.recipient}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-white/58">{row.message}</p>
                  <p className="mt-2 text-[11px] font-bold uppercase text-white/38">{dateTime(row.createdAt)}</p>
                </div>
              ))}
              {!data?.notifications?.length ? <EmptyState>No notifications logged yet.</EmptyState> : null}
            </div>
          </Panel>
        </div>
      </div>
    );
  }

  function renderLog() {
    return (
      <div className="grid gap-5">
        <SectionTitle eyebrow="Log" title="Every admin action" />
        <Panel>
          <div className="grid gap-3">
            {(data?.logs || []).map((row) => (
              <div key={row.id} className="rounded-lg border border-white/8 bg-black/18 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-black text-white">{row.message}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-wide text-emerald-200/64">{row.action}</p>
                  </div>
                  <p className="text-xs font-bold text-white/42">{dateTime(row.createdAt)}</p>
                </div>
              </div>
            ))}
            {!data?.logs?.length ? <EmptyState>No actions logged yet.</EmptyState> : null}
          </div>
        </Panel>
      </div>
    );
  }

  function renderSection() {
    if (loading) {
      return <Panel><p className="text-sm font-black text-white">Loading protected admin console...</p></Panel>;
    }

    if (!data) {
      return <Panel><p className="text-sm font-black text-white">Could not load admin data.</p></Panel>;
    }

    switch (activeSection) {
      case "tournaments":
        return renderTournaments();
      case "teams":
        return renderTeams();
      case "matches":
        return renderMatches();
      case "points":
        return renderPoints();
      case "players":
        return renderPlayers();
      case "content":
        return renderContent();
      case "notifications":
        return renderNotifications();
      case "log":
        return renderLog();
      default:
        return renderDashboard();
    }
  }

  return (
    <main className="bg-[#07120d] px-3 py-5 text-white sm:px-5 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-col gap-3 rounded-lg border border-white/10 bg-white/[0.075] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-emerald-200/80">Sports Arena Admin</p>
            <h1 className="mt-1 text-xl font-black text-white sm:text-2xl">Protected organizer console</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <ActionButton href="/" variant="muted">Public Site</ActionButton>
            <ActionButton onClick={load} variant="muted" busy={loading}>Refresh</ActionButton>
            <ActionButton onClick={logout} variant="danger">Logout</ActionButton>
          </div>
        </div>

        {toast ? <div className="mb-5 rounded-lg border border-emerald-200/16 bg-emerald-300/12 px-4 py-3 text-sm font-black text-emerald-50">{toast}</div> : null}

        <div className="grid gap-5 lg:grid-cols-[245px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-32 lg:self-start">
            <nav className="mobile-scroll flex gap-2 overflow-x-auto rounded-lg border border-white/10 bg-white/[0.075] p-2 lg:grid lg:overflow-visible">
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`tap-target shrink-0 rounded-md px-3 py-2.5 text-sm font-black transition ${
                    activeSection === item.id ? "bg-emerald-300 text-[#07120d]" : "text-white/68 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
          <div className="min-w-0">{renderSection()}</div>
        </div>
      </div>
    </main>
  );
}
