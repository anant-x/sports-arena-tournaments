import Image from "next/image";
import Link from "next/link";
import AccountNav from "./client/AccountNav";
import { platform } from "../lib/tournament";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/tournaments", label: "Tournaments" },
  { href: "/register", label: "Register" },
  { href: "/teams", label: "Teams" },
  { href: "/fixtures", label: "Fixtures" },
  { href: "/live", label: "Live Scores" },
  { href: "/payment", label: "Payment" },
  { href: "/gallery", label: "Gallery" },
  { href: "/profile", label: "Profile" }
];

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-pitch/95 text-white backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-3 py-2 sm:gap-3 sm:px-6 sm:py-3 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="logo-breathe relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-black/25 shadow-sm ring-1 ring-white/12 sm:h-14 sm:w-14">
              <Image
                src={platform.logo || "/assets/sports-arena-logo-v2.png"}
                alt={`${platform.name} logo`}
                fill
                priority
                sizes="(min-width: 640px) 56px, 44px"
                className="object-cover"
              />
            </span>
            <span className="min-w-0">
              <span className="block max-w-[13rem] truncate text-sm font-black uppercase tracking-wide sm:max-w-none sm:text-lg">{platform.name}</span>
              <span className="block truncate text-[11px] font-bold uppercase tracking-wide text-crease sm:text-xs">Play · Compete · Win</span>
            </span>
          </Link>
          <AccountNav />
        </div>
        <nav aria-label="Primary navigation" className="mobile-scroll -mx-3 flex snap-x gap-1 overflow-x-auto px-3 pb-1 text-sm font-semibold text-white/78 sm:-mx-1 sm:px-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="nav-pill tap-target flex shrink-0 snap-start items-center rounded-md px-3 py-2 transition hover:bg-white/10 hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
