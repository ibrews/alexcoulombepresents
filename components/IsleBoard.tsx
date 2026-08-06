import { getIsleBoard } from "@/lib/isle";
import type { CSSProperties } from "react";

const noteStyles = [
  { background: "#d7f0e6", border: "#8abfae", pin: "#176b5a", rotation: "-2.5deg" },
  { background: "#f8dfa0", border: "#d7ab45", pin: "#80580a", rotation: "1.75deg" },
  { background: "#e4d8fa", border: "#b4a1dc", pin: "#58407f", rotation: "-1.25deg" },
  { background: "#cce8f7", border: "#83b9d2", pin: "#245d79", rotation: "2.5deg" },
  { background: "#f8d5c6", border: "#d59a82", pin: "#844632", rotation: "-2deg" },
  { background: "#dcecc6", border: "#a8c487", pin: "#4a6935", rotation: "1.25deg" },
  { background: "#f1d5e3", border: "#cf96b2", pin: "#7a3657", rotation: "-0.75deg" },
];

export default function IsleBoard() {
  const board = getIsleBoard();

  if (board.cards.length === 0) return null;

  return (
    <section className="mt-14" aria-labelledby="current-thinking-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-teal">Current thinking</p>
          <h2 id="current-thinking-heading" className="mt-2 text-2xl font-bold tracking-tight text-snow">
            Experience design synthesis
          </h2>
        </div>
        {board.updated ? <p className="font-mono text-xs text-mist">Last updated: {board.updated}</p> : null}
      </div>

      <div className="isle-pinboard relative mt-6 overflow-hidden rounded-[2rem] border p-5 md:p-8">
        <div className="isle-note-columns relative columns-1 gap-7 md:columns-2 xl:columns-3">
          {board.cards.map((card, index) => {
            const noteStyle = noteStyles[index % noteStyles.length];
            const style = {
              "--note-background": noteStyle.background,
              "--note-border": noteStyle.border,
              "--note-pin": noteStyle.pin,
              "--note-rotation": noteStyle.rotation,
            } as CSSProperties;

            return (
              <article key={card.title} className="isle-note relative mb-7 break-inside-avoid p-5 text-[#242129]" style={style}>
                <span className="isle-note-pin" aria-hidden="true" />
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#514958]">
                  Topic {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 text-xl font-bold leading-tight tracking-tight">{card.title}</h3>
                <ul className="mt-4 space-y-2 text-sm leading-snug text-[#38323c]">
                  {card.notes.map((note) => (
                    <li key={note} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#4c4450]" aria-hidden="true" />
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
