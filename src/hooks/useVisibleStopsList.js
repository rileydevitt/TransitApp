// Filters raw stops down to those within the currently visible map region.

import { useMemo } from 'react';

/** Returns the subset of stops within the padded visible region bounds. */
export default function useVisibleStopsList({
  showStops,
  stops,
  visibleRegion,
  fallbackRegion,
  paddingFactor
}) {
  return useMemo(() => {
    if (!showStops || !stops.length) {
      return [];
    }

    const region = visibleRegion ?? fallbackRegion;
    const latitude = region.latitude ?? fallbackRegion.latitude;
    const longitude = region.longitude ?? fallbackRegion.longitude;
    const latitudeDelta = Math.max(region.latitudeDelta ?? fallbackRegion.latitudeDelta, 0.0005);
    const longitudeDelta = Math.max(region.longitudeDelta ?? fallbackRegion.longitudeDelta, 0.0005);
    const latHalf = latitudeDelta * (0.5 + paddingFactor);
    const lonHalf = longitudeDelta * (0.5 + paddingFactor);
    const latMin = latitude - latHalf;
    const latMax = latitude + latHalf;
    const lonMin = longitude - lonHalf;
    const lonMax = longitude + lonHalf;

    return stops.filter((stop) => {
      const stopLat = Number(stop.stop_lat);
      const stopLon = Number(stop.stop_lon);
      if (!Number.isFinite(stopLat) || !Number.isFinite(stopLon)) {
        return false;
      }
      return stopLat >= latMin && stopLat <= latMax && stopLon >= lonMin && stopLon <= lonMax;
    });
  }, [fallbackRegion, paddingFactor, showStops, stops, visibleRegion]);
}
