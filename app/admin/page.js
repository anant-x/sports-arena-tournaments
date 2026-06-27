import AdminDashboard from "../../components/client/AdminDashboard";
import SectionHeader from "../../components/SectionHeader";

export const metadata = {
  title: "Admin",
  robots: {
    index: false,
    follow: false
  }
};

export default function AdminPage() {
  return (
    <main className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Admin"
          title="Protected organizer console"
          description="Access registration data, payment records, CSV exports, scorecard updates, and points table controls."
        />
        <div className="mt-8">
          <AdminDashboard />
        </div>
      </div>
    </main>
  );
}
