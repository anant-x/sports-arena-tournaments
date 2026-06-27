import Image from "next/image";
import Link from "next/link";
import { formatCurrency, isRegistrationOpen } from "../lib/tournament";

export default function TournamentCard({ tournament, compact = false }) {
  const slotsLeft = Math.max(tournament.slots - tournament.registered, 0);
  const canRegister = isRegistrationOpen(tournament);

  return (
    <article className="motion-card overflow-hidden rounded-lg border border-graphite/10 bg-white shadow-sm">
      <Link href={`/tournaments/${tournament.slug}`} className="block">
        <div className={compact ? "relative aspect-[16/9]" : "relative aspect-[4/3]"}>
          <Image
            src={tournament.bannerImage}
            alt={`${tournament.name} banner`}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="image-zoom object-cover"
          />
          <div className="absolute left-3 top-3 rounded-md bg-pitch px-3 py-1 text-xs font-black uppercase text-white">
            {tournament.sport}
          </div>
          <div className="absolute right-3 top-3 rounded-md bg-crease px-3 py-1 text-xs font-black uppercase text-pitch">
            {tournament.status}
          </div>
        </div>
        <div className="p-5">
          <p className="text-xs font-black uppercase text-turf">{tournament.format} · {tournament.city}</p>
          <h2 className="mt-2 text-xl font-black leading-tight text-pitch">{tournament.name}</h2>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-graphite/70">{tournament.description}</p>
          <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-graphite/10 pt-4 text-sm">
            <div>
              <dt className="font-bold uppercase text-graphite/45">Date</dt>
              <dd className="mt-1 font-black text-pitch">{tournament.dates}</dd>
            </div>
            <div>
              <dt className="font-bold uppercase text-graphite/45">Advance</dt>
              <dd className="mt-1 font-black text-pitch">{formatCurrency(tournament.advanceAmount, tournament.currency)}</dd>
            </div>
            <div>
              <dt className="font-bold uppercase text-graphite/45">Left</dt>
              <dd className="mt-1 font-black text-pitch">{slotsLeft}</dd>
            </div>
          </dl>
        </div>
      </Link>
      <div className="flex gap-2 border-t border-graphite/10 p-4">
        {canRegister ? (
          <>
            <Link href={`/register/${tournament.slug}`} className="shine-button flex-1 rounded-md bg-pitch px-4 py-2 text-center text-sm font-black text-white transition hover:bg-scoreboard">
              Register
            </Link>
            <Link href={`/payment?slug=${tournament.slug}`} className="shine-button rounded-md border border-graphite/15 px-4 py-2 text-sm font-black text-pitch transition hover:bg-floodlight">
              Pay
            </Link>
          </>
        ) : (
          <Link href={`/tournaments/${tournament.slug}`} className="shine-button flex-1 rounded-md bg-graphite px-4 py-2 text-center text-sm font-black text-white transition hover:bg-scoreboard">
            Registration Closed
          </Link>
        )}
      </div>
    </article>
  );
}
