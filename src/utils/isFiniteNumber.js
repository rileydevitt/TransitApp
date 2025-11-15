// Type guard that accepts only finite numeric values.

/** Narrows arbitrary input to finite numbers only. */
export default function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}
