// Manages currently selected vehicle state and keeps it in sync with realtime feed.

import { useEffect, useMemo, useState } from 'react';

/** Tracks and validates the selected vehicle against the realtime feed. */
export default function useVehicleSelection(vehicles) {
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? null,
    [vehicles, selectedVehicleId]
  );

  useEffect(() => {
    if (vehicles.length === 0) {
      setSelectedVehicleId(null);
      return;
    }
    setSelectedVehicleId((currentId) => {
      if (currentId && vehicles.some((vehicle) => vehicle.id === currentId)) {
        return currentId;
      }
      return vehicles[0].id;
    });
  }, [vehicles]);

  return { selectedVehicleId, setSelectedVehicleId, selectedVehicle };
}
