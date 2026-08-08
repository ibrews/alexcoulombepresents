import { ImageResponse } from "next/og";
import { wednesdayCalendar } from "@/lib/store";

// A shareable calendar graphic for social posts — no prices, just the 8
// topics + dates, so it works as a standalone post rather than a link
// preview. Square-ish (1080×1080) for IG/Twitter-card use. Separate from
// app/training/opengraph-image.tsx, which is the page's own link-preview
// image and stays undated/title-only. This one regenerates automatically as
// wednesdayCalendar changes — no manual re-export when a class moves.

// This is a plain route (not the opengraph-image.tsx file convention, which
// Next.js only wires to a page's own link-preview meta tags) — GET serves
// the PNG directly at /training/calendar-social-image so it can be shared,
// downloaded, or embedded on its own.
const SIZE = { width: 1080, height: 1080 };

const BG = "#0a0a12";
const TEAL = "#2dd4bf";
const GRAPE = "#a78bfa";
const AMBER = "#fbbf24";
const SNOW = "#ecECF6";
const MIST = "#9b9bb5";
const ACCENTS = [TEAL, GRAPE, AMBER];

function formatCard(iso: string): { weekday: string; date: string } {
  const d = new Date(iso);
  const weekday = d.toLocaleDateString("en-US", { weekday: "short", timeZone: "America/New_York" }).toUpperCase();
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" }).toUpperCase();
  return { weekday, date };
}

export async function GET() {
  const rows: (typeof wednesdayCalendar)[number][][] = [];
  for (let i = 0; i < wednesdayCalendar.length; i += 2) {
    rows.push(wednesdayCalendar.slice(i, i + 2));
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: BG,
          backgroundImage:
            "radial-gradient(circle at 12% 10%, rgba(45,212,191,0.16), transparent 42%), radial-gradient(circle at 90% 88%, rgba(167,139,250,0.16), transparent 42%)",
          padding: "56px 64px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "160px",
            height: "7px",
            borderRadius: "4px",
            backgroundImage: `linear-gradient(90deg, ${TEAL}, ${GRAPE})`,
          }}
        />
        <div style={{ display: "flex", marginTop: "28px", fontSize: 24, color: TEAL, letterSpacing: "-0.02em" }}>
          /training · THE WEDNESDAY CALENDAR
        </div>
        <div
          style={{
            display: "flex",
            marginTop: "10px",
            fontSize: 46,
            fontWeight: 700,
            color: SNOW,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
          }}
        >
          8 weeks. Live Unreal training.
        </div>
        <div style={{ display: "flex", marginTop: "10px", fontSize: 22, color: MIST }}>
          Every Wednesday, 11a ET · Epic Games Authorized Instructor
        </div>

        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, marginTop: "36px", gap: "16px" }}>
          {rows.map((row, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "row", gap: "16px", flex: 1 }}>
              {row.map((item, j) => {
                const { weekday, date } = formatCard(item.sessionDateISO!);
                const accent = ACCENTS[(i * 2 + j) % ACCENTS.length];
                return (
                  <div
                    key={item.slug}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      flex: 1,
                      borderRadius: "18px",
                      border: `1px solid rgba(255,255,255,0.12)`,
                      backgroundColor: "rgba(255,255,255,0.04)",
                      padding: "20px 24px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        fontSize: 18,
                        fontFamily: "monospace",
                        letterSpacing: "0.06em",
                        color: accent,
                      }}
                    >
                      {weekday}, {date}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        marginTop: "8px",
                        fontSize: 25,
                        fontWeight: 700,
                        color: SNOW,
                        lineHeight: 1.2,
                      }}
                    >
                      {item.name}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "32px",
            fontSize: 24,
          }}
        >
          <div style={{ display: "flex", color: SNOW, fontWeight: 600 }}>Alex Coulombe Presents</div>
          <div style={{ display: "flex", color: TEAL }}>alexcoulombepresents.com/training</div>
        </div>
      </div>
    ),
    { ...SIZE }
  );
}
