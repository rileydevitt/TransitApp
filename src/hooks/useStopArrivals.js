// Computes vehicle arrival entries for a selected stop.

import { useMemo } from 'react';
import haversineDistanceKm from '../utils/haversineDistanceKm.js';
import estimateEtaToStop from '../utils/estimateEtaToStop.js';

/** Builds the ordered list of arrivals approaching the focused stop. */
export default function useStopArrivals({
  selectedStopId,
  selectedStop,
  vehicles,
  routesById,
  tripsById,
  staleVehicles
}) {
  return useMemo(() => {
    if (!selectedStopId || !selectedStop) {
      return [];
    }
    return vehicles
      .map((vehicle) => {
        const distanceKm = haversineDistanceKm(
          vehicle.latitude,
          vehicle.longitude,
          Number(selectedStop.stop_lat),
          Number(selectedStop.stop_lon)
        );
        if (!Number.isFinite(distanceKm)) {
          return null;
        }
        const route = vehicle.routeId ? routesById.get(vehicle.routeId) : null;
        const trip = vehicle.tripId ? tripsById.get(vehicle.tripId) : null;
        const etaMinutes = estimateEtaToStop(distanceKm, vehicle.speed);
        return {
          id: vehicle.id,
          routeLabel:
            route?.route_short_name ?? route?.route_long_name ?? vehicle.routeId ?? 'Route',
          headsign: trip?.trip_headsign ?? 'Inbound service',
          etaMinutes,
          timestamp: vehicle.timestamp,
          distanceLabel:
            distanceKm < 1
              ? `${(distanceKm * 1000).toFixed(0)} m away`
              : `${distanceKm.toFixed(1)} km away`,
          isStale: staleVehicles.has(vehicle.id)
        };
      })
      .filter((item) => item && item.etaMinutes !== null && item.etaMinutes < 120)
      .sort((a, b) => (a.etaMinutes ?? Infinity) - (b.etaMinutes ?? Infinity));
  }, [routesById, selectedStop, selectedStopId, staleVehicles, tripsById, vehicles]);
}
