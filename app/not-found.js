import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-[55vh] place-items-center px-4 py-16 text-center">
      <div>
        <p className="text-sm font-black uppercase text-turf">404</p>
        <h1 className="mt-2 text-4xl font-black text-pitch">Page not found</h1>
        <Link href="/" className="mt-6 inline-flex rounded-md bg-pitch px-5 py-3 text-sm font-black text-white">
          Back Home
        </Link>
      </div>
    </main>
  );
}
