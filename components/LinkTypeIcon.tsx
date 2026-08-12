// Small glyph hinting at what kind of thing a card's link actually opens —
// video recording, deck/slides, audio, article, or a plain link — inferred
// from the URL's host so no extra data-entry is needed per appearance/press
// entry.

export type LinkKind = "video" | "audio" | "deck" | "article" | "link";

const VIDEO_HOSTS = /(^|\.)(youtube\.com|youtu\.be|vimeo\.com|twitch\.tv)$/i;
const AUDIO_HOSTS = /(^|\.)(spotify\.com|podcasts\.apple\.com|overcast\.fm|podbean\.com|soundcloud\.com|anchor\.fm|buzzsprout\.com)$/i;
const DECK_HOSTS = /(^|\.)(docs\.google\.com|drive\.google\.com|speakerdeck\.com|slideshare\.net)$/i;

export function linkKindForUrl(url: string, fallback: LinkKind = "link"): LinkKind {
  let host = "";
  let pathname = "";
  try {
    const parsed = new URL(url);
    host = parsed.hostname;
    pathname = parsed.pathname;
  } catch {
    return fallback;
  }
  if (VIDEO_HOSTS.test(host)) return "video";
  if (/(^|\.)facebook\.com$/i.test(host) && /\/videos\//.test(pathname)) return "video";
  if (AUDIO_HOSTS.test(host)) return "audio";
  if (DECK_HOSTS.test(host) || /\.pdf$/i.test(url)) return "deck";
  return fallback;
}

export function LinkTypeIcon({ kind, className }: { kind: LinkKind; className?: string }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };
  switch (kind) {
    case "video":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M10 8.3v7.4l6.5-3.7z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "audio":
      return (
        <svg {...common}>
          <path d="M4 13a8 8 0 0 1 16 0v5.5a1.5 1.5 0 0 1-1.5 1.5H17v-6.5h3" />
          <rect x="3" y="13" width="4" height="7" rx="1.3" />
          <rect x="17" y="13" width="4" height="7" rx="1.3" />
        </svg>
      );
    case "deck":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="12" rx="1.5" />
          <path d="M8 20h8M12 16v4" />
        </svg>
      );
    case "article":
      return (
        <svg {...common}>
          <path d="M6 3h9l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
          <path d="M9 12.5h6M9 16h6M9 8.5h3" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M14 4h6v6M20 4l-9 9M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
        </svg>
      );
  }
}
