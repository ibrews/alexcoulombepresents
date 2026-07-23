"use client";

// Thin client-side wrapper so `page.tsx` (a Server Component) can pull in
// SplatHero via next/dynamic with ssr:false — the App Router only allows
// ssr:false dynamic imports from inside a Client Component.
import dynamic from "next/dynamic";

const SplatHero = dynamic(() => import("@/components/SplatHero"), { ssr: false });

export default function SplatHeroLoader() {
  return <SplatHero />;
}
