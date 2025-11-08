export default function normaliseColor(value, fallback) {
  if (!value) {
    return fallback;
  }
  return value.startsWith('#') ? value : `#${value}`;
}
