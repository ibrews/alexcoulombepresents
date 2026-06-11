// Ethereal background overlay — ported from Spatial Deck's bg-overlay system.
// Pure CSS animation (keyframes in globals.css); zero JS. Each page gets its
// own variant so every section of the site breathes differently.
export type EtherealVariant = "aurora" | "ember" | "ghost" | "nebula";

export default function Ethereal({ variant }: { variant: EtherealVariant }) {
  return (
    <div className={`ethereal ethereal--${variant}`} aria-hidden="true">
      {variant === "nebula" && <div className="swirl" />}
      <div className="blob b1" />
      <div className="blob b2" />
      <div className="blob b3" />
      {variant === "ghost" && <div className="blob b4" />}
    </div>
  );
}
