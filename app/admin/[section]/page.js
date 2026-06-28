import { notFound } from "next/navigation";
import AdminConsole from "../../../components/client/AdminConsole";

const sections = ["tournaments", "teams", "matches", "points", "players", "content", "notifications", "log"];

export function generateStaticParams() {
  return sections.map((section) => ({ section }));
}

export function generateMetadata({ params }) {
  const label = params.section
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return {
    title: `Admin ${label}`,
    robots: {
      index: false,
      follow: false
    }
  };
}

export default function AdminSectionPage({ params }) {
  if (!sections.includes(params.section)) {
    notFound();
  }

  return <AdminConsole section={params.section} />;
}
