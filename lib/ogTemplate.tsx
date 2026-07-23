// ── Shared Open Graph image template ─────────────────────────────────────────
//
// One visual system for every dynamic OG image on the site: dark background,
// a thin teal→grape gradient rule near the top, generous whitespace, and the
// "Alex Coulombe Presents" wordmark pinned bottom-left. Each route's
// opengraph-image.tsx supplies {kicker, title, sub} and gets the same look.
//
// Usage in a route's opengraph-image.tsx:
//
//   import { ImageResponse } from "next/og";
//   import { ogImage, ogSize, ogContentType } from "@/lib/ogTemplate";
//
//   export const size = ogSize;
//   export const contentType = ogContentType;
//
//   export default function Image() {
//     return new ImageResponse(
//       ogImage({ kicker: "/newsletter", title: "…", sub: "…" }),
//       { ...ogSize }
//     );
//   }

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

const BG = "#0a0a12";
const TEAL = "#2dd4bf";
const GRAPE = "#a78bfa";
const AMBER = "#fbbf24";
const SNOW = "#ecECF6";
const MIST = "#9b9bb5";

export function ogImage({
  kicker,
  title,
  sub,
  footer = "Alex Coulombe Presents",
  accent = "newsletter",
}: {
  kicker?: string;
  title: string;
  sub?: string;
  footer?: string;
  accent?: "newsletter" | "training" | "store" | "support";
}) {
  const accentColor =
    accent === "training" ? AMBER : accent === "store" ? GRAPE : accent === "support" ? TEAL : TEAL;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: BG,
        backgroundImage: `radial-gradient(circle at 15% 15%, rgba(45,212,191,0.14), transparent 45%), radial-gradient(circle at 85% 85%, rgba(167,139,250,0.14), transparent 45%)`,
        padding: "72px 88px",
        fontFamily: "sans-serif",
        position: "relative",
      }}
    >
      {/* gradient rule */}
      <div
        style={{
          display: "flex",
          width: "180px",
          height: "8px",
          borderRadius: "4px",
          backgroundImage: `linear-gradient(90deg, ${TEAL}, ${GRAPE})`,
        }}
      />

      {kicker ? (
        <div
          style={{
            display: "flex",
            marginTop: "40px",
            fontSize: 28,
            color: accentColor,
            letterSpacing: "-0.02em",
          }}
        >
          {kicker}
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          flexGrow: 1,
          flexDirection: "column",
          justifyContent: "center",
          marginTop: kicker ? "8px" : "40px",
          maxWidth: "980px",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 64,
            fontWeight: 700,
            color: SNOW,
            lineHeight: 1.12,
            letterSpacing: "-0.03em",
          }}
        >
          {title}
        </div>
        {sub ? (
          <div
            style={{
              display: "flex",
              marginTop: "28px",
              fontSize: 32,
              color: MIST,
              lineHeight: 1.4,
            }}
          >
            {sub}
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 26,
        }}
      >
        <div style={{ display: "flex", color: SNOW, fontWeight: 600 }}>{footer}</div>
        <div style={{ display: "flex", color: accentColor }}>alexcoulombepresents.com</div>
      </div>
    </div>
  );
}
