// Generates the list of route cards displayed in the trip planner sheet.

import { useMemo } from 'react';
import estimateEtaMinutes from '../utils/estimateEtaMinutes.js';
import formatRelativeTime from '../utils/formatRelativeTime.js';

/** Builds up to five route cards combining realtime vehicles and static data. */
const MAX_ROUTE_CARDS = 15;

export default function useRouteCards({ vehicles, routes, routesById, stopsById, tripsById, staleVehicles }) {
  return useMemo(() => {
    const items = [];
    const seen = new Set();

    vehicles.forEach((vehicle) => {
      const route = vehicle.routeId ? routesById.get(vehicle.routeId) : null;
      const trip = vehicle.tripId ? tripsById.get(vehicle.tripId) : null;
      const stop = vehicle.stopId ? stopsById.get(vehicle.stopId) : null;
      const key = route?.route_id ?? vehicle.routeId ?? vehicle.id;
      if (!key || seen.has(key)) {
        return;
      }
      seen.add(key);
      const etaMinutes = estimateEtaMinutes(vehicle.timestampMs);
      items.push({
        id: key,
        routeId: route?.route_id ?? vehicle.routeId ?? null,
        routeLabel:
          route?.route_short_name ?? route?.route_long_name ?? vehicle.routeId ?? 'Route',
        headsign: trip?.trip_headsign ?? route?.route_long_name ?? 'Headsign unavailable',
        stopLabel: stop?.stop_name ?? 'Stop info coming soon',
        etaMinutes,
        warning: vehicle.congestionLevel === 'severe' ? 'Delayed' : null,
        vehicleId: vehicle.id,
        isStale: staleVehicles.has(vehicle.id),
        updatedLabel: vehicle.timestampMs ? formatRelativeTime(vehicle.timestampMs) : null
      });
    });

    if (items.length === 0) {
      return routes.slice(0, MAX_ROUTE_CARDS).map((route, index) => ({
        id: route.route_id ?? `route-${index}`,
        routeId: route.route_id ?? null,
        routeLabel: route.route_short_name ?? route.route_long_name ?? `Route ${index + 1}`,
        headsign: route.route_long_name ?? 'Service info pending',
        stopLabel: 'Searching nearby stops…',
        etaMinutes: null,
        warning: null,
        vehicleId: null,
        isStale: false,
        updatedLabel: null
      }));
    }

    return items.slice(0, MAX_ROUTE_CARDS);
  }, [routes, routesById, staleVehicles, stopsById, tripsById, vehicles]);
}
