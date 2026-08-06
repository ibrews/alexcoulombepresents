title: Build strategy -- offsite fabrication and staffing plan
date: 2026-07-17
summary: Slack deep-dive on building Isle without committing to a venue first, plus a full-venue staffing plan.
---

## Notes

- Plan: fabricate modular rooms offsite, assemble into the venue once it is locked in, avoiding a long rent burden before the game exists
- Roughly 9 months lead time from locking a venue to a very soft open
- Modules need to work just about anywhere -- minimum square footage plus tolerance for odd column placement
- Precedent: Agile Lens's "Ghosted," a site-specific Magic Leap experience fully mocked up in VR before the physical build
- Near-term: a Boston space for early local tests, then relocation to New York for a fully-fabricated popup that can handle real volume
- Staffing: full-venue plan discussed in depth, including a dedicated UX/experience designer role, 3+ technical artists, and at least 2 QA for multiplayer testing
- Build vs. buy: keep on-site/proprietary work in-house, consider contracting a mixed-reality game studio for core game design if direction is clear

```isle-diagram
{"nodes":[{"id":"vr","label":"Design in VR"},{"id":"fab","label":"Fabricate modules offsite"},{"id":"test","label":"Test in Boston space"},{"id":"lock","label":"Lock venue (funding-contingent)"},{"id":"assemble","label":"Assemble on-site"},{"id":"open","label":"Soft open"}],"edges":[{"from":"vr","to":"fab"},{"from":"fab","to":"test"},{"from":"test","to":"lock"},{"from":"lock","to":"assemble","label":"~9mo lead time"},{"from":"assemble","to":"open"}]}
```
