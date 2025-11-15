// Numeric clamp helper that bounds a value within min/max.

/** Clamps a numeric value between the provided min and max bounds. */
export default function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
