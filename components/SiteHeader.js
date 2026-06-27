import Image from "next/image";
import Link from "next/link";
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
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="logo-breathe relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-black/25 shadow-sm ring-1 ring-white/12">
              <Image
                src={platform.logo || "/assets/sports-arena-logo-v2.png"}
                alt={`${platform.name} logo`}
                fill
                priority
                sizes="56px"
                className="object-cover"
              />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-base font-black uppercase tracking-wide sm:text-lg">{platform.name}</span>
              <span className="block text-xs font-bold uppercase tracking-wide text-crease">Play · Compete · Win</span>
            </span>
          </Link>
          <Link
            href="/login"
            className="shine-button hidden rounded-md bg-crease px-4 py-2 text-sm font-bold text-pitch shadow-sm transition hover:bg-white sm:inline-flex"
          >
            Login
          </Link>
        </div>
        <nav className="-mx-1 flex gap-1 overflow-x-auto pb-1 text-sm font-semibold text-white/78">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="nav-pill shrink-0 rounded-md px-3 py-2 transition hover:bg-white/10 hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
