"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { venues, type Venue } from "@/lib/venues";

const COOKIE_NAME = "acp_marquee_seed";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year — reshuffles only once cookies are cleared

// Deterministic PRNG (mulberry32) so the same seed always produces the same
// shuffle — that's what lets the cookie-stored seed reproduce one fixed
// order across every page load until the cookie is cleared.
function mulberry32(seed: number) {
  let state = seed;
  return function () {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(list: Venue[], seed: number): Venue[] {
  const rand = mulberry32(seed);
  const result = [...list];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function readSeedCookie(): number | null {
  const match = document.cookie.match(/(?:^|; )acp_marquee_seed=(\d+)/);
  return match ? Number(match[1]) : null;
}

function writeSeedCookie(seed: number) {
  document.cookie = `${COOKIE_NAME}=${seed}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export default function VenueMarquee() {
  // Starts in the array's authored order so the client's first render
  // matches the server-rendered HTML exactly (no hydration mismatch);
  // useEffect swaps in the cookie-seeded shuffle right after mount.
  const [ordered, setOrdered] = useState<Venue[]>(venues);

  useEffect(() => {
    let seed = readSeedCookie();
    if (seed === null) {
      seed = Math.floor(Math.random() * 2 ** 31);
      writeSeedCookie(seed);
    }
    setOrdered(shuffle(venues, seed));
  }, []);

  return (
    <section className="border-y border-line py-5">
      <div className="flex items-center">
        <Link
          href="/appearances"
          className="shrink-0 pl-5 pr-8 font-mono text-xs uppercase tracking-widest text-teal transition-colors hover:text-snow"
        >
          Featured in:
        </Link>
        <div className="overflow-hidden">
          <div className="marquee-track flex w-max gap-12 whitespace-nowrap font-mono text-sm text-mist">
            {[...ordered, ...ordered].map((v, i) =>
              v.url ? (
                <a
                  key={i}
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-12 transition-colors hover:text-teal"
                >
                  <span>{v.name}</span>
                  <span className="text-teal">✦</span>
                </a>
              ) : (
                <span key={i} className="flex items-center gap-12">
                  <span>{v.name}</span>
                  <span className="text-teal">✦</span>
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
