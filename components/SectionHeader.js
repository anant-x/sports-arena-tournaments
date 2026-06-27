export default function SectionHeader({ eyebrow, title, description }) {
  return (
    <div className="hero-copy max-w-3xl">
      <p className="text-sm font-black uppercase tracking-wide text-turf">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-black tracking-normal text-pitch sm:text-4xl">{title}</h2>
      {description ? <p className="mt-3 text-base leading-7 text-graphite/72">{description}</p> : null}
    </div>
  );
}
