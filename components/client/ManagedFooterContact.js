"use client";

import { useEffect, useMemo, useState } from "react";

function digits(value) {
  return String(value || "").replace(/\D/g, "");
}

function instagramHandle(value) {
  return String(value || "")
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/\/.*$/, "");
}

function mergeContact(fallback, content) {
  const phone = content?.contact?.phone || fallback.phone;
  const email = content?.contact?.email || fallback.email;
  const whatsappNumber = digits(content?.contact?.whatsapp || phone);
  const instagramUrl = content?.socials?.instagram || fallback.instagramUrl;
  const handle = instagramHandle(instagramUrl || fallback.social);

  return {
    ...fallback,
    phone,
    email,
    whatsappNumber,
    whatsappUrl: whatsappNumber ? `https://wa.me/${whatsappNumber}` : "",
    instagramUrl,
    social: handle ? `@${handle}` : fallback.social
  };
}

export default function ManagedFooterContact({ fallback }) {
  const [content, setContent] = useState(null);
  const contact = useMemo(() => mergeContact(fallback, content), [content, fallback]);

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

  return (
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
  );
}
