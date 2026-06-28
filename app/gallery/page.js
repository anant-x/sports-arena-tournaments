import Image from "next/image";
import SectionHeader from "../../components/SectionHeader";
import ManagedGalleryAdditions from "../../components/client/ManagedGalleryAdditions";
import { allGalleryImages } from "../../lib/tournament";

export const metadata = {
  title: "Gallery"
};

export default function GalleryPage() {
  const images = allGalleryImages();

  return (
    <main className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Photos"
          title="Tournament gallery"
          description="Visuals from cricket, badminton, tennis, football, and featured tournament campaigns."
        />
        <div className="stagger-list mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {images.map((image) => (
            <figure key={`${image.tournamentName}-${image.src}`} className="motion-card overflow-hidden rounded-lg border border-graphite/10 bg-white shadow-sm">
              <div className="relative aspect-[4/5]">
                <Image src={image.src} alt={image.alt} fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="image-zoom object-cover" />
              </div>
              <figcaption className="px-4 py-3">
                <p className="text-sm font-black text-pitch">{image.caption}</p>
                <p className="mt-1 text-xs font-bold uppercase text-graphite/45">{image.sport} · {image.tournamentName}</p>
              </figcaption>
            </figure>
          ))}
          <ManagedGalleryAdditions />
        </div>
      </div>
    </main>
  );
}
