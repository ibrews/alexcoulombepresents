// Collapsible postmortem note — tap the title to expand. No client JS needed;
// <details> handles the interaction natively.
export default function DevlogNote({
  title,
  tag,
  children,
}: {
  title: string;
  tag?: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group rounded-xl border border-line bg-panel/40 open:bg-panel/70">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4">
        <span className="font-mono text-teal transition-transform group-open:rotate-90">›</span>
        <span className="flex-1 text-sm font-semibold text-snow">{title}</span>
        {tag && (
          <span className="rounded-full border border-line px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-mist">
            {tag}
          </span>
        )}
      </summary>
      <div className="space-y-3 px-5 pb-5 pl-11 text-sm leading-relaxed text-mist">{children}</div>
    </details>
  );
}
