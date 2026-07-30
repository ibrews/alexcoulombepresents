// A browser-safe, in-memory signal shared by the two independent hero layers.
// It deliberately carries no payload: a new morph is enough information for
// FaceField to generate a fresh constellation.
type HeroPulseListener = () => void;

const listeners = new Set<HeroPulseListener>();

export function pulseHeroConstellation() {
  for (const listener of listeners) listener();
}

export function subscribeToHeroPulse(listener: HeroPulseListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
