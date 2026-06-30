"use client";
import { useEffect, useRef, useState } from "react";

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export default function CounterStat({
  n,
  label,
  delay = 0,
}: {
  n: string;
  label: string;
  delay?: number;
}) {
  const match = n.match(/^(\d+)(.*)$/);
  const target = match ? parseInt(match[1]) : 0;
  const suffix = match ? match[2] : "";

  const [display, setDisplay] = useState(0);
  const hasRun = useRef(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasRun.current) {
          hasRun.current = true;
          obs.disconnect();
          setTimeout(() => {
            const duration = 1200;
            const start = performance.now();
            function frame(now: number) {
              const t = Math.min((now - start) / duration, 1);
              setDisplay(Math.floor(easeOut(t) * target));
              if (t < 1) requestAnimationFrame(frame);
              else setDisplay(target);
            }
            requestAnimationFrame(frame);
          }, delay);
        }
      },
      { threshold: 0.4 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [delay, target]);

  return (
    <div ref={ref} className="glass rounded-2xl p-5 md:p-6">
      <p className="grad-text text-4xl font-bold tabular-nums md:text-5xl">
        {display}
        {suffix}
      </p>
      <p className="mt-2 text-sm leading-snug text-mist">{label}</p>
    </div>
  );
}
