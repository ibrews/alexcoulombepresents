import React from "react";

// Minimal markdown renderer for newsletter issues — headings, bold, italic,
// links, images, bullet lists, and horizontal rules. Deliberately tiny (no
// dependency) and matched to what the newsletter issues actually use; extend
// as issues need. Keep in sync with lib/newsletterEmail.ts (the email-HTML
// version of this same renderer) if you add a block/inline type here.
//
// Images open their own full-resolution file in a new tab by default —
// unless wrapped in a link, standard nested-markdown style:
// [![alt](u)](https://example.com) goes there instead. In a row, give one or
// more images an explicit width via the title slot — ![alt](u "44") takes
// 44% of the row; images without a title split whatever's left equally.

// Plain HTML collapses a raw "\n" to nothing visible — split on it and
// interleave real <br /> elements so a single line break WITHIN a block (one
// Enter in the editor's textarea; Shift+Enter does the same thing there,
// it's a plain <textarea>) actually shows. A BLANK line (Enter twice) starts
// a whole new block instead — handled earlier, before text ever reaches here.
function withLineBreaks(text: string, keyBase: string): React.ReactNode[] {
  const lines = text.split("\n");
  const out: React.ReactNode[] = [];
  lines.forEach((line, i) => {
    if (i > 0) out.push(<br key={`${keyBase}-br-${i}`} />);
    if (line) out.push(line);
  });
  return out;
}

// A linked image [![alt](u "title")](href) is tried before a plain link so
// its brackets don't get misread as [text](url); a plain image is tried
// before a plain link for the same reason (shared [](  ) syntax, !-prefixed).
// Bold before italic so **x** matches as bold, not *(*x*)*.
const INLINE_RE =
  /\[!\[([^\]]*)\]\(([^)"]+?)(?:\s+"([^"]*)")?\)\]\(([^)]+)\)|!\[([^\]]*)\]\(([^)"]+?)(?:\s+"([^"]*)")?\)|\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;

function renderInline(text: string, keyBase: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = new RegExp(INLINE_RE);
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(...withLineBreaks(text.slice(last, m.index), `${keyBase}-t${i}`));
    if (m[2] !== undefined) {
      // Linked image: alt=m[1], src=m[2], title=m[3] (unused standalone), href=m[4].
      out.push(
        <a
          key={`${keyBase}-${i++}`}
          href={m[4]}
          target="_blank"
          rel="noopener noreferrer"
          className="my-4 block transition-opacity hover:opacity-90"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={m[2]} alt={m[1]} className="block max-w-full rounded-lg" />
        </a>
      );
    } else if (m[6] !== undefined) {
      // Plain image: alt=m[5], src=m[6] — click-through defaults to itself.
      out.push(
        <a
          key={`${keyBase}-${i++}`}
          href={m[6]}
          target="_blank"
          rel="noopener noreferrer"
          className="my-4 block transition-opacity hover:opacity-90"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={m[6]} alt={m[5]} className="block max-w-full rounded-lg" />
        </a>
      );
    } else if (m[9] !== undefined) {
      out.push(
        <a key={`${keyBase}-${i++}`} href={m[9]} className="text-teal underline underline-offset-2 hover:text-snow">
          {m[8]}
        </a>
      );
    } else if (m[10] !== undefined) {
      out.push(
        <strong key={`${keyBase}-${i++}`} className="text-snow">
          {withLineBreaks(m[10], `${keyBase}-b${i}`)}
        </strong>
      );
    } else {
      out.push(<em key={`${keyBase}-${i++}`}>{withLineBreaks(m[11], `${keyBase}-i${i}`)}</em>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(...withLineBreaks(text.slice(last), `${keyBase}-tail`));
  return out;
}

// A block that's ONLY *italic text* — used as a photo caption. Put it right
// after an image (or a side-by-side row) to caption it.
function captionText(block: string): string | null {
  const m = block.match(/^\*([^*]+)\*$/);
  return m ? m[1] : null;
}

type ImgToken = { alt: string; url: string; title?: string; href?: string };

// A block of 2+ image refs (plain or linked) and nothing else → side-by-side
// row (mirrors lib/newsletterEmail.ts's imageRow, kept here since this file
// has no import path to that one — a JSX component vs. a plain string
// renderer).
function imageRow(block: string): ImgToken[] | null {
  const re = /\[!\[([^\]]*)\]\(([^)"]+?)(?:\s+"([^"]*)")?\)\]\(([^)]+)\)|!\[([^\]]*)\]\(([^)"]+?)(?:\s+"([^"]*)")?\)/g;
  const tokens: ImgToken[] = [];
  const stripped = block.replace(re, (_m, la, lu, lt, lh, pa, pu, pt) => {
    if (lu !== undefined) tokens.push({ alt: la, url: lu, title: lt, href: lh });
    else tokens.push({ alt: pa, url: pu, title: pt });
    return "";
  });
  return tokens.length >= 2 && stripped.trim() === "" ? tokens : null;
}

// Per-image width %, honoring an explicit title (e.g. "44") and splitting
// whatever's left equally among images that don't specify one.
function rowWidths(tokens: ImgToken[]): number[] {
  const specified = tokens.map((t) => (t.title && /^\d+(\.\d+)?$/.test(t.title) ? parseFloat(t.title) : null));
  const specifiedSum = specified.reduce((sum: number, w) => sum + (w ?? 0), 0);
  const unspecifiedCount = specified.filter((w) => w === null).length;
  const remainingShare = unspecifiedCount > 0 ? Math.max(0, 100 - specifiedSum) / unspecifiedCount : 0;
  return specified.map((w) => w ?? remainingShare);
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
          const widths = rowWidths(row);
          return (
            <div
              key={bi}
              className="grid gap-4 my-4"
              style={{ gridTemplateColumns: widths.map((w) => `${w}%`).join(" ") }}
            >
              {row.map((img, i) =>
                img.href ? (
                  <a
                    key={i}
                    href={img.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block transition-opacity hover:opacity-90"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.alt} className="block w-full rounded-lg" />
                  </a>
                ) : (
                  <a
                    key={i}
                    href={img.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block transition-opacity hover:opacity-90"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.alt} className="block w-full rounded-lg" />
                  </a>
                )
              )}
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
