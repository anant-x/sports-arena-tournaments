import Image from "next/image";
import Link from "next/link";
import { contactInfo } from "../lib/siteInfo";
import { platform, tournaments } from "../lib/tournament";

export default function SiteFooter() {
  const contact = contactInfo();

  return (
    <footer className="bg-graphite text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 sm:py-10 md:grid-cols-[1.35fr_0.65fr_0.7fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="logo-breathe relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-black/25 ring-1 ring-white/10 sm:h-24 sm:w-24">
              <Image src={platform.logo || "/assets/sports-arena-logo-v2.png"} alt={`${platform.name} logo`} fill sizes="(min-width: 640px) 96px, 64px" className="object-cover" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-black uppercase tracking-wide sm:text-xl">{platform.name}</p>
              <p className="mt-1 text-sm font-black uppercase tracking-wide text-crease">Play · Compete · Win</p>
            </div>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">{platform.description}</p>
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-crease">Explore</p>
          <div className="mt-3 grid gap-2 text-sm text-white/72">
            <Link href="/tournaments">{tournaments.length} Tournaments</Link>
            <Link href="/register">Register Team</Link>
            <Link href="/payment">Advance Payment</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/refund-policy">Refund Policy</Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-crease">Organizer</p>
          <div className="mt-3 grid gap-2 text-sm text-white/72">
            <a href={`tel:${contact.phone}`} className="transition hover:text-crease">{contact.phone}</a>
            <a href={`mailto:${contact.email}`} className="transition hover:text-crease">{contact.email}</a>
            {contact.instagramUrl ? (
              <a href={contact.instagramUrl} target="_blank" rel="noreferrer" className="transition hover:text-crease">
                {contact.social}
              </a>
            ) : (
              <span>{contact.social}</span>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
