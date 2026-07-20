// ── Markdown → email-safe HTML ──────────────────────────────────────────────
// The newsletter archive on the site renders markdown via SimpleMarkdown
// (React, Tailwind classes). Actual emails can't use either — most clients
// strip <style> blocks and external CSS, so everything here is inline. This
// is the ONE place that understands "how a newsletter issue becomes an
// email" — scripts/broadcast.mjs (real sends) and the preview route both
// call it, so what you preview is byte-for-byte what gets mailed.
//
// Supported markdown: headings (##), bold (**), links ([t](u)), images
// (![alt](u)), bullet lists (- item), horizontal rules (---), paragraphs.
// A block that's 2+ image references and NOTHING else (any whitespace
// between them, including newlines) renders as a side-by-side row —
// ![a](u1) ![b](u2) — an even-width HTML table (table, not flex/grid: the
// one layout that survives Outlook). Deliberately the same small surface as
// SimpleMarkdown.tsx — keep them in sync if you add a block type to one.

const FONT_STACK =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const TEAL = "#14b8a6";
const INK = "#0a0a12";
const MIST = "#5b6472";

function absolutize(url: string, siteUrl: string): string {
  if (/^https?:\/\//i.test(url) || /^mailto:/i.test(url)) return url;
  return `${siteUrl.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderInline(text: string, siteUrl: string): string {
  // Images first (own token so they don't get swallowed by the link regex —
  // markdown images share [](  ) syntax with links, just prefixed with !).
  const re = /!\[([^\]]*)\]\(([^)]+)\)|\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
  let out = "";
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    out += escapeHtml(text.slice(last, m.index));
    if (m[2] !== undefined) {
      const src = absolutize(m[2], siteUrl);
      out += `<img src="${src}" alt="${escapeHtml(m[1])}" style="max-width:100%;height:auto;border-radius:8px;display:block;margin:16px 0" />`;
    } else if (m[4] !== undefined) {
      const href = absolutize(m[4], siteUrl);
      out += `<a href="${href}" style="color:${TEAL};text-decoration:underline">${escapeHtml(m[3])}</a>`;
    } else {
      out += `<strong style="color:${INK}">${escapeHtml(m[5])}</strong>`;
    }
    last = m.index + m[0].length;
  }
  out += escapeHtml(text.slice(last));
  return out;
}

// A block of 2+ image refs and nothing else → side-by-side row. Returns the
// [alt, url] pairs, or null if the block isn't purely images (alt text can
// itself contain spaces, so this can't just whitespace-split the block —
// it extracts every ![]() match, then checks nothing but whitespace is left).
function imageRow(block: string): [string, string][] | null {
  const re = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const pairs: [string, string][] = [];
  const stripped = block.replace(re, (_, alt, url) => {
    pairs.push([alt, url]);
    return "";
  });
  return pairs.length >= 2 && stripped.trim() === "" ? pairs : null;
}

/** The email body only — no <html>/<head>, so callers can append a footer. */
export function markdownToEmailHtml(markdown: string, siteUrl: string): string {
  const blocks = markdown.split(/\n\s*\n/);
  const html: string[] = [];
  for (const block of blocks) {
    const b = block.trim();
    if (!b) continue;
    const images = imageRow(b);
    if (b === "---") {
      html.push(`<hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0" />`);
    } else if (b.startsWith("## ")) {
      html.push(
        `<h2 style="font-size:20px;font-weight:700;color:${INK};margin:28px 0 12px">${renderInline(b.slice(3), siteUrl)}</h2>`
      );
    } else if (/^!\[[^\]]*\]\([^)]+\)$/.test(b)) {
      // A paragraph that's ONLY an image — render at full block width, not
      // wrapped in a <p>, so it doesn't inherit paragraph line-height.
      html.push(renderInline(b, siteUrl));
    } else if (images) {
      const width = `${(100 / images.length).toFixed(4)}%`;
      const cells = images
        .map(([alt, url], i) => {
          const src = absolutize(url, siteUrl);
          const pad = images.length === 1 ? "" : i === 0 ? "padding-right:8px" : i === images.length - 1 ? "padding-left:8px" : "padding-left:8px;padding-right:8px";
          return `<td width="${width}" style="${pad}"><img src="${src}" alt="${escapeHtml(alt)}" style="width:100%;height:auto;border-radius:8px;display:block" /></td>`;
        })
        .join("");
      html.push(
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0"><tr>${cells}</tr></table>`
      );
    } else if (b.split("\n").every((l) => l.trim().startsWith("- "))) {
      const items = b
        .split("\n")
        .map((l) => `<li style="margin:6px 0">${renderInline(l.trim().slice(2), siteUrl)}</li>`)
        .join("");
      html.push(`<ul style="padding-left:20px;margin:12px 0">${items}</ul>`);
    } else {
      html.push(
        `<p style="font-size:16px;line-height:1.6;color:${INK};margin:16px 0">${renderInline(b, siteUrl)}</p>`
      );
    }
  }
  return html.join("\n");
}

/** Full standalone HTML document — what actually gets sent/previewed. */
export function renderNewsletterEmail(opts: {
  bodyMarkdown: string;
  footerHtml: string; // the reason + unsubscribe line, already built by the caller
  siteUrl?: string;
}): string {
  const siteUrl = opts.siteUrl ?? "https://alexcoulombepresents.com";
  const body = markdownToEmailHtml(opts.bodyMarkdown, siteUrl);
  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:${FONT_STACK}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden">
        <tr><td style="padding:32px 32px 8px">
          ${body}
        </td></tr>
        <tr><td style="padding:24px 32px 32px">
          <hr style="border:none;border-top:1px solid #e5e5e5;margin:0 0 16px" />
          <p style="font-size:12px;line-height:1.6;color:${MIST};margin:0;font-family:monospace">${opts.footerHtml}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
