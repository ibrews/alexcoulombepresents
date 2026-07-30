// ── Curriculum ──────────────────────────────────────────────────────────────
//
// One markdown file per class in content/curriculum/, with a simple header
// block followed by `---` and the class description. Add a file here first;
// it appears on /curriculum automatically at the next deploy.

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

export type CurriculumLevel = "intro" | "intermediate" | "advanced";
export type CurriculumStatus = "teasing" | "scheduled" | "live";

export type CurriculumEntry = {
  title: string;
  slug: string;
  tagline: string;
  level: CurriculumLevel;
  format: string;
  status: CurriculumStatus;
  storeSlug?: string;
  updated: string; // YYYY-MM-DD
  body: string; // markdown
};

const DIR = path.join(process.cwd(), "content", "curriculum");

function unquote(value: string): string {
  return value.replace(/^"(.*)"$/, "$1").replace(/\\"/g, '"');
}

export function getCurriculumEntries(): CurriculumEntry[] {
  let files: string[] = [];
  try {
    files = readdirSync(DIR).filter((file) => file.endsWith(".md"));
  } catch {
    return [];
  }

  return files
    .map((file) => {
      const raw = readFileSync(path.join(DIR, file), "utf8");
      const [header, ...rest] = raw.split(/^---$/m);
      const get = (key: string) =>
        unquote(header.match(new RegExp(`^${key}:\\s*(.+)$`, "m"))?.[1].trim() ?? "");

      return {
        title: get("title"),
        slug: get("slug") || file.replace(/\.md$/, ""),
        tagline: get("tagline"),
        level: get("level") as CurriculumLevel,
        format: get("format"),
        status: get("status") as CurriculumStatus,
        storeSlug: get("storeSlug") || undefined,
        updated: get("updated"),
        body: rest.join("---").trim(),
      };
    })
    .sort((a, b) => (a.updated < b.updated ? 1 : -1));
}

export function getCurriculumEntry(slug: string): CurriculumEntry | undefined {
  return getCurriculumEntries().find((entry) => entry.slug === slug);
}
