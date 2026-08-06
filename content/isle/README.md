# Isle portal entries

Create one dated markdown file per meeting or update: `YYYY-MM-DD-slug.md`.
Only files matching that convention are loaded into the timeline. The loader
reads a frontmatter-like header block at the top of each entry,
terminated by a line containing only `---`:

```md
title: Clear, short entry title
date: 2026-06-23
summary: One-line summary for the timeline.
---

## Notes

- One note per bullet
- Keep notes plain text
```

The `## Notes` heading is required. An entry may also include one optional
diagram block anywhere in its body. It must be valid JSON with `nodes` and
`edges` arrays:

````md
```isle-diagram
{"nodes":[{"id":"start","label":"Start"},{"id":"finish","label":"Finish"}],"edges":[{"from":"start","to":"finish","label":"optional"}]}
```
````

Every node needs a unique string `id` and a string `label`. Every edge needs
string `from` and `to` IDs; `label` is optional. The diagram is illustrative,
so keep labels concise enough to fit in a small flow node.
