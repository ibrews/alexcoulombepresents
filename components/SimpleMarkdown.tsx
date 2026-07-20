import React from "react";

// Minimal markdown renderer for newsletter issues — headings, bold, italic,
// links, images, bullet lists, and horizontal rules. Deliberately tiny (no
// dependency) and matched to what the newsletter issues actually use; extend
// as issues need. Keep in sync with lib/newsletterEmail.ts (the email-HTML
// version of this same renderer) if you add a block/inline type here.

function renderInline(text: string, keyBase: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  // Images first — they share [](  ) syntax with links, just !-prefixed.
  // Bold before italic so **x** matches as bold, not *(*x*)*.
  const re = /!\[([^\]]*)\]\(([^)]+)\)|\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[2] !== undefined) {
      // eslint-disable-next-line @next/next/no-img-element
      out.push(<img key={`${keyBase}-${i++}`} src={m[2]} alt={m[1]} className="my-4 block max-w-full rounded-lg" />);
    } else if (m[4] !== undefined) {
      out.push(
        <a key={`${keyBase}-${i++}`} href={m[4]} className="text-teal underline underline-offset-2 hover:text-snow">
          {m[3]}
        </a>
      );
    } else if (m[5] !== undefined) {
      out.push(<strong key={`${keyBase}-${i++}`} className="text-snow">{m[5]}</strong>);
    } else {
      out.push(<em key={`${keyBase}-${i++}`}>{m[6]}</em>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

// A block that's ONLY *italic text* — used as a photo caption. Put it right
// after an image (or a side-by-side row) to caption it.
function captionText(block: string): string | null {
  const m = block.match(/^\*([^*]+)\*$/);
  return m ? m[1] : null;
}

// A block of 2+ image refs and nothing else → side-by-side row (mirrors
// lib/newsletterEmail.ts's imageRow, kept here since this file has no
// import path to that one — a JSX component vs. a plain string renderer).
function imageRow(block: string): { alt: string; url: string }[] | null {
  const re = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const pairs: { alt: string; url: string }[] = [];
  const stripped = block.replace(re, (_, alt, url) => {
    pairs.push({ alt, url });
    return "";
  });
  return pairs.length >= 2 && stripped.trim() === "" ? pairs : null;
}

export default function SimpleMarkdown({ markdown }: { markdown: string }) {
  const blocks = markdown.split(/\n\s*\n/);
  return (
    <div className="space-y-5 leading-relaxed text-mist">
      {blocks.map((block, bi) => {
        const b = block.trim();
        if (!b) return null;
        if (b === "---") return <hr key={bi} className="border-line" />;
        if (b.startsWith("## ")) {
          return (
            <h2 key={bi} className="pt-2 text-xl font-bold text-snow">
              {renderInline(b.slice(3), `h-${bi}`)}
            </h2>
          );
        }
        const caption = captionText(b);
        if (caption !== null) {
          return (
            <p key={bi} className="-mt-3 text-center text-sm italic text-mist/80">
              {renderInline(caption, `c-${bi}`)}
            </p>
          );
        }
        const row = imageRow(b);
        if (row) {
          return (
            <div key={bi} className="grid gap-4 my-4" style={{ gridTemplateColumns: `repeat(${row.length}, 1fr)` }}>
              {row.map((img, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={img.url} alt={img.alt} className="block w-full rounded-lg" />
              ))}
            </div>
          );
        }
        if (b.split("\n").every((l) => l.trim().startsWith("- "))) {
          return (
            <ul key={bi} className="list-disc space-y-2 pl-5">
              {b.split("\n").map((l, li) => (
                <li key={li}>{renderInline(l.trim().slice(2), `l-${bi}-${li}`)}</li>
              ))}
            </ul>
          );
        }
        return <p key={bi}>{renderInline(b, `p-${bi}`)}</p>;
      })}
    </div>
  );
}
