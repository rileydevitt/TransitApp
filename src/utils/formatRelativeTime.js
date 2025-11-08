export default function formatRelativeTime(timestampMs) {
  if (typeof timestampMs !== 'number') {
    return null;
  }
  const diff = Date.now() - timestampMs;
  if (diff < 0) {
    return 'just now';
  }
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) {
    return 'Just now';
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}
