# Surreal Minds diary media

Published by Alex Coulombe Presents, updated 2026-10-13. These are development captures,
not a release or partner endorsement. Originals remain unchanged on the production
team's media volume. Web copies are H.264/yuv420p MP4 with fast-start metadata and WebP.

| Web file | Original capture / treatment | Surface and backend |
| --- | --- | --- |
| creature-emulator-interaction.mp4 | October 7 creature-01-captioned.mp4; resized to 960 px; silent copy; original title bar/captions retained | PICO emulator window, scripted controller input; no runtime AI |
| conservatory-ai-wishes.mp4 | October 8 conservatory-v5-wishes-native.mp4; 16-second sampled edit of ~46 seconds; screenshots about 3 seconds apart; original wish/reply overlays retained | PICO emulator native app renders; LAN gemma3:4b on Archie through Fort |
| memory-quest-v14a-single-eye.mp4 | Seconds 10–23 of the existing 28-second diary excerpt from October 12 memory-v14a-take1.mp4 (127.7 s original); 13 continuous seconds; left-eye crop, resized to 960 px; silent original. Black frames and app exit excluded | Quest 3 headset; SmolVLM-500M caption on headset + Depth Anything V2 Small depth on Fort |
| memory-v15-toy-snow.webp | October 12 v15 desktop-first/memory-photo-step3.png | Native Unreal desktop; cloud vision via PC |
| memory-v15-toy-beach.webp | October 12 v15 desktop-first/memory-photo-step1.png | Native Unreal desktop; cloud vision via PC |
| memory-v15-toy-garden.webp | October 12 v15 desktop-garden-harbour/memory-photo-step1.png | Native Unreal desktop; cloud vision via PC |
| seaside-input.webp | Bundled seaside-sunset.jpg synthetic fixture | Project-generated input; no personal photo |
| seaside-cloud-boxes.webp | October 12 v15 grounding/seaside-sunset-boxes.jpg | Host visualization of recorded cloud object boxes; not headset imagery |
| tabletop-es31-editor-sheet.webp | Prior draft's four-frame v15 mobile-preview sheet | Unreal ES3.1 desktop preview; authored gameplay, no runtime AI |
| creature-es31-editor-sheet.webp | Prior draft's four-frame v10 mobile-preview sheet | Unreal ES3.1 desktop preview; authored gameplay, no runtime AI |

Each new MP4 has a matching `-poster.webp` from two seconds into its web copy
(eight seconds for the Quest reveal).
No clip is presented as physical Swan performance. No generated scene image replaces
native evidence. The website's same-photo cards are editorial renderings of recorded
model/validator outputs, not newly executed inference or matched native app renders.

The on-device card uses the October 9 Quest SmolVLM caption-mode CLI result (9.095 s
wall time). Its raw sentence trailed off; the validated caption and deterministic
scene palette are displayed. LAN uses the October 12 seaside recheck (7.408 s client,
6.875 s inference). Cloud uses the recorded seaside grounding result (11.890 s bridge).
Later Quest in-app caption timings, 19.950 and 26.379 s, are kept separate in the table.

Older draft media remains for stable URLs; it is not the current diary's video selection.
The October 12 selection uses the three MP4s above, each with an adjacent
surface/backend label and an explanation of the edit. None contains spoken dialogue.

## October 13: Memory Portal v16 matched backend capture

`memory-v16-backend-comparison.mp4` and its matching `-poster.webp` come from one
native Unreal desktop session on Fort, using the identical bundled seaside photo
through Cloud, LAN PC and the local caption code path. They are not headset video.
The app preserves the previous result while another backend reads and labels that
state. The local route is visibly labeled caption-only / approximate.

- Client source: `ibrews/memory-portal` commit `71585430aa571dbd1a402f39eb2fab4c520cd799`.
- Bridge source: `197c3bade2d08b6326ee24bf25020de806d5629d`.
- Original evidence: `H:/XR/ShowcaseRefresh/20261013-MemoryV16/media/desktop-compare/`,
  including `native.log`, exact bridge replies and timestamped native PNG samples.
- Samples: 400 cloud, 99 LAN and 75 local frames at up to 5 Hz. Actual timestamp
  spacing is retained in the intermediate frame sequences. Dedicated final shots
  occasionally supersede a same-tick sample; no synthetic interpolation is used.
- Edit: three sequential reads aligned at their respective READ action, 4x playback,
  then held at each result. 1920×620 H.264/yuv420p, silent, fast-start metadata.
  The poster is from two seconds before the end. Only labels, scale and layout are
  editorial additions; the app images are native renders.
- Observed read through assembly: cloud 73.416 s, LAN 12.210 s, local 6.692 s.
  Cloud includes 57.578 s of cold detector-library/model loading and 10.962 s of
  Gemini inference. LAN reused warm detectors. These are not comparable warm-start
  speed claims; the local desktop timing is not a Quest measurement.
- Cloud: Gemini Flash via PC plus independent detectors. LAN: Gemma 3 4B on Archie,
  OWLv2 / selective Grounding DINO on Fort. Local code path: bundled SmolVLM-500M
  on the desktop, with heuristic primitive placement rather than learned grounding.

The page retains the earlier cards as a clearly dated historical study. Its new
v16 section records Alex's v15 Quest verdict without claiming a v16 wearer verdict.
