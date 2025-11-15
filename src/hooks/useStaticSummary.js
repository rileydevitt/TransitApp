// Hook for loading and caching the GTFS static summary data from the backend.

import { useEffect, useState } from 'react';
import isFiniteNumber from '../utils/isFiniteNumber.js';

/** Loads routes/stops/trips summary from the backend and exposes loading state. */
export default function useStaticSummary(apiBaseUrl) {
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadStaticSummary = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${apiBaseUrl}/api/static/summary`);
        if (!response.ok) {
          throw new Error(`Static summary request failed (${response.status})`);
        }
        const data = await response.json();
        if (cancelled) {
          return;
        }
        setRoutes(Array.isArray(data.routes) ? data.routes : []);
        setStops(
          Array.isArray(data.stops)
            ? data.stops.filter(
                (stop) =>
                  isFiniteNumber(stop.stop_lat) &&
                  isFiniteNumber(stop.stop_lon) &&
                  Boolean(stop.stop_id)
              )
            : []
        );
        setTrips(Array.isArray(data.trips) ? data.trips : []);
      } catch (loadError) {
        if (cancelled) {
          return;
        }
        console.error('Failed to load static GTFS summary', loadError);
        setError(loadError.message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadStaticSummary();

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl]);

  return { routes, stops, trips, loading, error };
}
