/**
 * @file gpxParser.ts
 * @description In-browser parser for GPX trajectory files.
 * Extracts trackpoints, start/end GPS coordinates, timestamps, and elevation.
 */

export interface GpxPoint {
  latitude: number
  longitude: number
  elevation?: number
  time?: string
}

export interface ParsedGpxData {
  coordinates: [longitude: number, latitude: number][]
  firstPoint?: GpxPoint
  lastPoint?: GpxPoint
  startTime?: string
  endTime?: string
  totalPoints: number
}

/**
 * Parses raw GPX XML string into structured coordinate trajectories.
 *
 * @param xml - Raw XML string of the GPX document.
 * @returns ParsedGpxData containing list of coordinates and metadata.
 */
export function parseGpxContent(xml: string): ParsedGpxData {
  if (!xml || typeof xml !== 'string') {
    return { coordinates: [], totalPoints: 0 }
  }

  const coordinates: [longitude: number, latitude: number][] = []
  let firstPoint: GpxPoint | undefined
  let lastPoint: GpxPoint | undefined

  const pointTagRegex = /<(?:[\w-]+:)?(trkpt|wpt|rtept)\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:[\w-]+:)?\1>)/gi

  let match: RegExpExecArray | null
  while ((match = pointTagRegex.exec(xml)) !== null) {
    const attributes = match[2]
    const body = match[3] ?? ''

    const latMatch = /lat=["']([-+]?\d*\.?\d+)["']/i.exec(attributes)
    const lonMatch = /lon=["']([-+]?\d*\.?\d+)["']/i.exec(attributes)

    if (latMatch && lonMatch) {
      const latitude = Number.parseFloat(latMatch[1])
      const longitude = Number.parseFloat(lonMatch[1])

      if (
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        Math.abs(latitude) <= 90 &&
        Math.abs(longitude) <= 180 &&
        !(latitude === 0 && longitude === 0)
      ) {
        coordinates.push([longitude, latitude])

        const timeMatch = /<(?:[\w-]+:)?time>([^<]+)<\/(?:[\w-]+:)?time>/i.exec(body)
        const eleMatch = /<(?:[\w-]+:)?ele>([-+]?\d*\.?\d+)<\/(?:[\w-]+:)?ele>/i.exec(body)
        const currentPoint: GpxPoint = {
          latitude,
          longitude,
          time: timeMatch ? timeMatch[1].trim() : undefined,
          elevation: eleMatch ? Number.parseFloat(eleMatch[1]) : undefined,
        }

        if (!firstPoint) {
          firstPoint = currentPoint
        }
        lastPoint = currentPoint
      }
    }
  }

  return {
    coordinates,
    firstPoint,
    lastPoint,
    startTime: firstPoint?.time,
    endTime: lastPoint?.time,
    totalPoints: coordinates.length,
  }
}

/**
 * Reads a File object in browser and returns parsed GPX trajectory.
 *
 * @param file - Browser File instance (.gpx).
 */
export async function parseGpxFile(file: File): Promise<ParsedGpxData> {
  const text = await file.text()
  return parseGpxContent(text)
}
