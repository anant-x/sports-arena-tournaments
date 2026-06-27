"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function AccountNav() {
  const [account, setAccount] = useState({ loaded: false, user: null });

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        const data = await response.json();
        if (mounted) {
          setAccount({ loaded: true, user: response.ok ? data.user : null });
        }
      } catch {
        if (mounted) {
          setAccount({ loaded: true, user: null });
        }
      }
    }

    loadSession();
    window.addEventListener("tth:auth-updated", loadSession);
    return () => {
      mounted = false;
      window.removeEventListener("tth:auth-updated", loadSession);
    };
  }, []);

  const href = account.user ? "/profile" : "/login";
  const label = account.user ? "Profile" : "Login";

  return (
    <Link
      href={href}
      className="shine-button tap-target inline-flex items-center rounded-md bg-crease px-3 py-2 text-sm font-bold text-pitch shadow-sm transition hover:bg-white sm:px-4"
      aria-label={account.loaded && account.user ? `Open ${account.user.name || "profile"}` : "Login"}
    >
      {label}
    </Link>
  );
}
