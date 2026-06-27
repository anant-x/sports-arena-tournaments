import Image from "next/image";

export default function TeamBadge({ team, size = "md" }) {
  const sizes = {
    sm: "h-10 w-10",
    md: "h-14 w-14",
    lg: "h-20 w-20"
  };

  return (
    <span className={`relative block overflow-hidden rounded-md bg-white shadow-sm transition hover:scale-105 ${sizes[size]}`}>
      <Image src={team.logo} alt={`${team.name} logo`} fill sizes="80px" className="image-zoom object-cover" />
    </span>
  );
}
