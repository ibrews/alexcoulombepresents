// ── Homepage "Featured in:" marquee ─────────────────────────────────────
//
// `url`, when present, must point at something specific to Alex being
// there — his own talk recording, a session page with his name on it, a
// press piece about him, an official-selection listing for his work — not
// a conference's generic homepage. Every `url` below is the exact link the
// AgileLens KB research cited alongside that specific claim (not a
// homepage guessed after the fact). No specific citation → omit `url` and
// the marquee renders that name as plain (unlinked, non-highlighting) text.
// Sourced from the same appearances research as lib/appearances.ts.

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
  { name: "NXT BLD", url: "https://nxtbld.com/web-stream-2021/" },
  { name: "PMRE", url: "https://www.pmreconference.com/" },
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
  { name: "Yale", url: "https://ieee-gem.space/" },
  { name: "GDC", url: "https://youtu.be/X6MWshB0JL8?t=2820" },
  { name: "NVIDIA GTC", url: "https://vimeo.com/641004744/60806b3a28" },
  { name: "SXSW", url: "https://schedule.sxsw.com/2019/events/PP93017" },
  { name: "MIT", url: "https://devpost.com/software/the-fourth-illusion" },
  { name: "NYU" },
  { name: "Smithsonian", url: "https://www.si.edu/" },
  { name: "ViveCon", url: "https://youtu.be/qnqlweu0odo?t=1422" },
  { name: "SVVR" },
  { name: "NYVR", url: "https://www.nyvrexpo.com/" },
  { name: "Laval Virtual", url: "https://youtu.be/9NDVXdQgWuc?t=1995" },
  { name: "AIA", url: "https://aiafla.org/2021-convention_schedule.cfm" },
  { name: "Syracuse University" },
  { name: "Worlds in Play", url: "https://youtu.be/Y8HOQPpkRPg" },
  { name: "North Bend Film Festival", url: "http://collider.com/north-bend-film-fest-2019-awards/" },
  { name: "NY Tech Week" },
  { name: "SensAI", url: "https://sensaihack.com/worldsinaction-2-la/" },
  { name: "XR Bootcamp", url: "https://youtu.be/BWxtAOM_I8Y" },
  { name: "Total Chaos", url: "https://www.youtube.com/watch?v=gWlV4NgVWjo" },
  { name: "Im-Arch", url: "https://www.youtube.com/watch?v=7nWJqMw-v5Q" },
  { name: "5th Wall Forum", url: "http://5thwallforum.com/" },
  { name: "Next Stage Immersive Summit", url: "https://youtu.be/7GH-bPLj_NM" },
  { name: "RealTime Conference", url: "https://realtimeconference.com/videos/" },
  { name: "IEEE GEM", url: "https://ieee-gem.space/" },
  { name: "Virtual Reality Strategy Conference", url: "https://www.vrsconference.com/" },
  { name: "ITEAC", url: "https://www.iteac.co.uk/" },
  { name: "VR 20/20", url: "https://twitter.com/DipakPatel/status/919994810173394944" },
  { name: "VenueConnect", url: "https://www.youtube.com/watch?v=96CMiNrmz1E" },
  { name: "NYIT", url: "https://openlab.citytech.cuny.edu/fuselab/event/intersections-2014/" },
];
