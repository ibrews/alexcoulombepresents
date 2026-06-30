"use client";
import { useEffect, useRef } from "react";
import { buildAvatar } from "./avatar";

export default function AvatarCorner() {
  const svgRef = useRef<SVGSVGElement>(null);
  const avatarRef = useRef<SVGElement | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || avatarRef.current) return;
    avatarRef.current = buildAvatar(svg as unknown as SVGElement, { scale: 1 });
  }, []);

  function onEnter() { avatarRef.current?.classList.add("arm-up"); }
  function onLeave() { avatarRef.current?.classList.remove("arm-up"); }

  return (
    <svg
      ref={svgRef}
      viewBox="-18 -43 36 71"
      className="pointer-events-auto absolute right-0 top-0 w-20 cursor-default opacity-60 transition-opacity hover:opacity-100 md:w-28"
      aria-hidden="true"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    />
  );
}
