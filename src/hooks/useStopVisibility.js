// Hook that tracks the current map region and whether stops should be shown.

import { useCallback, useEffect, useRef, useState } from 'react';

/** Tracks map region changes and toggles stop visibility based on zoom level. */
export default function useStopVisibility(initialRegion, visibilityDelta) {
  const [showStops, setShowStops] = useState(false);
  const [visibleRegion, setVisibleRegion] = useState(initialRegion);
  const debounceRef = useRef(null);
  const visibilityRef = useRef(false);

  const evaluate = useCallback(
    (region) => {
      if (!region) {
        return;
      }
      setVisibleRegion((previous) => {
        if (
          previous &&
          Math.abs(previous.latitude - region.latitude) < 0.0001 &&
          Math.abs(previous.longitude - region.longitude) < 0.0001 &&
          Math.abs(previous.latitudeDelta - region.latitudeDelta) < 0.0001 &&
          Math.abs(previous.longitudeDelta - region.longitudeDelta) < 0.0001
        ) {
          return previous;
        }
        return region;
      });
      const shouldShow =
        region.latitudeDelta <= visibilityDelta && region.longitudeDelta <= visibilityDelta;
      if (visibilityRef.current !== shouldShow) {
        visibilityRef.current = shouldShow;
        setShowStops(shouldShow);
      }
    },
    [visibilityDelta]
  );

  const handleRegionChange = useCallback(
    (region) => {
      if (!region) {
        return;
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        evaluate(region);
      }, 150);
    },
    [evaluate]
  );

  useEffect(() => {
    evaluate(initialRegion);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [evaluate, initialRegion]);

  return { showStops, visibleRegion, handleRegionChange };
}
