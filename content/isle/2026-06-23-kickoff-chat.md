title: Kickoff -- Isle concept and advisor role
date: 2026-06-23
summary: First working session on Isle's mixed-reality game-room concept and Alex's advisor role.
---

## Notes

- Anjali's venture Isle: themed mixed-reality game rooms, up to 20 people per session, using headsets like the Pico Swan
- Core concept: a roguelite progression system built from modular mini-game rooms
- Fundraising target: $750K pre-seed, to build one gameplay module demonstrable at venues
- Alex shared lessons from The Void's reinvention work -- their throughput/timing challenges in 45-minute experiences are a cautionary reference for Isle's session design
- Alex agreed to be listed as fractional CTO / advisor in Isle's fundraising deck
- Open items per the meeting record: Anjali to write a demo-experience spec (MVP + stretch goals); Alex to review it and give feedback on the fundraising deck

```isle-diagram
{"nodes":[{"id":"lobby","label":"Lobby"},{"id":"room-a","label":"Room A"},{"id":"room-b","label":"Room B"},{"id":"room-c","label":"Room C"},{"id":"unlock","label":"Progression Unlock"}],"edges":[{"from":"lobby","to":"room-a"},{"from":"lobby","to":"room-b"},{"from":"lobby","to":"room-c"},{"from":"room-a","to":"unlock"},{"from":"room-b","to":"unlock"},{"from":"room-c","to":"unlock"},{"from":"unlock","to":"lobby","label":"next run"}]}
```
