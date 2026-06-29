import { Fragment } from "react";

/** Strip `<br>` markers for use in plain-text contexts (metadata, og:description). */
export function plainText(text: string | undefined): string {
  if (!text) return "";
  return text.replace(/<br>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Splits a string on literal `<br>` markers and interleaves real `<br />` elements.
 * Returns the plain string unchanged when no marker is present (no ReactNode wrapping overhead).
 *
 * Author content is stored verbatim in data.ts strings; this renders the breaks.
 */
export function renderBreaks(text: string | undefined): React.ReactNode {
  if (!text) return null;
  if (!text.includes("<br>")) return text;
  const parts = text.split("<br>");
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {part}
          {i < parts.length - 1 && <br />}
        </Fragment>
      ))}
    </>
  );
}
