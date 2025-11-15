// Produces a Set of vehicle ids whose timestamps exceed the stale threshold.

import { useMemo } from 'react';

/** Memoized helper that flags stale vehicles based on timestamp age. */
export default function useStaleVehicles(vehicles, staleThresholdMs) {
  return useMemo(() => {
    const now = Date.now();
    return new Set(
      vehicles
        .filter(
          (vehicle) =>
            typeof vehicle.timestampMs === 'number' && now - vehicle.timestampMs > staleThresholdMs
        )
        .map((vehicle) => vehicle.id)
    );
  }, [staleThresholdMs, vehicles]);
}
