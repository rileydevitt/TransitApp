// Formats ISO timestamps into a human readable time of day.

/** Formats a timestamp-ish input into HH:MM local time or a fallback string. */
export default function formatTime(value) {
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'unavailable';
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (error) {
    return 'unavailable';
  }
}
