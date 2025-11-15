// Hook responsible for fetching and caching trip shape coordinate arrays.

import { useEffect, useMemo, useState } from 'react';
import isFiniteNumber from '../utils/isFiniteNumber.js';

/** Fetches and caches shape coordinate arrays for the selected trip. */
export default function useShapeCoordinates(selectedTrip, apiBaseUrl) {
  const [shapeCache, setShapeCache] = useState(() => new Map());
  const [error, setError] = useState(null);

  const shapeId = selectedTrip?.shape_id ?? null;

  useEffect(() => {
    if (!shapeId || shapeCache.has(shapeId)) {
      return;
    }

    let cancelled = false;

    const fetchShape = async () => {
      try {
        const response = await fetch(
          `${apiBaseUrl}/api/static/shape?shapeId=${encodeURIComponent(shapeId)}`
        );
        if (!response.ok) {
          throw new Error(`Shape request failed (${response.status})`);
        }

        const data = await response.json();
        if (cancelled) {
          return;
        }

        const coordinates = (data.points ?? [])
          .filter(
            (point) =>
              isFiniteNumber(point.shape_pt_lat) && isFiniteNumber(point.shape_pt_lon)
          )
          .map((point) => ({
            latitude: Number(point.shape_pt_lat),
            longitude: Number(point.shape_pt_lon)
          }));

        setShapeCache((previous) => {
          if (previous.has(shapeId)) {
            return previous;
          }
          const next = new Map(previous);
          next.set(shapeId, coordinates);
          return next;
        });
        setError(null);
      } catch (fetchError) {
        if (cancelled) {
          return;
        }
        console.error('Failed to load shape data', fetchError);
        setError(fetchError.message);
      }
    };

    fetchShape();

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, shapeCache, shapeId]);

  const coordinates = useMemo(() => {
    if (!shapeId) {
      return null;
    }
    return shapeCache.get(shapeId) ?? null;
  }, [shapeCache, shapeId]);

  return { selectedShapeCoordinates: coordinates, shapeError: error };
}
