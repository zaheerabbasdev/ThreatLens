/**
 * Deterministic avatar color derived from a seed string (e.g. user id).
 * No external avatar service is called — avoids leaking user identifiers to
 * a third party and keeps avatars stable without storing images.
 *
 * Each color doubles as its own initials text color AND its ~15%-opacity
 * background tint (see Avatar.tsx), which is a harder contrast bar than
 * these hues clear against a plain surface — four of the six were lifted in
 * lightness (hue/saturation unchanged) to hold 4.5:1 against their own tint
 * on every app background (canvas/surface/elevated).
 */
const PALETTE = [
  "#7AA3F4",
  "#68A7EB",
  "#35B97F",
  "#F2994A",
  "#73A4F5",
  "#9BA4B3",
] as const;

export function seedToColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index] ?? PALETTE[0];
}
