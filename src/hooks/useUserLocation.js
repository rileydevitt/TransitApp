// Hook that requests foreground location permission and tracks the user position.

import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

/** Requests permission and returns the user’s last known foreground location. */
export default function useUserLocation() {
  const [userLocation, setUserLocation] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const requestLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Location permission denied');
        }
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        if (cancelled) {
          return;
        }
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setError(null);
      } catch (locationError) {
        if (cancelled) {
          return;
        }
        console.error('Unable to fetch user location', locationError);
        setError(locationError.message);
      }
    };

    requestLocation();

    return () => {
      cancelled = true;
    };
  }, []);

  return { userLocation, error };
}
