/** Rough length of one degree of latitude, good enough to size a search box. */
const KM_PER_DEGREE_LAT = 111.045;

/**
 * A latitude/longitude window that fully contains the search radius.
 *
 * This is the cheap pre-filter: it uses the (latitude, longitude) index to
 * narrow rows down before the exact distance is computed. Longitude degrees
 * get shorter towards the poles, so the window widens by 1/cos(latitude).
 */
export function boundingBox(latitude: number, longitude: number, radiusKm: number) {
  const latDelta = radiusKm / KM_PER_DEGREE_LAT;

  // Near the poles cos(lat) approaches 0, which would blow the window up to
  // infinity, so fall back to every longitude.
  const cosLat = Math.abs(Math.cos((latitude * Math.PI) / 180));
  const lngDelta = cosLat < 0.01 ? 180 : radiusKm / (KM_PER_DEGREE_LAT * cosLat);

  return {
    minLat: latitude - latDelta,
    maxLat: latitude + latDelta,
    minLng: longitude - lngDelta,
    maxLng: longitude + lngDelta,
  };
}
