// Full-screen loading overlay used while static GTFS data is fetched.

import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import styles from '../../styles/AppStyles.js';

/** Full-screen overlay for blocking UI while data loads. */
export default function LoadingOverlay({ message }) {
  return (
    <View style={styles.loadingOverlay}>
      <ActivityIndicator size="large" color="#ffffff" />
      {message ? <Text style={styles.loadingText}>{message}</Text> : null}
    </View>
  );
}
