import { getIsleBoard } from "@/lib/isle";

const accents = [
  "border-teal/30 bg-teal/5",
  "border-amber/30 bg-amber/5",
  "border-grape/30 bg-grape/5",
  "border-sky/30 bg-sky/5",
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

      <div className="relative mt-6 overflow-hidden rounded-3xl border border-line bg-panel/40 p-4 md:p-6">
        <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.16)_1px,transparent_0)] [background-size:20px_20px]" />
        <div className="relative grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {board.cards.map((card, index) => (
            <article
              key={card.title}
              className={`glass rounded-2xl border p-5 ${accents[index % accents.length]} ${index % 3 === 1 ? "xl:translate-y-5" : ""}`}
            >
              <p className="font-mono text-[10px] uppercase tracking-widest text-mist">Topic {String(index + 1).padStart(2, "0")}</p>
              <h3 className="mt-2 text-xl font-bold tracking-tight text-snow">{card.title}</h3>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-mist">
                {card.notes.map((note) => (
                  <li key={note} className="flex gap-3">
                    <span className="text-teal">✦</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
