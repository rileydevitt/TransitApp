// Manages pinned routes with AsyncStorage persistence.

import { useEffect, useMemo, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@pinnedRoutes';
const MAX_PINS = 4;

export default function usePinnedRoutes() {
  const [pinnedRoutes, setPinnedRoutes] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled) {
          return;
        }
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setPinnedRoutes(parsed.slice(0, MAX_PINS));
          }
        }
      } catch (error) {
        console.warn('Failed to load pinned routes', error);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(pinnedRoutes)).catch((error) =>
      console.warn('Failed to persist pinned routes', error)
    );
  }, [pinnedRoutes]);

  const isPinned = useCallback(
    (routeId) => pinnedRoutes.some((route) => route.routeId === routeId),
    [pinnedRoutes]
  );

  const togglePin = useCallback(
    (route) => {
      if (!route?.routeId) {
        return;
      }
      setPinnedRoutes((prev) => {
        const exists = prev.find((item) => item.routeId === route.routeId);
        if (exists) {
          return prev.filter((item) => item.routeId !== route.routeId);
        }
        const next = [{ routeId: route.routeId, routeLabel: route.routeLabel }, ...prev];
        return next.slice(0, MAX_PINS);
      });
    },
    []
  );

  const slots = useMemo(() => {
    const filled = pinnedRoutes.slice(0, MAX_PINS);
    while (filled.length < MAX_PINS) {
      filled.push(null);
    }
    return filled;
  }, [pinnedRoutes]);

  return { pinnedRoutes, slots, isPinned, togglePin };
}
