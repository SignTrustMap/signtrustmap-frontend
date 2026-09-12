export type GpxPoint = {
  elevation?: number;
  latitude: number;
  longitude: number;
  time?: string;
};

export type GpxData = {
  coordinates: [longitude: number, latitude: number][];
  firstPoint?: GpxPoint;
  startTime?: string;
};

/**
 * Parses GPX XML content and extracts GPS coordinates and timestamp.
 * Handles <trkpt>, <wpt>, and <rtept> elements.
 */
export function parseGpxContent(xml: string): GpxData {
  if (!xml || typeof xml !== 'string') {
    return { coordinates: [] };
  }

  const coordinates: [longitude: number, latitude: number][] = [];
  let firstPoint: GpxPoint | undefined;

  // Match trkpt, wpt, or rtept tags (opening, self-closing, or with body)
  const pointTagRegex = /<(?:[\w-]+:)?(trkpt|wpt|rtept)\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:[\w-]+:)?\1>)/gi;

  let match: RegExpExecArray | null;
  while ((match = pointTagRegex.exec(xml)) !== null) {
    const attributes = match[2];
    const body = match[3] ?? '';

    const latMatch = /lat=["']([-+]?\d*\.?\d+)["']/i.exec(attributes);
    const lonMatch = /lon=["']([-+]?\d*\.?\d+)["']/i.exec(attributes);

    if (latMatch && lonMatch) {
      const latitude = Number.parseFloat(latMatch[1]);
      const longitude = Number.parseFloat(lonMatch[1]);

      if (
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        Math.abs(latitude) <= 90 &&
        Math.abs(longitude) <= 180
      ) {
        coordinates.push([longitude, latitude]);

        if (!firstPoint) {
          const timeMatch = /<(?:[\w-]+:)?time>([^<]+)<\/(?:[\w-]+:)?time>/i.exec(body);
          const eleMatch = /<(?:[\w-]+:)?ele>([-+]?\d*\.?\d+)<\/(?:[\w-]+:)?ele>/i.exec(body);

          firstPoint = {
            latitude,
            longitude,
            time: timeMatch ? timeMatch[1].trim() : undefined,
            elevation: eleMatch ? Number.parseFloat(eleMatch[1]) : undefined,
          };
        }
      }
    }
  }

  return {
    coordinates,
    firstPoint,
    startTime: firstPoint?.time,
  };
}

/**
 * Reads a GPX file from a local URI and extracts GPS data.
 */
export async function extractGpxGpsData(uri: string): Promise<GpxData | null> {
  try {
    const response = await fetch(uri);
    if (!response.ok && /^https?:/i.test(uri)) {
      return null;
    }
    const text = await response.text();
    return parseGpxContent(text);
  } catch (error) {
    console.warn('[GPX] Failed to parse GPX from uri:', uri, error);
    return null;
  }
}
