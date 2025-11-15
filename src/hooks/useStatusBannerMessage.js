// Produces the banner message shown at the top of the screen.

import { useMemo } from 'react';

/** Chooses the highest-priority error/status message to show the user. */
export default function useStatusBannerMessage({ staticError, realtimeError, locationError }) {
  return useMemo(() => {
    if (staticError) {
      return 'Static GTFS data unavailable. Check backend.';
    }
    if (realtimeError) {
      return 'Realtime feed unreachable. Showing last known locations.';
    }
    if (locationError) {
      return 'Location unavailable. Enable permissions to center on you.';
    }
    return null;
  }, [locationError, realtimeError, staticError]);
}
