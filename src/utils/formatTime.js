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
