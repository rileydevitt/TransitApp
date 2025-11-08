export default function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}
