"use client";

import { useEffect } from "react";

// Console easter egg — for the curious who open devtools. An old chestnut.
export default function EasterEgg() {
  useEffect(() => {
    const teal = "color:#2dd4bf;font:13px/1.6 monospace";
    const amber = "color:#fbbf24;font:13px/1.6 monospace";
    const mist = "color:#9b9bb5;font:12px/1.6 monospace";
    // eslint-disable-next-line no-console
    console.log("%c👀 you found the console. have an old chestnut:", teal);
    // eslint-disable-next-line no-console
    console.log("%c🧨 Rage Room VR → https://tinyurl.com/rageroomvr", amber);
    // eslint-disable-next-line no-console
    console.log("%csmash virtual stuff, zero cleanup. one of Alex's earliest VR toys.", mist);
  }, []);
  return null;
}
