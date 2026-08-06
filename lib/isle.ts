// ── Isle advisor portal ────────────────────────────────────────────────────
//
// Meeting entries live in content/isle/, one dated markdown file per entry.
// Each file has a simple header block terminated by `---`:
//
//   title: Entry title
//   date: 2026-06-23
//   summary: One-line summary
//   ---
//   ## Notes
//   - A note
//
// An optional `isle-diagram` JSON block in the body becomes an interactive
// diagram on the portal. See content/isle/README.md for the full schema.

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

export type IsleDiagramNode = {
  id: string;
  label: string;
};

export type IsleDiagramEdge = {
  from: string;
  to: string;
  label?: string;
};

export type IsleDiagramData = {
  nodes: IsleDiagramNode[];
  edges: IsleDiagramEdge[];
};

export type IsleEntry = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  notes: string[];
  diagram: IsleDiagramData | null;
};

const DIR = path.join(process.cwd(), "content", "isle");

function parseDiagram(body: string): IsleDiagramData | null {
  const rawDiagram = body.match(/```isle-diagram\s*\r?\n([\s\S]*?)```/m)?.[1];
  if (!rawDiagram) return null;

  try {
    const parsed: unknown = JSON.parse(rawDiagram);
    if (!parsed || typeof parsed !== "object") return null;
    const { nodes, edges } = parsed as { nodes?: unknown; edges?: unknown };
    if (!Array.isArray(nodes) || !Array.isArray(edges)) return null;

    const validNodes = nodes.filter(
      (node): node is IsleDiagramNode =>
        !!node &&
        typeof node === "object" &&
        typeof (node as IsleDiagramNode).id === "string" &&
        typeof (node as IsleDiagramNode).label === "string"
    );
    const validEdges = edges.filter(
      (edge): edge is IsleDiagramEdge =>
        !!edge &&
        typeof edge === "object" &&
        typeof (edge as IsleDiagramEdge).from === "string" &&
        typeof (edge as IsleDiagramEdge).to === "string" &&
        ((edge as IsleDiagramEdge).label === undefined || typeof (edge as IsleDiagramEdge).label === "string")
    );

    return { nodes: validNodes, edges: validEdges };
  } catch {
    return null;
  }
}

export function getIsleEntries(): IsleEntry[] {
  let files: string[] = [];
  try {
    files = readdirSync(DIR).filter((file) => file.endsWith(".md") && file !== "README.md");
  } catch {
    return [];
  }

  return files
    .map((file) => {
      const raw = readFileSync(path.join(DIR, file), "utf8");
      const [header, ...rest] = raw.split(/^---$/m);
      const body = rest.join("---").trim();
      const get = (key: string) =>
        header.match(new RegExp(`^${key}:\\s*(.+)$`, "m"))?.[1].trim() ?? "";
      const notesSection = body.split(/^## Notes\s*$/m)[1]?.split(/^## /m)[0] ?? "";

      return {
        slug: file.replace(/\.md$/, ""),
        title: get("title"),
        date: get("date"),
        summary: get("summary"),
        notes: [...notesSection.matchAll(/^\s*[-*]\s+(.+?)\s*$/gm)].map((match) => match[1]),
        diagram: parseDiagram(body),
      };
    })
    .filter((entry) => entry.title && entry.date)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}
