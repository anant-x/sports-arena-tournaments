"use client";

import { useEffect, useState } from "react";

export default function ManagedAnnouncement() {
  const [content, setContent] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const response = await fetch("/api/site-content", { cache: "no-store" });
        const payload = await response.json();
        if (mounted && response.ok) {
          setContent(payload.content || null);
        }
      } catch {
        setContent(null);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (!content?.announcementPublished || !content?.announcement) {
    return null;
  }

  return (
    <section className="bg-crease px-4 py-4 text-pitch sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-black uppercase tracking-wide">Organizer Announcement</p>
        <p className="mt-1 text-sm font-black leading-6 sm:text-base">{content.announcement}</p>
      </div>
    </section>
  );
}
