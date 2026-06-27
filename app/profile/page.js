import ProfilePanel from "../../components/client/ProfilePanel";
import SectionHeader from "../../components/SectionHeader";
import { tournaments } from "../../lib/tournament";

export const metadata = {
  title: "Profile"
};

export default function ProfilePage() {
  return (
    <main className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Dashboard"
          title="Your saved details"
          description="Profile and registrations are synced with the tournament database, with a browser copy kept for quick access."
        />
        <div className="mt-8">
          <ProfilePanel tournaments={tournaments} />
        </div>
      </div>
    </main>
  );
}
