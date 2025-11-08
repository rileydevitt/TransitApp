const MIN_SPEED_KM_PER_MIN = 0.2; // ~12 km/h fallback

export default function estimateEtaToStop(distanceKm, speedMps) {
  if (!Number.isFinite(distanceKm)) {
    return null;
  }
  const speedKmPerMin = speedMps ? (speedMps * 3.6) / 60 : 0.5;
  const minutes = distanceKm / Math.max(speedKmPerMin, MIN_SPEED_KM_PER_MIN);
  return Math.max(1, Math.round(minutes));
}
