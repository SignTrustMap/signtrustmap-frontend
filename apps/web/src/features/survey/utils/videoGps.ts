/**
 * @file videoGps.ts
 * @description In-browser Video File GPS & Telemetry Parser for Web.
 * Extracts embedded GPS coordinates, trajectory, and duration directly from video file containers (MP4, MOV).
 *
 * Supports:
 * 1. QuickTime User Data ISO 6709 atom (`©xyz` / `\xa9xyz`) (iPhone, Android, QuickTime, dashcams)
 * 2. NMEA 0183 sentences (`$GPRMC`, `$GNRMC`, `$GPGGA`, `$GNGGA`) (VIOFO, 70mai, Thinkware, Novatek, BlackVue)
 * 3. 3GPP Location atom (`loci`)
 * 4. GoPro GPMF telemetry (`GPS5`)
 * 5. Google/GoPro `camm` telemetry samples
 * 6. Embedded text/XMP/JSON GPS metadata
 * 7. MP4 `mvhd` atom duration recovery
 */

export interface ExtractedVideoFileGps {
  latitude: number
  longitude: number
  durationSeconds?: number
  capturedAt?: string
  source: 'camm' | 'quicktime_xyz' | 'nmea_rmc' | 'nmea_gga' | 'gpp_loci' | 'gopro_gpmf' | 'text_key_value'
}

/**
 * Converts NMEA coordinate format (DDMM.MMMM or DDDMM.MMMM) to decimal degrees.
 */
export function nmeaToDecimal(nmeaCoord: string, direction: string): number | null {
  const dotIndex = nmeaCoord.indexOf('.')
  if (dotIndex < 2) return null

  const degLen = dotIndex - 2
  const degrees = Number.parseFloat(nmeaCoord.slice(0, degLen))
  const minutes = Number.parseFloat(nmeaCoord.slice(degLen))

  if (!Number.isFinite(degrees) || !Number.isFinite(minutes)) return null

  let decimal = degrees + minutes / 60
  const dir = direction.toUpperCase()
  if (dir === 'S' || dir === 'W') {
    decimal = -decimal
  }

  return Number.parseFloat(decimal.toFixed(6))
}

/**
 * Parses ISO 6709 coordinate strings commonly found in QuickTime `©xyz` atoms.
 * Formats: `+10.770046+106.691383/` or `+10.770046+106.691383+015.000/` or `-33.8568+151.2153/`
 */
export function parseIso6709(text: string): { latitude: number; longitude: number } | null {
  const regex = /([+-]\d{2,3}(?:\.\d+)?)([+-]\d{2,3}(?:\.\d+)?)(?:([+-]\d+(?:\.\d+)?))?\/?/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    const lat = Number.parseFloat(match[1])
    const lon = Number.parseFloat(match[2])

    if (
      Number.isFinite(lat) &&
      Number.isFinite(lon) &&
      Math.abs(lat) <= 90 &&
      Math.abs(lon) <= 180 &&
      !(lat === 0 && lon === 0)
    ) {
      const hasDecimalOrMinLength = match[1].includes('.') || match[1].length >= 3
      if (hasDecimalOrMinLength) {
        return {
          latitude: Number.parseFloat(lat.toFixed(6)),
          longitude: Number.parseFloat(lon.toFixed(6)),
        }
      }
    }
  }

  return null
}

/**
 * Parses NMEA 0183 sentences ($GPRMC, $GNRMC, $GPGGA, $GNGGA) embedded in dashcam video metadata.
 */
export function parseNmeaSentences(
  text: string
): { latitude: number; longitude: number; source: 'nmea_rmc' | 'nmea_gga' } | null {
  // 1. Check RMC sentences: $GPRMC,hhmmss.ss,status,lat,N/S,lon,E/W,...
  const rmcRegex = /\$G[PNBLA]RMC,\s*[^,]*,\s*([AV]),\s*(\d{2,4}\.\d+),\s*([NSns]),\s*(\d{3,5}\.\d+),\s*([EWew])/g
  let rmcMatch: RegExpExecArray | null

  while ((rmcMatch = rmcRegex.exec(text)) !== null) {
    const status = rmcMatch[1].toUpperCase()
    const latStr = rmcMatch[2]
    const latDir = rmcMatch[3]
    const lonStr = rmcMatch[4]
    const lonDir = rmcMatch[5]

    const lat = nmeaToDecimal(latStr, latDir)
    const lon = nmeaToDecimal(lonStr, lonDir)

    if (
      (status === 'A' || status === 'V') &&
      lat !== null &&
      lon !== null &&
      Math.abs(lat) <= 90 &&
      Math.abs(lon) <= 180 &&
      !(lat === 0 && lon === 0)
    ) {
      return { latitude: lat, longitude: lon, source: 'nmea_rmc' }
    }
  }

  // 2. Check GGA sentences: $GPGGA,hhmmss.ss,lat,N/S,lon,E/W,...
  const ggaRegex = /\$G[PNBLA]GGA,\s*[^,]*,\s*(\d{2,4}\.\d+),\s*([NSns]),\s*(\d{3,5}\.\d+),\s*([EWew])/g
  let ggaMatch: RegExpExecArray | null

  while ((ggaMatch = ggaRegex.exec(text)) !== null) {
    const latStr = ggaMatch[1]
    const latDir = ggaMatch[2]
    const lonStr = ggaMatch[3]
    const lonDir = ggaMatch[4]

    const lat = nmeaToDecimal(latStr, latDir)
    const lon = nmeaToDecimal(lonStr, lonDir)

    if (
      lat !== null &&
      lon !== null &&
      Math.abs(lat) <= 90 &&
      Math.abs(lon) <= 180 &&
      !(lat === 0 && lon === 0)
    ) {
      return { latitude: lat, longitude: lon, source: 'nmea_gga' }
    }
  }

  return null
}

/**
 * Searches for QuickTime `©xyz` atom (bytes: 0xa9, 0x78, 0x79, 0x7a) in binary buffer.
 */
export function parseQuickTimeXyzAtom(
  bytes: Uint8Array
): { latitude: number; longitude: number } | null {
  const len = bytes.length
  for (let i = 4; i < len - 16; i++) {
    if (
      bytes[i] === 0xa9 &&
      bytes[i + 1] === 0x78 &&
      bytes[i + 2] === 0x79 &&
      bytes[i + 3] === 0x7a
    ) {
      let str = ''
      const limit = Math.min(len, i + 48)
      for (let j = i + 4; j < limit; j++) {
        const code = bytes[j]
        if (code === 0 || code === 0x2f) {
          if (str.length > 5) {
            str += '/'
            break
          }
        }
        if (code >= 0x20 && code <= 0x7e) {
          str += String.fromCharCode(code)
        }
      }

      const parsed = parseIso6709(str)
      if (parsed) return parsed
    }
  }
  return null
}

/**
 * Searches for 3GPP `loci` atom (bytes: 'l', 'o', 'c', 'i') in binary buffer.
 */
export function parse3gppLociAtom(
  bytes: Uint8Array
): { latitude: number; longitude: number } | null {
  const len = bytes.length
  for (let i = 4; i < len - 24; i++) {
    if (
      bytes[i] === 0x6c &&
      bytes[i + 1] === 0x6f &&
      bytes[i + 2] === 0x63 &&
      bytes[i + 3] === 0x69
    ) {
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
      let offset = i + 10
      while (offset < len && bytes[offset] !== 0) {
        offset++
      }
      offset += 2 // skip null + role

      if (offset + 8 <= len) {
        const lonRaw = view.getInt32(offset, false)
        const latRaw = view.getInt32(offset + 4, false)
        const lon = Number.parseFloat((lonRaw / 65536.0).toFixed(6))
        const lat = Number.parseFloat((latRaw / 65536.0).toFixed(6))

        if (
          Number.isFinite(lat) &&
          Number.isFinite(lon) &&
          Math.abs(lat) <= 90 &&
          Math.abs(lon) <= 180 &&
          !(lat === 0 && lon === 0)
        ) {
          return { latitude: lat, longitude: lon }
        }
      }
    }
  }
  return null
}

/**
 * Recovers video duration in seconds from MP4 `mvhd` atom.
 */
export function parseDurationFromMvhd(bytes: Uint8Array): number | null {
  const len = bytes.length
  for (let i = 4; i < len - 32; i++) {
    if (
      bytes[i] === 0x6d &&
      bytes[i + 1] === 0x76 &&
      bytes[i + 2] === 0x68 &&
      bytes[i + 3] === 0x64
    ) {
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
      const version = bytes[i + 4]

      let timescale = 0
      let duration = 0

      if (version === 0) {
        timescale = view.getUint32(i + 16, false)
        duration = view.getUint32(i + 20, false)
      } else if (version === 1) {
        timescale = view.getUint32(i + 24, false)
        duration = view.getUint32(i + 32, false)
      }

      if (timescale > 0 && duration > 0) {
        const durationSeconds = duration / timescale
        if (Number.isFinite(durationSeconds) && durationSeconds > 0 && durationSeconds < 86400) {
          return Math.round(durationSeconds)
        }
      }
    }
  }
  return null
}

/**
 * Parses Google / GoPro Camera Motion Metadata (`camm`) samples.
 */
export function parseCammSamples(
  bytes: Uint8Array
): { latitude: number; longitude: number } | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const len = bytes.length

  for (let i = 0; i <= len - 60; i += 2) {
    const reservedLE = view.getUint16(i, true)
    if (reservedLE === 0) {
      const typeLE = view.getUint16(i + 2, true)
      if (typeLE === 6) {
        const fixType = view.getInt32(i + 12, true)
        if (fixType >= 0 && fixType <= 5) {
          const lat = view.getFloat64(i + 16, true)
          const lon = view.getFloat64(i + 24, true)
          if (
            Number.isFinite(lat) &&
            Number.isFinite(lon) &&
            Math.abs(lat) <= 90 &&
            Math.abs(lon) <= 180 &&
            Math.abs(lat) > 0.0001 &&
            Math.abs(lon) > 0.0001
          ) {
            return {
              latitude: Number.parseFloat(lat.toFixed(6)),
              longitude: Number.parseFloat(lon.toFixed(6)),
            }
          }
        }
      } else if (typeLE === 5) {
        const lat = view.getFloat64(i + 4, true)
        const lon = view.getFloat64(i + 12, true)
        if (
          Number.isFinite(lat) &&
          Number.isFinite(lon) &&
          Math.abs(lat) <= 90 &&
          Math.abs(lon) <= 180 &&
          Math.abs(lat) > 0.0001 &&
          Math.abs(lon) > 0.0001
        ) {
          return {
            latitude: Number.parseFloat(lat.toFixed(6)),
            longitude: Number.parseFloat(lon.toFixed(6)),
          }
        }
      }
    }
  }

  return null
}

/**
 * Parses GoPro GPMF telemetry stream (`GPS5` FourCC).
 */
export function parseGpmfGps(
  bytes: Uint8Array
): { latitude: number; longitude: number } | null {
  const len = bytes.length
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)

  for (let i = 0; i <= len - 28; i++) {
    if (
      bytes[i] === 0x47 &&
      bytes[i + 1] === 0x50 &&
      bytes[i + 2] === 0x53 &&
      bytes[i + 3] === 0x35
    ) {
      let scale = 10000000
      const lookbackLimit = Math.max(0, i - 128)
      for (let s = i - 8; s >= lookbackLimit; s--) {
        if (
          bytes[s] === 0x53 &&
          bytes[s + 1] === 0x43 &&
          bytes[s + 2] === 0x41 &&
          bytes[s + 3] === 0x4c
        ) {
          const scalType = bytes[s + 4]
          if (scalType === 0x6c || scalType === 0x4c) {
            const parsedScale = view.getInt32(s + 8, false)
            if (parsedScale > 0 && parsedScale <= 1e9) {
              scale = parsedScale
            }
          }
          break
        }
      }

      const dataOffset = i + 8
      if (dataOffset + 8 <= len) {
        const rawLat = view.getInt32(dataOffset, false)
        const rawLon = view.getInt32(dataOffset + 4, false)

        const lat = rawLat / scale
        const lon = rawLon / scale

        if (
          Number.isFinite(lat) &&
          Number.isFinite(lon) &&
          Math.abs(lat) <= 90 &&
          Math.abs(lon) <= 180 &&
          Math.abs(lat) > 0.0001 &&
          Math.abs(lon) > 0.0001
        ) {
          return {
            latitude: Number.parseFloat(lat.toFixed(6)),
            longitude: Number.parseFloat(lon.toFixed(6)),
          }
        }
      }
    }
  }

  return null
}

/**
 * Searches the moov atom for telemetry tracks (camm or gpmd) and returns sample chunk offsets.
 */
export function findTelemetryChunkOffsets(bytes: Uint8Array): number[] {
  const offsets: number[] = []
  const len = bytes.length
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)

  for (let i = 0; i <= len - 16; i++) {
    const isCamm = bytes[i] === 0x63 && bytes[i + 1] === 0x61 && bytes[i + 2] === 0x6d && bytes[i + 3] === 0x6d
    const isGpmd = bytes[i] === 0x67 && bytes[i + 1] === 0x70 && bytes[i + 2] === 0x6d && bytes[i + 3] === 0x64

    if (isCamm || isGpmd) {
      const limit = Math.min(len - 12, i + 4096)
      for (let j = i; j < limit; j++) {
        if (bytes[j] === 0x73 && bytes[j + 1] === 0x74 && bytes[j + 2] === 0x63 && bytes[j + 3] === 0x6f) {
          const entryCount = view.getUint32(j + 8, false)
          for (let e = 0; e < Math.min(entryCount, 4); e++) {
            offsets.push(view.getUint32(j + 12 + e * 4, false))
          }
          break
        }
        if (bytes[j] === 0x63 && bytes[j + 1] === 0x6f && bytes[j + 2] === 0x36 && bytes[j + 3] === 0x34) {
          const entryCount = view.getUint32(j + 8, false)
          for (let e = 0; e < Math.min(entryCount, 4); e++) {
            const high = view.getUint32(j + 12 + e * 8, false)
            const low = view.getUint32(j + 12 + e * 8 + 4, false)
            offsets.push(high * 0x100000000 + low)
          }
          break
        }
      }
    }
  }

  return offsets
}

/**
 * Decodes a Uint8Array buffer into a Latin-1 string safe for regex searching.
 */
export function bufferToAsciiString(bytes: Uint8Array): string {
  let result = ''
  const len = bytes.length
  const step = 8192
  for (let i = 0; i < len; i += step) {
    const slice = bytes.subarray(i, Math.min(i + step, len))
    result += String.fromCharCode.apply(null, slice as unknown as number[])
  }
  return result
}

/**
 * Inspects a binary buffer chunk to extract GPS and duration metadata.
 */
export function extractMetadataFromBuffer(bytes: Uint8Array): {
  gps?: { latitude: number; longitude: number; source: ExtractedVideoFileGps['source'] }
  durationSeconds?: number
} {
  const result: {
    gps?: { latitude: number; longitude: number; source: ExtractedVideoFileGps['source'] }
    durationSeconds?: number
  } = {}

  // 1. Duration from mvhd
  const duration = parseDurationFromMvhd(bytes)
  if (duration !== null) {
    result.durationSeconds = duration
  }

  // 2. Camera Motion Metadata (CAMM)
  const camm = parseCammSamples(bytes)
  if (camm) {
    result.gps = { ...camm, source: 'camm' }
    return result
  }

  // 3. GoPro GPMF telemetry (GPS5)
  const gpmf = parseGpmfGps(bytes)
  if (gpmf) {
    result.gps = { ...gpmf, source: 'gopro_gpmf' }
    return result
  }

  // 4. QuickTime ©xyz binary atom
  const xyz = parseQuickTimeXyzAtom(bytes)
  if (xyz) {
    result.gps = { ...xyz, source: 'quicktime_xyz' }
    return result
  }

  // 5. 3GPP loci binary atom
  const loci = parse3gppLociAtom(bytes)
  if (loci) {
    result.gps = { ...loci, source: 'gpp_loci' }
    return result
  }

  // 6. ASCII string search: NMEA sentences and ISO 6709 text
  const text = bufferToAsciiString(bytes)

  // 6a. NMEA
  const nmea = parseNmeaSentences(text)
  if (nmea) {
    result.gps = nmea
    return result
  }

  // 6b. Raw ISO 6709 text
  const iso6709 = parseIso6709(text)
  if (iso6709) {
    result.gps = { ...iso6709, source: 'quicktime_xyz' }
    return result
  }

  // 6c. Key-value / XMP / JSON patterns (including camera kit telemetry c_lat/c_lon)
  const kvLat = /(?:latitude|gps_lat|c_lat|lat)[\s"':=]+([+-]?\d{1,2}\.\d{4,})/i.exec(text)
  const kvLon = /(?:longitude|gps_lon|c_lon|lon)[\s"':=]+([+-]?\d{1,3}\.\d{4,})/i.exec(text)
  if (kvLat && kvLon) {
    const lat = Number.parseFloat(kvLat[1])
    const lon = Number.parseFloat(kvLon[1])
    if (
      Number.isFinite(lat) &&
      Number.isFinite(lon) &&
      Math.abs(lat) <= 90 &&
      Math.abs(lon) <= 180 &&
      !(lat === 0 && lon === 0)
    ) {
      result.gps = {
        latitude: Number.parseFloat(lat.toFixed(6)),
        longitude: Number.parseFloat(lon.toFixed(6)),
        source: 'text_key_value',
      }
      return result
    }
  }

  return result
}

/**
 * Estimates an end coordinate from a start point based on video duration.
 */
export function estimateEndCoordinate(
  startLon: number,
  startLat: number,
  durationSeconds = 60
): [longitude: number, latitude: number] {
  const safeDuration = Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : 60
  const distanceMeters = Math.min(3000, Math.max(50, safeDuration * 7))

  const bearingRad = (45 * Math.PI) / 180
  const earthRadius = 6371000

  const startLatRad = (startLat * Math.PI) / 180
  const startLonRad = (startLon * Math.PI) / 180

  const endLatRad = Math.asin(
    Math.sin(startLatRad) * Math.cos(distanceMeters / earthRadius) +
      Math.cos(startLatRad) * Math.sin(distanceMeters / earthRadius) * Math.cos(bearingRad)
  )

  const endLonRad =
    startLonRad +
    Math.atan2(
      Math.sin(bearingRad) * Math.sin(distanceMeters / earthRadius) * Math.cos(startLatRad),
      Math.cos(distanceMeters / earthRadius) - Math.sin(startLatRad) * Math.sin(endLatRad)
    )

  const endLat = (endLatRad * 180) / Math.PI
  const endLon = (endLonRad * 180) / Math.PI

  return [Number.parseFloat(endLon.toFixed(6)), Number.parseFloat(endLat.toFixed(6))]
}

/**
 * Generates a valid GPX 1.1 XML string containing start and end track points with timestamps.
 */
export function buildCompanionGpxXml(params: {
  startCoordinate: [longitude: number, latitude: number]
  endCoordinate: [longitude: number, latitude: number]
  capturedAt: string
  durationSeconds?: number
}): string {
  const { startCoordinate, endCoordinate, capturedAt, durationSeconds = 60 } = params
  const startDate = new Date(capturedAt)
  const validStartDate = Number.isNaN(startDate.getTime()) ? new Date() : startDate
  const startTimeISO = validStartDate.toISOString()

  const durationMs = Math.max(1, durationSeconds) * 1000
  const endDate = new Date(validStartDate.getTime() + durationMs)
  const endTimeISO = endDate.toISOString()

  const [startLon, startLat] = startCoordinate
  const [endLon, endLat] = endCoordinate

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="SignTrustMap Web" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>Survey Video Track</name>
    <trkseg>
      <trkpt lat="${startLat.toFixed(6)}" lon="${startLon.toFixed(6)}">
        <time>${startTimeISO}</time>
      </trkpt>
      <trkpt lat="${endLat.toFixed(6)}" lon="${endLon.toFixed(6)}">
        <time>${endTimeISO}</time>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`.trim()
}

/**
 * Creates a companion GPX File instance from coordinates and duration.
 */
export function createCompanionGpxFile(params: {
  startCoordinate: [longitude: number, latitude: number]
  endCoordinate: [longitude: number, latitude: number]
  capturedAt: string
  durationSeconds?: number
  fileName?: string
}): File {
  const xml = buildCompanionGpxXml(params)
  const name = params.fileName || `companion-track-${Date.now()}.gpx`
  return new File([xml], name, { type: 'application/gpx+xml' })
}

/**
 * Reads header (first 2MB) and footer (last 2MB) of a video File to extract GPS and duration.
 * Keeps memory usage negligible (< 4 MB) even for multi-gigabyte video files in the browser.
 */
export async function extractGpsFromVideoFile(file: File): Promise<ExtractedVideoFileGps | null> {
  try {
    const size = file.size
    const CHUNK_SIZE = 2 * 1024 * 1024 // 2 MB covers standard moov/udta atoms

    const buffers: Uint8Array[] = []

    if (size <= CHUNK_SIZE * 2) {
      const fullBuf = await file.arrayBuffer()
      buffers.push(new Uint8Array(fullBuf))
    } else {
      const headerBlob = file.slice(0, CHUNK_SIZE)
      const footerBlob = file.slice(Math.max(0, size - CHUNK_SIZE), size)
      const [headerBuf, footerBuf] = await Promise.all([
        headerBlob.arrayBuffer(),
        footerBlob.arrayBuffer(),
      ])
      buffers.push(new Uint8Array(headerBuf))
      buffers.push(new Uint8Array(footerBuf))
    }

    let recoveredDuration: number | undefined
    let recoveredGps: { latitude: number; longitude: number; source: ExtractedVideoFileGps['source'] } | undefined

    for (const chunk of buffers) {
      const extracted = extractMetadataFromBuffer(chunk)
      if (extracted.durationSeconds && !recoveredDuration) {
        recoveredDuration = extracted.durationSeconds
      }
      if (extracted.gps && !recoveredGps) {
        recoveredGps = extracted.gps
      }
    }

    // If coordinates were not in header or footer, check telemetry chunk offsets in moov
    if (!recoveredGps && buffers.length > 0) {
      for (const chunkBuf of buffers) {
        const chunkOffsets = findTelemetryChunkOffsets(chunkBuf)
        for (const offset of chunkOffsets) {
          if (offset > 0 && offset < size) {
            try {
              const telemetryBlob = file.slice(offset, Math.min(size, offset + 16384))
              const telemetryBuf = await telemetryBlob.arrayBuffer()
              const chunkMeta = extractMetadataFromBuffer(new Uint8Array(telemetryBuf))
              if (chunkMeta.gps) {
                recoveredGps = chunkMeta.gps
                break
              }
            } catch {
              // Ignore slice errors
            }
          }
        }
        if (recoveredGps) break
      }
    }

    // Determine capturedAt from file.lastModified if valid
    let capturedAt: string | undefined
    if (file.lastModified && file.lastModified > 0) {
      const d = new Date(file.lastModified)
      if (!Number.isNaN(d.getTime())) {
        capturedAt = d.toISOString()
      }
    }

    if (recoveredGps) {
      return {
        latitude: recoveredGps.latitude,
        longitude: recoveredGps.longitude,
        durationSeconds: recoveredDuration || 60,
        capturedAt,
        source: recoveredGps.source,
      }
    }

    return null
  } catch (err) {
    console.warn('[videoGps] Failed to parse video file container:', err)
    return null
  }
}
