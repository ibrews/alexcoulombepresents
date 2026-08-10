title: Fractional CTO & demo strategy -- venue flow, roguelite structure, competitive intel
date: 2026-06-23
summary: Isle's venue flow and progression system, demo concepts, and a debrief on The Void's investor-facing reemergence pitch.

## Notes

- Venue flow: lobby, headset outfitting, brief orientation (up to ~20 people at a time), then into the venue to explore
- Core structure: roguelite progression -- a light overarching quest + side-quests feeding players through mini-game rooms
- Room design: roughly 15ft x 15ft, built for up to 4 players (maybe 6); a theatrical re-anchoring beat on room entry helps prevent tracking drift
- Design intent: favor score/difficulty-based repeatability over puzzle-heavy rooms (puzzles have low replay value)
- Demo concepts discussed: Alchemist's Workbench (tracked potion-mixing props) and an MR boss battle/stealth room -- both still had open design questions
- Competitive intel: The Void is planning a relaunch targeting longer sessions and higher throughput, but isn't pursuing mixed reality at all -- a clear differentiation opening for Isle
- Reference model: Matt DuPlessis's Level99 -- very high throughput at very low staffing via RFID wristbands, leaderboards, and flexible time-block ticketing instead of fixed-time tickets
- Alex agreed to be listed as fractional CTO / advisor in Isle's fundraising deck (not public-facing, to avoid signaling reduced Agile Lens focus)

```isle-diagram
{"nodes":[{"id":"lobby","label":"Lobby"},{"id":"room-a","label":"Room A"},{"id":"room-b","label":"Room B"},{"id":"room-c","label":"Room C"},{"id":"unlock","label":"Progression Unlock"}],"edges":[{"from":"lobby","to":"room-a"},{"from":"lobby","to":"room-b"},{"from":"lobby","to":"room-c"},{"from":"room-a","to":"unlock"},{"from":"room-b","to":"unlock"},{"from":"room-c","to":"unlock"},{"from":"unlock","to":"lobby","label":"next run"}]}
```
