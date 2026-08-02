// ── Homepage "Featured in:" marquee ─────────────────────────────────────
//
// `url`, when present, must clear this bar, in order of preference:
//   1) an actual video/recording of the talk or appearance
//   2) the actual deck
//   3) the conference's listing for his specific session
//   4) anything else that names Alex or Agile Lens specifically
// A generic conference/org homepage doesn't show what role he played —
// that's worse than no link, not better. No qualifying link → omit `url`
// and the marquee renders that name as plain (unlinked, non-highlighting)
// text. Sourced from the same appearances research as lib/appearances.ts.
//
// 2026-08-02 audit: several links here were the KB source doc's own
// citations, which turned out to be systematically unreliable — an
// auto-extraction artifact attaches ONE video's link to EVERY topic that
// video's transcript mentions, not just the one it's actually about (e.g.
// "GDC" was originally linked to a recording of an unrelated POWER UP /
// Dance Ireland talk that merely name-drops GDC in passing). Verify a
// citation's real title (YouTube oEmbed is fast and free) before trusting
// it, and prefer reattributing a real link to its correct entry over
// discarding it.

export type Venue = {
  name: string;
  url?: string;
};

export const venues: Venue[] = [
  { name: "SIGGRAPH", url: "https://s2026.conference-schedule.org/presenter/?uid=645453" },
  { name: "HarvardXR" },
  { name: "Unreal Fest", url: "https://www.unrealengine.com/en-US/events/unreal-fest-2022-sessions?sessionInvalidated=true" },
  { name: "Unreal Day", url: "https://youtu.be/9q7GIQVh2Nc" },
  { name: "Venice Biennale", url: "https://www.labiennale.org/en/cinema/2019" },
  { name: "AWE", url: "https://youtu.be/BWxtAOM_I8Y" },
  { name: "FMX" },
  { name: "NXT BLD", url: "https://www.youtube.com/watch?v=ulJaAzDqn9w" },
  { name: "PMRE" },
  { name: "Lincoln Center" },
  { name: "Autodesk University", url: "https://vimeo.com/243184988" },
  { name: "Raindance Immersive" },
  { name: "Park Avenue Armory" },
  { name: "Theatre Communications Group", url: "https://circle.tcg.org/tcg19/home?ssopc=1" },
  { name: "USITT", url: "https://s7.goeshow.com/usitt/annual/2022/Conference_Schedule.cfm?session_key=F95C7FBA-90B1-1C06-DFD2-AB9DB72A6D5D" },
  { name: "NXT DEV" },
  { name: "NATEAC" },
  { name: "Opera America" },
  { name: "VRTO" },
  { name: "Columbia" },
  { name: "Princeton" },
  { name: "Cornell" },
  { name: "Yale" },
  { name: "GDC" },
  { name: "NVIDIA GTC", url: "https://vimeo.com/641004744/60806b3a28" },
  { name: "SXSW", url: "https://schedule.sxsw.com/2019/events/PP93017" },
  { name: "MIT", url: "https://devpost.com/software/the-fourth-illusion" },
  { name: "NYU" },
  { name: "Smithsonian" },
  { name: "ViveCon", url: "https://youtu.be/qnqlweu0odo?t=1422" },
  { name: "SVVR", url: "https://youtu.be/9q7GIQVh2Nc" },
  { name: "NYVR", url: "https://www.youtube.com/watch?v=GhaCYfanRB4" },
  { name: "Laval Virtual", url: "https://youtu.be/9NDVXdQgWuc?t=1995" },
  { name: "AIA", url: "https://aiafla.org/2021-convention_schedule.cfm" },
  { name: "Syracuse University" },
  { name: "Worlds in Play" },
  { name: "North Bend Film Festival", url: "http://collider.com/north-bend-film-fest-2019-awards/" },
  { name: "NY Tech Week" },
  { name: "SensAI", url: "https://sensaihack.com/worldsinaction-2-la/" },
  { name: "XR Bootcamp", url: "https://youtu.be/BWxtAOM_I8Y" },
  { name: "Total Chaos", url: "https://www.youtube.com/watch?v=gWlV4NgVWjo" },
  { name: "Im-Arch", url: "https://www.youtube.com/watch?v=7nWJqMw-v5Q" },
  { name: "5th Wall Forum" },
  { name: "Next Stage Immersive Summit" },
  { name: "RealTime Conference", url: "https://realtimeconference.com/videos/" },
  { name: "IEEE GEM" },
  { name: "Virtual Reality Strategy Conference" },
  { name: "ITEAC" },
  { name: "VR 20/20", url: "https://twitter.com/DipakPatel/status/919994810173394944" },
  { name: "VenueConnect", url: "https://www.youtube.com/watch?v=96CMiNrmz1E" },
  { name: "NYIT", url: "https://openlab.citytech.cuny.edu/fuselab/event/intersections-2014/" },
  { name: "Meta Connect", url: "https://www.uploadvr.com/alex-coulombe-orion-glasses-hands-on/" },
  { name: "UploadVR", url: "https://www.uploadvr.com/alex-coulombe-orion-glasses-hands-on/" },
  { name: "NY Times", url: "https://www.nytimes.com/2012/06/24/arts/music/stockhausens-gruppen-at-park-avenue-armory.html" },
  { name: "AR Insider" },
  { name: "Road to VR" },
];
