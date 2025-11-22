// Presentation component that renders stop markers for the visible subset.

import React, { memo } from 'react';
import { Marker } from 'react-native-maps';
import { View } from 'react-native';
import styles from '../../styles/AppStyles.js';

/** Renders the currently visible transit stops as map markers. */
const StopMarkers = memo(function StopMarkers({ stops, selectedStopId, onSelect }) {
  if (!stops.length) {
    return null;
  }

  return stops.map((stop) => {
    const latitude = Number(stop.stop_lat);
    const longitude = Number(stop.stop_lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }
    const isFocused = selectedStopId === stop.stop_id;
    return (
      <Marker
        key={`stop-${stop.stop_id}`}
        coordinate={{ latitude, longitude }}
        anchor={{ x: 0.5, y: 0.5 }}
        tracksViewChanges={false}
        onPress={(event) => {
          event.stopPropagation();
          onSelect(stop.stop_id);
        }}
      >
        <View style={[styles.stopDot, isFocused && styles.stopDotActive]} />
      </Marker>
    );
  });
});

export default StopMarkers;
