// Bottom sheet UI for trip planning, route cards, and stop arrivals.

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  PanResponder,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../../styles/AppStyles.js';
import clamp from '../../utils/clamp.js';
import formatTime from '../../utils/formatTime.js';

const WINDOW_HEIGHT = Dimensions.get('window').height;
const BASE_EXPANDED_DRAWER_TRANSLATE = Platform.select({ ios: 90, android: 110, default: 100 });
const DEFAULT_COLLAPSED_DRAWER_TRANSLATE = Platform.select({ ios: 300, android: 320, default: 300 });
const MAX_DRAWER_COVERAGE = 0.9;
const MIN_TOP_GAP = WINDOW_HEIGHT * (1 - MAX_DRAWER_COVERAGE);

/** Bottom sheet that surfaces search, routes, and stop arrivals. */
export default function TripPlannerSheet({
  routeCards,
  onRouteSelect,
  activeRouteId,
  stopArrivals,
  isStopFocused,
  selectedStop,
  selectedStopId,
  onClearStop,
  shapeError
}) {
  const [sheetHeight, setSheetHeight] = useState(null);
  const drawerTranslateY = useRef(new Animated.Value(DEFAULT_COLLAPSED_DRAWER_TRANSLATE)).current;
  const drawerValueRef = useRef(DEFAULT_COLLAPSED_DRAWER_TRANSLATE);
  const hasPositionedSheet = useRef(false);

  const expandedDrawerTranslate = useMemo(
    () => Math.max(BASE_EXPANDED_DRAWER_TRANSLATE, MIN_TOP_GAP),
    []
  );

  const collapsedDrawerTranslate = useMemo(() => {
    if (!sheetHeight) {
      return DEFAULT_COLLAPSED_DRAWER_TRANSLATE;
    }
    const visibleTarget = WINDOW_HEIGHT * 0.33;
    const translate = sheetHeight - visibleTarget;
    return clamp(
      translate,
      expandedDrawerTranslate,
      Math.max(sheetHeight, DEFAULT_COLLAPSED_DRAWER_TRANSLATE)
    );
  }, [expandedDrawerTranslate, sheetHeight]);

  useEffect(() => {
    if (!sheetHeight || hasPositionedSheet.current) {
      return;
    }
    hasPositionedSheet.current = true;
    drawerTranslateY.setValue(collapsedDrawerTranslate);
  }, [collapsedDrawerTranslate, drawerTranslateY, sheetHeight]);

  useEffect(() => {
    const id = drawerTranslateY.addListener(({ value }) => {
      drawerValueRef.current = value;
    });
    return () => drawerTranslateY.removeListener(id);
  }, [drawerTranslateY]);

  const animateDrawer = useCallback(
    (toValue) => {
      Animated.spring(drawerTranslateY, {
        toValue,
        useNativeDriver: true,
        damping: 25,
        stiffness: 220,
        mass: 0.9
      }).start();
    },
    [drawerTranslateY]
  );

  const sheetPanResponder = useMemo(() => {
    let dragOrigin = collapsedDrawerTranslate;
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 6,
      onPanResponderGrant: () => {
        dragOrigin = drawerValueRef.current;
      },
      onPanResponderMove: (_, gesture) => {
        const next = clamp(
          dragOrigin + gesture.dy,
          expandedDrawerTranslate,
          collapsedDrawerTranslate
        );
        drawerTranslateY.setValue(next);
      },
      onPanResponderRelease: (_, gesture) => {
        const midpoint = (expandedDrawerTranslate + collapsedDrawerTranslate) / 2;
        const shouldExpand =
          gesture.vy < -0.2
            ? true
            : gesture.vy > 0.2
            ? false
            : drawerValueRef.current < midpoint;
        animateDrawer(shouldExpand ? expandedDrawerTranslate : collapsedDrawerTranslate);
      }
    });
  }, [animateDrawer, collapsedDrawerTranslate, drawerTranslateY, expandedDrawerTranslate]);

  useEffect(() => {
    if (isStopFocused) {
      animateDrawer(expandedDrawerTranslate);
    }
  }, [animateDrawer, expandedDrawerTranslate, isStopFocused]);

  const handleSearchPress = useCallback(() => {
    animateDrawer(expandedDrawerTranslate);
  }, [animateDrawer, expandedDrawerTranslate]);

  return (
    <Animated.View
      style={[styles.sheet, { transform: [{ translateY: drawerTranslateY }] }]}
      onLayout={({ nativeEvent }) => setSheetHeight(nativeEvent.layout.height)}
    >
      <View style={styles.sheetHandleArea} {...sheetPanResponder.panHandlers}>
        <View style={styles.sheetHandle} />
      </View>
      <Text style={styles.sheetTitle}>Plan your trip</Text>
      <View style={styles.sheetHeaderRow}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.searchBar}
          onPress={handleSearchPress}
        >
          <Ionicons name="search" size={20} color="#daf6db" />
          <TextInput
            placeholder="Where to?"
            placeholderTextColor="#daf6db"
            style={styles.searchInput}
            editable={false}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.homeButton} activeOpacity={0.8}>
          <Ionicons name="home" size={20} color="#0a2239" />
          <Ionicons name="add" size={16} color="#0a2239" style={styles.homeButtonIcon} />
        </TouchableOpacity>
      </View>

      {shapeError ? (
        <Text style={styles.sheetWarning}>Unable to load route shape: {shapeError}</Text>
      ) : null}

      {isStopFocused ? (
        <StopDetails
          stop={selectedStop}
          stopId={selectedStopId}
          onClear={onClearStop}
          arrivals={stopArrivals}
        />
      ) : (
        <RouteList routes={routeCards} onSelect={onRouteSelect} activeRouteId={activeRouteId} />
      )}
    </Animated.View>
  );
}

/** Displays the primary list of route cards within the sheet. */
function RouteList({ routes, onSelect, activeRouteId }) {
  const renderItem = ({ item }) => (
    <RouteCard
      route={item}
      isActive={Boolean(activeRouteId && item.routeId === activeRouteId)}
      onSelect={onSelect}
    />
  );

  return (
    <FlatList
      data={routes}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.routesList}
      ItemSeparatorComponent={() => <View style={styles.routeDivider} />}
      renderItem={renderItem}
    />
  );
}

/** Single route card element showing ETA + metadata. */
function RouteCard({ route, isActive, onSelect }) {
  return (
    <TouchableOpacity
      style={[styles.routeCard, isActive && styles.routeCardActive]}
      activeOpacity={0.85}
      onPress={() => {
        if (route.vehicleId) {
          onSelect(route.vehicleId);
        }
      }}
    >
      <View style={styles.routeBadgeColumn}>
        <Text style={[styles.routeBadgeText, isActive && styles.routeBadgeTextActive]}>
          {route.routeLabel}
        </Text>
        {route.warning ? (
          <MaterialCommunityIcons
            name="alert-circle"
            size={16}
            color="#ffdd55"
            style={styles.routeWarningIcon}
          />
        ) : null}
      </View>
      <View style={styles.routeBody}>
        <Text style={styles.routeTitle} numberOfLines={1}>
          {route.headsign}
        </Text>
        <Text style={styles.routeSubtitle} numberOfLines={1}>
          {route.stopLabel}
        </Text>
        {route.updatedLabel ? <Text style={styles.routeUpdated}>{route.updatedLabel}</Text> : null}
      </View>
      <View style={styles.routeMeta}>
        <Text style={[styles.etaText, isActive && styles.etaTextActive]}>
          {route.etaMinutes ? `${route.etaMinutes}` : '—'}
        </Text>
        <Text style={styles.etaCaption}>minutes</Text>
        <MaterialCommunityIcons
          name="access-point"
          size={18}
          color={route.isStale ? '#7a8fa6' : '#77f0ff'}
        />
      </View>
    </TouchableOpacity>
  );
}

/** Stop-focused view with header and arrivals list. */
function StopDetails({ stop, stopId, onClear, arrivals }) {
  return (
    <>
      <View style={styles.stopHeader}>
        <View>
          <Text style={styles.stopTitle}>{stop?.stop_name ?? 'Stop'}</Text>
          <Text style={styles.stopSubtitle}>Stop #{stop?.stop_id ?? stopId}</Text>
        </View>
        <TouchableOpacity
          accessibilityLabel="Close stop details"
          onPress={onClear}
          style={styles.stopCloseButton}
        >
          <Ionicons name="close" size={18} color="#0a2239" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={arrivals}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.routesList}
        ListEmptyComponent={<NoArrivalsState />}
        renderItem={({ item }) => <StopArrivalCard arrival={item} />}
      />
    </>
  );
}

/** Visualizes a single incoming vehicle for the selected stop. */
function StopArrivalCard({ arrival }) {
  return (
    <View style={styles.arrivalCard}>
      <View style={styles.arrivalRouteBadge}>
        <Text style={styles.arrivalRouteText}>{arrival.routeLabel}</Text>
      </View>
      <View style={styles.arrivalBody}>
        <Text style={styles.arrivalTitle} numberOfLines={1}>
          {arrival.headsign}
        </Text>
        <Text style={styles.arrivalSubtitle}>
          {arrival.distanceLabel} · updated{' '}
          {arrival.timestamp ? formatTime(arrival.timestamp) : 'recently'}
        </Text>
      </View>
      <View style={styles.arrivalEtaBlock}>
        <Text style={styles.arrivalEta}>{arrival.etaMinutes ? `${arrival.etaMinutes}` : '—'}</Text>
        <Text style={styles.arrivalEtaCaption}>min</Text>
      </View>
    </View>
  );
}

/** Empty-state illustration shown when no arrivals exist. */
function NoArrivalsState() {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No buses approaching</Text>
      <Text style={styles.emptySubtitle}>
        We will post arrivals here as soon as vehicles report this stop.
      </Text>
    </View>
  );
}
