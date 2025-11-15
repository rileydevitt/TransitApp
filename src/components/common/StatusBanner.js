// Banner component for surfacing status or error messages over the map.

import React from 'react';
import { Text, View } from 'react-native';
import styles from '../../styles/AppStyles.js';

/** Displays a dismiss-less banner for system status messaging. */
export default function StatusBanner({ message }) {
  if (!message) {
    return null;
  }
  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>{message}</Text>
    </View>
  );
}
