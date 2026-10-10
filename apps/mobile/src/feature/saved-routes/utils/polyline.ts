/**
 * Standard Google Encoded Polyline Algorithm implementation.
 * Encodes and decodes coordinate arrays [longitude, latitude] or { latitude, longitude }.
 */

export function encodePolyline(
  points: Array<{ latitude: number; longitude: number } | [number, number]>
): string {
  let output = '';
  let prevLat = 0;
  let prevLng = 0;

  for (const point of points) {
    const lat = Array.isArray(point) ? point[1] : point.latitude;
    const lng = Array.isArray(point) ? point[0] : point.longitude;
    const late5 = Math.round(lat * 1e5);
    const lnge5 = Math.round(lng * 1e5);

    output += encodeSigned(late5 - prevLat);
    output += encodeSigned(lnge5 - prevLng);

    prevLat = late5;
    prevLng = lnge5;
  }
  return output;
}

function encodeSigned(num: number): string {
  let sgnNum = num < 0 ? ~(num << 1) : num << 1;
  let encoded = '';
  while (sgnNum >= 0x20) {
    encoded += String.fromCharCode((0x20 | (sgnNum & 0x1f)) + 63);
    sgnNum >>= 5;
  }
  encoded += String.fromCharCode(sgnNum + 63);
  return encoded;
}

export function decodePolyline(encoded: string): Array<[number, number]> {
  if (!encoded) return [];
  const poly: Array<[number, number]> = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b = 0;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    poly.push([lng * 1e-5, lat * 1e-5]);
  }
  return poly;
}
