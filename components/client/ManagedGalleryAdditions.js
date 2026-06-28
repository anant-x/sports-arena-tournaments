"use client";

import { useEffect, useState } from "react";

function normalize(item) {
  if (typeof item === "string") {
    return { url: item, caption: "Tournament photo" };
  }

  return {
    url: item?.url || item?.src || item?.image || "",
    caption: item?.caption || item?.alt || "Tournament photo"
  };
}

export default function ManagedGalleryAdditions() {
  const [images, setImages] = useState([]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const response = await fetch("/api/site-content", { cache: "no-store" });
        const payload = await response.json();
        if (mounted && response.ok) {
          setImages((payload.content?.gallery || []).map(normalize).filter((item) => item.url));
        }
      } catch {
        setImages([]);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (!images.length) {
    return null;
  }

  return (
    <>
      {images.map((image, index) => (
        <figure key={`${image.url}-${index}`} className="motion-card overflow-hidden rounded-lg border border-graphite/10 bg-white shadow-sm">
          <div className="relative aspect-[4/5]">
            <img src={image.url} alt={image.caption} className="image-zoom h-full w-full object-cover" loading="lazy" />
          </div>
          <figcaption className="px-4 py-3">
            <p className="text-sm font-black text-pitch">{image.caption}</p>
            <p className="mt-1 text-xs font-bold uppercase text-graphite/45">Admin gallery</p>
          </figcaption>
        </figure>
      ))}
    </>
  );
}
