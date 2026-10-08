import test from "node:test";
import assert from "node:assert/strict";
import { markdownToEmailHtml } from "../lib/newsletterEmail.ts";

// Regression cover for the inline renderer shared (by duplication) between
// lib/newsletterEmail.ts and components/SimpleMarkdown.tsx. Both matched
// `**([^*]+)**` and then emitted the captured text WITHOUT re-parsing it, so
// a link nested in bold — **text [link](url)** — shipped as dead literal
// characters: no <a>, and a source-markdown link checker sees nothing wrong.
// Caught 2026-10-08 while rewriting a newsletter around it.
const SITE = "https://alexcoulombepresents.com";

test("a link nested in bold renders as a real link, not literal text", () => {
  const html = markdownToEmailHtml("**Register for [Oct 14](/classes/oct-14) today**", SITE);
  assert.match(html, /<strong[^>]*>/);
  assert.match(html, /<a href="https:\/\/alexcoulombepresents\.com\/classes\/oct-14"[^>]*>Oct 14<\/a>/);
  // The markdown source must not survive into the output.
  assert.ok(!html.includes("](/classes/oct-14)"), "link markdown leaked as literal text");
  assert.ok(!html.includes("[Oct 14]"), "link text leaked with its brackets");
});

test("a link nested in italic renders as a real link too", () => {
  // Inside a larger paragraph on purpose: a block that is ONLY italic text is
  // the caption form, which took a different code path and already recursed.
  const html = markdownToEmailHtml("Catch up: *see [the replay](https://youtu.be/abc) first* then come.", SITE);
  assert.match(html, /<em>/);
  assert.match(html, /<a href="https:\/\/youtu\.be\/abc"[^>]*>the replay<\/a>/);
  assert.ok(!html.includes("](https://youtu.be/abc)"), "link markdown leaked inside italic");
});

test("bold wrapping only plain text is unchanged, newlines included", () => {
  const html = markdownToEmailHtml("**Oct 14\nOct 21**", SITE);
  assert.match(html, /<strong[^>]*>Oct 14<br>Oct 21<\/strong>/);
});

test("HTML in bold is still escaped, so recursion did not open an injection", () => {
  const html = markdownToEmailHtml("**<script>alert(1)</script>**", SITE);
  assert.ok(!html.includes("<script>"), "raw script tag survived inside bold");
  assert.match(html, /&lt;script&gt;/);
});

test("a bare link outside bold still works (the path that was never broken)", () => {
  const html = markdownToEmailHtml("Book [your seat](/classes/oct-21) now", SITE);
  assert.match(html, /<a href="https:\/\/alexcoulombepresents\.com\/classes\/oct-21"[^>]*>your seat<\/a>/);
});
