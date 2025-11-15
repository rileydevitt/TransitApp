// Utility to sanitize arbitrary GTFS color strings into valid hex values.

/** Converts GTFS color strings into hex colors, falling back when invalid. */
export default function normaliseColor(value, fallback) {
  if (!value) {
    return fallback;
  }
  return value.startsWith('#') ? value : `#${value}`;
}
