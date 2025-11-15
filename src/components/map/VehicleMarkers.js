// Presentation component that draws markers for each vehicle.

import React from 'react';
import { Marker } from 'react-native-maps';
import { Text, View } from 'react-native';
import styles from '../../styles/AppStyles.js';

/** Renders vehicle markers with labels and selection handling. */
export default function VehicleMarkers({
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
        pinColor={isSelected ? '#FF9900' : '#00558C'}
        opacity={staleVehicles.has(vehicle.id) ? 0.5 : 1}
        onPress={() => onSelect(vehicle.id)}
      >
        <View style={styles.markerLabel}>
          <Text style={styles.markerText}>{displayLabel}</Text>
        </View>
      </Marker>
    );
  });
}
