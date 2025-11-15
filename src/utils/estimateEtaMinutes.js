// Provides a coarse ETA from the realtime timestamp alone.

/** Provides a fallback ETA purely from how recent the timestamp is. */
export default function estimateEtaMinutes(timestampMs) {
  if (typeof timestampMs !== 'number') {
    return null;
  }
  const diffMinutes = Math.max(0, Math.round((Date.now() - timestampMs) / 60000));
  return Math.max(1, 5 + diffMinutes);
}
