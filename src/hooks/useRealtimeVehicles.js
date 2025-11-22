// Hook that polls realtime vehicle positions and normalizes their payload.

import { useEffect, useState } from 'react';
import isFiniteNumber from '../utils/isFiniteNumber.js';

const vehiclesEqual = (a, b) => {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i += 1) {
    const va = a[i];
    const vb = b[i];
    if (va.id !== vb.id || va.timestampMs !== vb.timestampMs) {
      return false;
    }
  }
  return true;
};

/** Polls realtime vehicle feed on a fixed interval and normalizes responses. */
export default function useRealtimeVehicles(apiBaseUrl, refreshIntervalMs) {
  const [vehicles, setVehicles] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let controller = new AbortController();

    const fetchVehicles = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/realtime/vehicles`, {
          signal: controller.signal
        });
        if (!response.ok) {
          throw new Error(`Realtime vehicles request failed (${response.status})`);
        }
        const payload = await response.json();
        if (cancelled) {
          return;
        }
        const nowVehicles = (payload.vehicles ?? [])
          .filter(
            (vehicle) =>
              isFiniteNumber(vehicle.position?.latitude) &&
              isFiniteNumber(vehicle.position?.longitude)
          )
          .map((vehicle) => {
            const timestampMs = vehicle.timestamp ? Date.parse(vehicle.timestamp) : null;
            return {
              id: vehicle.vehicleId || vehicle.entityId || `vehicle-${vehicle.routeId ?? 'unknown'}`,
              routeId: vehicle.routeId ?? null,
              tripId: vehicle.tripId ?? null,
              directionId: vehicle.directionId ?? null,
              latitude: Number(vehicle.position.latitude),
              longitude: Number(vehicle.position.longitude),
              bearing: vehicle.position.bearing ?? null,
              speed: vehicle.position.speed ?? null,
              timestamp: vehicle.timestamp ?? null,
              timestampMs,
              currentStopSequence: vehicle.currentStopSequence ?? null,
              stopId: vehicle.stopId ?? null,
              congestionLevel: vehicle.congestionLevel ?? null,
              scheduleRelationship: vehicle.scheduleRelationship ?? null,
              label: vehicle.label ?? null,
              licensePlate: vehicle.licensePlate ?? null
            };
          });

        setVehicles((prev) => (vehiclesEqual(prev, nowVehicles) ? prev : nowVehicles));
        setError(null);
      } catch (fetchError) {
        if (cancelled || fetchError.name === 'AbortError') {
          return;
        }
        console.error('Failed to load realtime vehicles', fetchError);
        setError(fetchError.message);
      }
    };

    fetchVehicles();
    const interval = setInterval(() => {
      controller.abort();
      controller = new AbortController();
      fetchVehicles();
    }, refreshIntervalMs);

    return () => {
      cancelled = true;
      controller.abort();
      clearInterval(interval);
    };
  }, [apiBaseUrl, refreshIntervalMs]);

  return { vehicles, error };
}
