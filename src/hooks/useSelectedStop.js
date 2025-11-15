// Derives currently active stop information based on selection or vehicle data.

import { useMemo } from 'react';

/** Resolves the active stop id and returns the corresponding stop record. */
export default function useSelectedStop(selectedStopId, selectedVehicle, stopsById) {
  const activeStopId = selectedStopId ?? selectedVehicle?.stopId ?? null;

  const selectedStop = useMemo(() => {
    if (!activeStopId) {
      return null;
    }
    return stopsById.get(activeStopId) ?? null;
  }, [activeStopId, stopsById]);

  return { activeStopId, selectedStop };
}
