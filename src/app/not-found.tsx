import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg-primary px-4 text-center">
      <p className="mb-2 font-[var(--font-heading)] text-8xl font-extrabold text-bitcoin">
        404
      </p>
      <h1 className="mb-2 font-[var(--font-heading)] text-2xl font-bold text-text-heading">
        Page not found
      </h1>
      <p className="mb-8 max-w-sm text-text-secondary">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/en"
        className="btn-primary inline-flex items-center justify-center px-8 py-3 text-base"
      >
        Go Home
      </Link>
    </main>
  );
}
