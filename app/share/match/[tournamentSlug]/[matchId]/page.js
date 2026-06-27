import Link from "next/link";
import { notFound } from "next/navigation";
import SectionHeader from "../../../../../components/SectionHeader";
import { displayTeamName, findMatchForShare, matchShareText, shareCardImageUrl, shareMatchUrl } from "../../../../../lib/socialFeatures";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }) {
  const item = findMatchForShare(params.tournamentSlug, params.matchId);

  if (!item) {
    return {
      title: "Match Share Card"
    };
  }

  const { tournament, match } = item;
  const title = `${displayTeamName(match.team1, tournament)} vs ${displayTeamName(match.team2, tournament)} | ${tournament.name}`;
  const image = shareCardImageUrl(tournament.slug, match.id);

  return {
    title,
    description: match.result || matchShareText(match, tournament),
    openGraph: {
      title,
      description: match.result || matchShareText(match, tournament),
      images: [{ url: image, width: 1080, height: 1080 }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: match.result || matchShareText(match, tournament),
      images: [image]
    }
  };
}

export default function ShareMatchPage({ params }) {
  const item = findMatchForShare(params.tournamentSlug, params.matchId);

  if (!item) {
    notFound();
  }

  const { tournament, match } = item;
  const image = shareCardImageUrl(tournament.slug, match.id);
  const shareUrl = shareMatchUrl(tournament.slug, match.id);
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${matchShareText(match, tournament)}\n${shareUrl}`)}`;

  return (
    <main className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <SectionHeader
          eyebrow="Share Card"
          title={`${displayTeamName(match.team1, tournament)} vs ${displayTeamName(match.team2, tournament)}`}
          description="A WhatsApp-ready result card generated from the match score, venue, and tournament details."
        />

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.65fr]">
          <div className="motion-card overflow-hidden rounded-lg border border-graphite/10 bg-white p-3 shadow-sm">
            <img src={image} alt={`${tournament.name} match share card`} className="aspect-square w-full rounded-md object-cover" />
          </div>

          <aside className="motion-card rounded-lg border border-graphite/10 bg-white p-5 shadow-sm">
            <p className="text-sm font-black uppercase text-turf">{tournament.name}</p>
            <h2 className="mt-2 text-2xl font-black text-pitch">{match.result || "Match update"}</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-graphite/70">{matchShareText(match, tournament)}</p>
            <div className="mt-6 grid gap-3">
              <a href={whatsapp} target="_blank" rel="noreferrer" className="shine-button tap-target flex items-center justify-center rounded-md bg-[#25D366] px-5 py-3 text-sm font-black text-pitch">
                Share on WhatsApp
              </a>
              <a href={image} target="_blank" rel="noreferrer" className="tap-target flex items-center justify-center rounded-md border border-graphite/15 px-5 py-3 text-sm font-black text-pitch">
                Open Image
              </a>
              <Link href="/results" className="tap-target flex items-center justify-center rounded-md bg-pitch px-5 py-3 text-sm font-black text-white">
                All Results
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
