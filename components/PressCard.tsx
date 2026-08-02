import { CATEGORY_STYLE } from "@/lib/categories";
import type { PressMention } from "@/lib/press";

export function PressCard({ p }: { p: PressMention }) {
  const style = CATEGORY_STYLE[p.kind];
  const body = (
    <>
      <span
        className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wider ${style.border} ${style.text}`}
      >
        {p.kind}
      </span>
      <h3 className="mt-3 font-bold leading-snug text-snow">{p.title}</h3>
      <p className="mt-1 text-sm text-mist">{p.outlet}</p>
      <p className="mt-2 font-mono text-xs text-mist">{p.date}</p>
    </>
  );

  if (!p.url) {
    return <div className="glass flex h-full flex-col gap-4 rounded-2xl p-6">{body}</div>;
  }

  return (
    <a
      href={p.url}
      target="_blank"
      rel="noopener noreferrer"
      className="glass flex h-full flex-col gap-4 rounded-2xl p-6 transition hover:border-teal/40"
    >
      {body}
    </a>
  );
}
