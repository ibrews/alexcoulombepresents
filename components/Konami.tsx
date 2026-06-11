"use client";

import { useEffect, useState } from "react";

const SEQUENCE = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
  "b", "a",
];

export default function Konami() {
  const [toast, setToast] = useState(false);

  useEffect(() => {
    let progress = 0;
    function onKey(e: KeyboardEvent) {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === SEQUENCE[progress]) {
        progress++;
        if (progress === SEQUENCE.length) {
          progress = 0;
          document.body.classList.remove("immersive-mode");
          // restart the animation
          void document.body.offsetWidth;
          document.body.classList.add("immersive-mode");
          setToast(true);
          setTimeout(() => setToast(false), 3200);
        }
      } else {
        progress = key === SEQUENCE[0] ? 1 : 0;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!toast) return null;
  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-teal/50 bg-panel px-5 py-2.5 font-mono text-sm shadow-xl">
      <span className="text-teal">●</span> Entering immersive mode… locked at 90 fps ✨
    </div>
  );
}
