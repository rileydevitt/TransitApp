// Bottom sheet UI for trip planning, route cards, and stop arrivals.

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
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
  TouchableOpacity,
  View
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../../styles/AppStyles.js';
import clamp from '../../utils/clamp.js';

const WINDOW_HEIGHT = Dimensions.get('window').height;
const BASE_EXPANDED_DRAWER_TRANSLATE = 0;
const DEFAULT_COLLAPSED_DRAWER_TRANSLATE = Platform.select({ ios: 300, android: 320, default: 300 });
const MAX_DRAWER_COVERAGE = 1;
const MIN_TOP_GAP = WINDOW_HEIGHT * (1 - MAX_DRAWER_COVERAGE);
const MAX_SHEET_HEIGHT = WINDOW_HEIGHT;

/** Bottom sheet that surfaces search, routes, and stop arrivals. */
const TripPlannerSheet = forwardRef(function TripPlannerSheet({
  routeCards,
  onRouteSelect,
  onRouteDirectionChange,
  activeRouteId,
  scheduledArrivals,
  isStopFocused,
  selectedStop,
  selectedStopId,
  onClearStop,
  shapeError
}, ref) {
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
    const clampedHeight = Math.min(sheetHeight, MAX_SHEET_HEIGHT);
    const translate = clampedHeight - visibleTarget;
    return clamp(
      translate,
      expandedDrawerTranslate,
      Math.max(clampedHeight, DEFAULT_COLLAPSED_DRAWER_TRANSLATE)
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

  useImperativeHandle(
    ref,
    () => ({
      expand: () => animateDrawer(expandedDrawerTranslate)
    }),
    [animateDrawer, expandedDrawerTranslate]
  );

  return (
    <Animated.View
      style={[styles.sheet, { transform: [{ translateY: drawerTranslateY }] }]}
      onLayout={({ nativeEvent }) => setSheetHeight(nativeEvent.layout.height)}
    >
      <View style={styles.sheetHandleArea} {...sheetPanResponder.panHandlers}>
        <View style={styles.sheetHandle} />
      </View>
      <Text style={styles.sheetTitle}>Plan your trip</Text>

      {shapeError ? (
        <Text style={styles.sheetWarning}>Unable to load route shape: {shapeError}</Text>
      ) : null}

      {isStopFocused ? (
        <StopDetails
          stop={selectedStop}
          stopId={selectedStopId}
          onClear={onClearStop}
          arrivals={scheduledArrivals}
        />
      ) : (
        <RouteList
          routes={routeCards}
          onSelect={onRouteSelect}
          activeRouteId={activeRouteId}
          onDirectionChange={onRouteDirectionChange}
        />
      )}
    </Animated.View>
  );
});

/** Displays the primary list of route cards within the sheet. */
function RouteList({ routes, onSelect, activeRouteId, onDirectionChange }) {
  const renderItem = ({ item }) => (
    <RouteCard
      route={item}
      isActive={Boolean(activeRouteId && item.routeId === activeRouteId)}
      onSelect={onSelect}
      onDirectionChange={onDirectionChange}
    />
  );

  return (
    <FlatList
      data={routes}
      keyExtractor={(item, index) => item.id ?? `route-${index}`}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.routesList}
      ItemSeparatorComponent={() => <View style={styles.routeDivider} />}
      renderItem={renderItem}
      style={{ height: WINDOW_HEIGHT * 0.55 }}
    />
  );
}

/** Single route card element showing ETA + metadata. */
function RouteCard({ route, isActive, onSelect, onDirectionChange }) {
  const showDirections = Array.isArray(route.directionOptions) && route.directionOptions.length > 1;

  const swipeX = useRef(new Animated.Value(0)).current;

  const resetSwipe = useCallback(() => {
    Animated.spring(swipeX, {
      toValue: 0,
      useNativeDriver: true,
      damping: 16,
      stiffness: 240,
      mass: 0.7
    }).start();
  }, [swipeX]);

  const cycleDirection = useCallback(() => {
    if (!showDirections || !onDirectionChange || route.routeId == null) {
      return;
    }
    const options = route.directionOptions.slice(0, 2);
    const currentIndex = options.findIndex((opt) => opt.id === route.selectedDirectionId);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % options.length;
    const next = options[nextIndex];
    if (next && next.id !== route.selectedDirectionId) {
      onDirectionChange(route.routeId, next.id);
    }
  }, [onDirectionChange, route.directionOptions, route.routeId, route.selectedDirectionId, showDirections]);

  const cardPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
      showDirections &&
      Math.abs(gesture.dx) > 10 &&
      Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.2,
      onPanResponderMove: (_, gesture) => {
        if (!showDirections) {
          return;
        }
        const next = clamp(gesture.dx, -32, 32);
        swipeX.setValue(next);
      },
      onPanResponderRelease: (_, gesture) => {
        if (showDirections && Math.abs(gesture.dx) > 20 && Math.abs(gesture.dx) > Math.abs(gesture.dy)) {
          cycleDirection();
        }
        resetSwipe();
      }
    }),
    [cycleDirection, resetSwipe, showDirections, swipeX]
  );

  return (
    <Animated.View
      {...(showDirections ? cardPanResponder.panHandlers : {})}
      style={showDirections ? { transform: [{ translateX: swipeX }] } : null}
    >
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
        {showDirections ? (
          <View style={styles.directionHint}>
            <Ionicons name="swap-horizontal" size={14} color="#7a8fa6" style={styles.directionHintIcon} />
            <Text style={styles.directionHintText}>Swipe to flip direction</Text>
          </View>
        ) : null}
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
    </Animated.View>
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
        keyExtractor={(item, index) =>
          item.tripId ? `${item.tripId}-${item.stopSequence ?? index}` : `${index}`
        }
        contentContainerStyle={styles.routesList}
        ListEmptyComponent={<NoArrivalsState />}
        renderItem={({ item }) => <ScheduledArrivalCard arrival={item} />}
        style={{ maxHeight: WINDOW_HEIGHT * 0.55 }}
      />
    </>
  );
}

/** Visualizes a scheduled trip entry for the selected stop. */
function ScheduledArrivalCard({ arrival }) {
  return (
    <View style={styles.arrivalCard}>
      <View style={styles.arrivalRouteBadge}>
        <Text style={styles.arrivalRouteText}>
          {arrival.routeShortName ?? arrival.routeLabel ?? 'Route'}
        </Text>
      </View>
      <View style={styles.arrivalBody}>
        <Text style={styles.arrivalTitle} numberOfLines={1}>
          {arrival.headsign ?? arrival.routeLongName ?? 'Scheduled trip'}
        </Text>
        <Text style={styles.arrivalSubtitle}>
          Trip #{arrival.tripId ?? 'N/A'}
        </Text>
      </View>
      <View style={styles.arrivalEtaBlock}>
        <Text style={styles.arrivalEta}>{arrival.arrivalLabel ?? arrival.arrivalTime ?? '—'}</Text>
        <Text style={styles.arrivalEtaCaption}>scheduled</Text>
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

export default TripPlannerSheet;
