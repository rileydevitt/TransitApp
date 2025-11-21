// Generates the list of route cards displayed in the trip planner sheet.

import { useMemo } from 'react';
import estimateEtaMinutes from '../utils/estimateEtaMinutes.js';
import formatRelativeTime from '../utils/formatRelativeTime.js';
import haversineDistanceKm from '../utils/haversineDistanceKm.js';
import estimateEtaToStop from '../utils/estimateEtaToStop.js';

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const cleanHeadsign = (headsign, routeLabel) => {
  if (!headsign || !routeLabel) {
    return headsign;
  }
  const pattern = new RegExp(`^${escapeRegExp(String(routeLabel).trim())}\\s*[-–:]*\\s*`, 'i');
  const cleaned = headsign.replace(pattern, '').trim();
  return cleaned.length > 0 ? cleaned : headsign;
};

/** Builds up to fifteen route cards combining realtime vehicles and static data. */
const MAX_ROUTE_CARDS = 15;

export default function useRouteCards({
  vehicles,
  routes,
  routesById,
  stopsById,
  tripsById,
  staleVehicles,
  userLocation
}) {
  return useMemo(() => {
    const seenRoutes = new Set();
    const stopBuckets = new Map();
    const cardsWithoutLocation = [];
    const stopsArray = Array.from(stopsById.values());
    const stopsNearUser = userLocation
      ? stopsArray
          .map((stop) => ({
            stop,
            distanceKm: haversineDistanceKm(
              userLocation.latitude,
              userLocation.longitude,
              stop.stop_lat,
              stop.stop_lon
            )
          }))
          .filter((entry) => Number.isFinite(entry.distanceKm))
          .sort((a, b) => a.distanceKm - b.distanceKm)
      : [];

    vehicles.forEach((vehicle) => {
      const route = vehicle.routeId ? routesById.get(vehicle.routeId) : null;
      const trip = vehicle.tripId ? tripsById.get(vehicle.tripId) : null;
      const stop =
        (() => {
          const rawStopId = vehicle.stopId ?? null;
          if (rawStopId !== null) {
            const direct =
              stopsById.get(rawStopId) ??
              stopsById.get(String(rawStopId)) ??
              (Number.isFinite(Number(rawStopId)) ? stopsById.get(Number(rawStopId)) : null);
            if (direct) {
              return direct;
            }
          }
          if (!Number.isFinite(vehicle.latitude) || !Number.isFinite(vehicle.longitude)) {
            return null;
          }
          const candidateStops =
            stopsNearUser.length > 0
              ? stopsNearUser.slice(0, 50).map((entry) => entry.stop)
              : stopsArray;
          let nearestStop = null;
          let nearestDistance = Infinity;
          for (let i = 0; i < candidateStops.length; i += 1) {
            const candidate = candidateStops[i];
            const dist = haversineDistanceKm(
              vehicle.latitude,
              vehicle.longitude,
              candidate.stop_lat,
              candidate.stop_lon
            );
            if (!Number.isFinite(dist)) {
              continue;
            }
            if (dist < nearestDistance) {
              nearestDistance = dist;
              nearestStop = candidate;
            }
          }
          return nearestStop;
        })();
      const stopKey = stop?.stop_id ?? vehicle.stopId ?? null;
      const key = route?.route_id ?? vehicle.routeId ?? vehicle.id;
      if (!key) {
        return;
      }

      const distanceKm =
        userLocation && stop
          ? haversineDistanceKm(
              userLocation.latitude,
              userLocation.longitude,
              stop.stop_lat,
              stop.stop_lon
            )
          : null;

      const stopDistanceKm =
        stop && Number.isFinite(vehicle.latitude) && Number.isFinite(vehicle.longitude)
          ? haversineDistanceKm(vehicle.latitude, vehicle.longitude, stop.stop_lat, stop.stop_lon)
          : null;

      const etaMinutes = Number.isFinite(stopDistanceKm)
        ? estimateEtaToStop(stopDistanceKm, vehicle.speed)
        : estimateEtaMinutes(vehicle.timestampMs);

      const routeLabel =
        route?.route_short_name ?? route?.route_long_name ?? vehicle.routeId ?? 'Route';
      const headsignRaw = trip?.trip_headsign ?? route?.route_long_name ?? 'Headsign unavailable';

      const card = {
        id: key,
        routeId: route?.route_id ?? vehicle.routeId ?? null,
        routeLabel,
        headsign: cleanHeadsign(headsignRaw, routeLabel),
        stopLabel: stop?.stop_name ?? (stopKey !== null ? `Stop ${stopKey}` : 'Stop info coming soon'),
        etaMinutes,
        warning: vehicle.congestionLevel === 'severe' ? 'Delayed' : null,
        vehicleId: vehicle.id,
        isStale: staleVehicles.has(vehicle.id),
        updatedLabel: vehicle.timestampMs ? formatRelativeTime(vehicle.timestampMs) : null,
        distanceKm
      };

      if (Number.isFinite(distanceKm)) {
        const bucketKey = stopKey ?? vehicle.stopId;
        if (!stopBuckets.has(bucketKey)) {
          stopBuckets.set(bucketKey, {
            stopId: bucketKey,
            distanceKm,
            cards: []
          });
        }
        stopBuckets.get(bucketKey).cards.push(card);
      } else {
        cardsWithoutLocation.push(card);
      }
    });

    // Start from the closest stops and keep expanding outward until full.
    const sortedBuckets = Array.from(stopBuckets.values()).sort(
      (a, b) => a.distanceKm - b.distanceKm
    );

    const prioritizedCards = [];
    for (const bucket of sortedBuckets) {
      for (const card of bucket.cards) {
        if (seenRoutes.has(card.id)) {
          continue;
        }
        seenRoutes.add(card.id);
        prioritizedCards.push(card);
        if (prioritizedCards.length >= MAX_ROUTE_CARDS) {
          break;
        }
      }
      if (prioritizedCards.length >= MAX_ROUTE_CARDS) {
        break;
      }
    }

    // If there are still slots, fill with any remaining vehicles lacking stop distance.
    if (prioritizedCards.length < MAX_ROUTE_CARDS) {
      for (const card of cardsWithoutLocation) {
        if (seenRoutes.has(card.id)) {
          continue;
        }
        seenRoutes.add(card.id);
        prioritizedCards.push(card);
        if (prioritizedCards.length >= MAX_ROUTE_CARDS) {
          break;
        }
      }
    }

    if (prioritizedCards.length === 0) {
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

    return prioritizedCards.slice(0, MAX_ROUTE_CARDS);
  }, [routes, routesById, staleVehicles, stopsById, tripsById, userLocation, vehicles]);
}
