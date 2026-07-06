"use client";

import { useEffect, useState } from "react";

// Live star count from the GitHub API, with a session cache and baked fallback.
export default function StarCount({ repo, org = "ibrews", fallback }: { repo: string; org?: string; fallback: number }) {
  const [stars, setStars] = useState<number>(fallback);

  useEffect(() => {
    const key = `stars:${org}/${repo}`;
    const cached = sessionStorage.getItem(key);
    if (cached !== null) {
      setStars(Number(cached));
      return;
    }
    fetch(`https://api.github.com/repos/${org}/${repo}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && typeof d.stargazers_count === "number") {
          sessionStorage.setItem(key, String(d.stargazers_count));
          setStars(d.stargazers_count);
        }
      })
      .catch(() => {});
  }, [repo, org]);

  return (
    <span className="inline-flex items-center gap-1 font-mono text-xs text-amber" title="GitHub stars (live)">
      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
      </svg>
      {stars}
    </span>
  );
}
