// Presentation component that draws markers for each vehicle.

import React, { memo } from 'react';
import { Marker } from 'react-native-maps';
import { Image } from 'react-native';
import busIcon from '../../../bus_icon.png';
import styles from '../../styles/AppStyles.js';

/** Renders vehicle markers with labels and selection handling. */
const VehicleMarkers = memo(function VehicleMarkers({
  vehicles,
  routesById,
  staleVehicles,
  selectedVehicleId,
  onSelect
}) {
  if (!vehicles.length) {
    return null;
  }

  return vehicles.map((vehicle) => {
    const route = vehicle.routeId ? routesById.get(vehicle.routeId) : null;
    const displayLabel =
      route?.route_short_name ?? vehicle.routeId ?? vehicle.label ?? 'Bus';
    const isSelected = vehicle.id === selectedVehicleId;

    return (
      <Marker
        key={vehicle.id}
        coordinate={{
          latitude: vehicle.latitude,
          longitude: vehicle.longitude
        }}
        anchor={{ x: 0.5, y: 0.5 }}
        opacity={staleVehicles.has(vehicle.id) ? 0.5 : 1}
        tracksViewChanges
        onPress={() => onSelect(vehicle.id)}
        title={displayLabel}
      >
        <Image
          source={busIcon}
          style={[styles.busMarkerIcon, isSelected && styles.busMarkerIconActive]}
          resizeMode="contain"
        />
      </Marker>
    );
  });
});

export default VehicleMarkers;
