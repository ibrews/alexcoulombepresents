"use client";

import Link from "next/link";
import { forwardRef, type ComponentPropsWithoutRef, type RefObject } from "react";
import { isExternal, type HeroNodeLink } from "@/lib/heroLinks";

/**
 * The DOM half of a link-node constellation: one hit-target per node, each
 * carrying its own tooltip.
 *
 * Shared by FaceField (homepage hero) and ParticleField (/lab). The canvas
 * half lives in lib/linkNodes.ts; this component owns nothing but the anchors
 * and their labels, and deliberately does no positioning of its own — the
 * host's RAF loop writes `transform` straight onto the refs it hands in, which
 * keeps 9–13 moving targets off React's render path entirely.
 */

/**
 * The hit-targets are a mix: most route inside the site, but the external tier
 * points at talk videos, press pieces and GitHub. next/link would try to
 * client-route an absolute URL, so those get a plain anchor with the usual
 * new-tab safety. Both forward a ref, since the RAF loop drives their
 * transforms directly.
 */
const LinkOrAnchor = forwardRef<
  HTMLAnchorElement,
  { href: string; external: boolean } & Omit<ComponentPropsWithoutRef<"a">, "href">
>(function LinkOrAnchor({ href, external, children, ...rest }, ref) {
  if (external) {
    return (
      <a ref={ref} href={href} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link ref={ref} href={href} {...rest}>
      {children}
    </Link>
  );
});

export type TooltipPlacement = { below: boolean; align: string };

export default function LinkNodeAnchors({
  links,
  active,
  coarse,
  tip,
  anchorRefs,
  onActivate,
}: {
  links: HeroNodeLink[];
  active: number | null;
  coarse: boolean;
  tip: TooltipPlacement;
  anchorRefs: RefObject<(HTMLAnchorElement | null)[]>;
  onActivate: (index: number | null) => void;
}) {
  return (
    // aria-hidden + tabIndex -1 is deliberate: these are a decorative second
    // route to pages that all already appear in Nav, Footer and the ⌘K
    // palette, and a dozen unlabeled floating dots injected into the tab order
    // right after the header would be a downgrade, not a feature.
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {links.map((link, i) => {
        const isActive = active === i;
        // Off-site destinations open in a new tab and say so, so a field dot
        // is never a trapdoor out of the site.
        const external = isExternal(link);
        const below = isActive && tip.below;
        const align =
          isActive && tip.align === "right"
            ? "right-1/2 translate-x-4"
            : isActive && tip.align === "left"
              ? "left-1/2 -translate-x-4"
              : "left-1/2 -translate-x-1/2";
        return (
          <LinkOrAnchor
            key={link.href}
            href={link.href}
            external={external}
            ref={(el) => {
              anchorRefs.current[i] = el;
            }}
            tabIndex={-1}
            // Fine pointers: hover locks it. Coarse: first tap locks and
            // previews, second tap on the same node follows the link.
            onPointerEnter={() => {
              if (!coarse) onActivate(i);
            }}
            onPointerLeave={() => {
              if (!coarse) onActivate(null);
            }}
            onClick={(e) => {
              if (coarse && !isActive) {
                e.preventDefault();
                onActivate(i);
              }
            }}
            // z-20 only while active. The imperative transform makes every
            // anchor its own stacking context, so a tooltip can never escape
            // it — raising the whole anchor is what lifts the label above the
            // headline. Inactive anchors stay in the low layer so a stray
            // 44px hit-target can never sit on top of a real CTA button.
            className={`pointer-events-auto absolute left-0 top-0 flex items-center justify-center rounded-full will-change-transform ${
              isActive ? "z-20" : ""
            } ${coarse ? "h-14 w-14" : "h-11 w-11"}`}
          >
            <span
              className={`glass pointer-events-none absolute w-max max-w-[15rem] rounded-xl px-3 py-2 text-left transition-all duration-200 ${align} ${
                below ? "top-full mt-2" : "bottom-full mb-2"
              } ${isActive ? "translate-y-0 opacity-100" : `${below ? "-translate-y-1" : "translate-y-1"} opacity-0`}`}
            >
              <span className="block text-sm font-semibold leading-snug text-snow">
                {link.label}
                {external && <span className="ml-1 text-mist">↗</span>}
              </span>
              <span className="mt-0.5 block font-mono text-[10px] leading-tight text-mist">
                {link.kicker}
              </span>
            </span>
          </LinkOrAnchor>
        );
      })}
    </div>
  );
}
