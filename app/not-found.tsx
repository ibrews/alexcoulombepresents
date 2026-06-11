import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-5 text-center">
      <p className="font-mono text-sm text-teal">HTTP 404</p>
      <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-6xl">
        This room isn&apos;t <span className="grad-text">rendered yet.</span>
      </h1>
      <p className="mt-4 max-w-md text-mist">
        You&apos;ve walked outside the playable area. In VR we&apos;d fade you to black and respawn
        you — here, have a link instead.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-snow px-6 py-3 font-semibold text-ink transition-transform hover:scale-[1.03]"
      >
        Respawn at home →
      </Link>
    </div>
  );
}
