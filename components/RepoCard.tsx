import Link from "next/link";
import StarCount from "./StarCount";
import type { Repo } from "@/lib/data";

export default function RepoCard({ repo }: { repo: Repo }) {
  return (
    <Link
      href={`/repos/${repo.slug}`}
      className="glass group flex h-full flex-col rounded-2xl p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-bold leading-snug group-hover:text-teal">{repo.name}</h3>
        <StarCount repo={repo.slug} org={repo.org} fallback={repo.stars} />
      </div>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-mist">{repo.tagline}</p>
      <div className="mt-4 flex items-center justify-between font-mono text-xs text-mist">
        <span>{repo.language}</span>
        <span className="text-teal opacity-0 transition-opacity group-hover:opacity-100">read more →</span>
      </div>
    </Link>
  );
}
