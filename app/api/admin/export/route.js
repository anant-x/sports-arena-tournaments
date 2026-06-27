import { requireAdmin } from "../../../../lib/adminAuth";
import { dashboardSummary } from "../../../../lib/platformRepository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const tableColumns = {
  registrations: [
    "id",
    "tournamentName",
    "sport",
    "playerName",
    "email",
    "phone",
    "city",
    "category",
    "teamName",
    "players",
    "fee",
    "advanceAmount",
    "currency",
    "status",
    "createdAt"
  ],
  users: ["id", "name", "email", "phone", "city", "primarySport", "createdAt"],
  payments: [
    "id",
    "registrationId",
    "tournamentSlug",
    "amount",
    "currency",
    "provider",
    "providerOrderId",
    "providerPaymentId",
    "status",
    "mode",
    "createdAt"
  ],
  tournaments: ["slug", "name", "sport", "format", "city", "venue", "startDate", "registrationFee", "advanceAmount", "status"]
};

function cell(value) {
  if (Array.isArray(value)) {
    return `"${value.join(" | ").replaceAll('"', '""')}"`;
  }

  if (value && typeof value === "object") {
    return `"${JSON.stringify(value).replaceAll('"', '""')}"`;
  }

  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function toCsv(rows, columns) {
  return [columns.join(","), ...rows.map((row) => columns.map((column) => cell(row[column])).join(","))].join("\n");
}

export async function GET(request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) {
    return unauthorized;
  }

  const { searchParams } = new URL(request.url);
  const table = searchParams.get("table") || "registrations";
  const columns = tableColumns[table] || tableColumns.registrations;
  const summary = await dashboardSummary();
  const rows = summary[table] || [];
  const csv = toCsv(rows, columns);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tth-${table}.csv"`
    }
  });
}
