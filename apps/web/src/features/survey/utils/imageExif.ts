/**
 * @file imageExif.ts
 * @description Extracts GPS coordinates and capture timestamps directly from image file ArrayBuffers in browser.
 * Reads the JPEG APP1 EXIF binary segment, supporting both Big-Endian and Little-Endian TIFF representations.
 */

export interface ExtractedImageMetadata {
  latitude?: number
  longitude?: number
  capturedAt?: string
}

const JPEG_SOI = 0xffd8
const JPEG_APP1 = 0xffe1
const EXIF_HEADER = 0x45786966 // 'Exif' in ASCII
const TIFF_LITTLE_ENDIAN = 0x4949 // 'II'
const TIFF_BIG_ENDIAN = 0x4d4d // 'MM'

const GPS_IFD_TAG = 0x8825
const GPS_TAG_LAT_REF = 0x0001
const GPS_TAG_LAT = 0x0002
const GPS_TAG_LON_REF = 0x0003
const GPS_TAG_LON = 0x0004

/**
 * Reads binary ArrayBuffer of an image File and extracts GPS latitude/longitude.
 *
 * @param file - Target image File.
 * @returns ExtractedImageMetadata containing coordinates if present.
 */
export async function extractImageFileMetadata(file: File): Promise<ExtractedImageMetadata> {
  try {
    // Only read first 64 KB (covers any standard JPEG EXIF block)
    const slice = file.slice(0, 65536)
    const arrayBuffer = await slice.arrayBuffer()
    const buf = new Uint8Array(arrayBuffer)

    if (buf.length < 4) return {}

    const soi = (buf[0] << 8) | buf[1]
    if (soi !== JPEG_SOI) return {}

    // Find APP1 marker
    let offset = 2
    let exifOffset = -1

    while (offset + 4 < buf.length) {
      const marker = (buf[offset] << 8) | buf[offset + 1]
      const length = (buf[offset + 2] << 8) | buf[offset + 3]

      if (marker === JPEG_APP1) {
        const header =
          (buf[offset + 4] << 24) |
          (buf[offset + 5] << 16) |
          (buf[offset + 6] << 8) |
          buf[offset + 7]

        if (header === EXIF_HEADER) {
          exifOffset = offset + 10 // Skip marker (2) + length (2) + 'Exif\0\0' (6)
          break
        }
      }

      if ((marker & 0xff00) !== 0xff00 || marker === 0xffda) break
      offset += 2 + length
    }

    if (exifOffset < 0 || exifOffset + 8 > buf.length) return {}

    const tiffStart = exifOffset
    const isLE = (buf[tiffStart] << 8) | buf[tiffStart + 1]
    const littleEndian = isLE === TIFF_LITTLE_ENDIAN
    const bigEndian = isLE === TIFF_BIG_ENDIAN

    if (!littleEndian && !bigEndian) return {}

    function read16(pos: number): number {
      const a = buf[tiffStart + pos] ?? 0
      const b = buf[tiffStart + pos + 1] ?? 0
      return littleEndian ? a | (b << 8) : (a << 8) | b
    }

    function read32(pos: number): number {
      const a = buf[tiffStart + pos] ?? 0
      const b = buf[tiffStart + pos + 1] ?? 0
      const c = buf[tiffStart + pos + 2] ?? 0
      const d = buf[tiffStart + pos + 3] ?? 0
      return littleEndian
        ? (a | (b << 8) | (c << 16) | (d << 24)) >>> 0
        : ((a << 24) | (b << 16) | (c << 8) | d) >>> 0
    }

    function readRational(pos: number): number | null {
      const num = read32(pos)
      const den = read32(pos + 4)
      return den === 0 ? null : num / den
    }

    function readDMS(valOffset: number): number | null {
      const d = readRational(valOffset)
      const m = readRational(valOffset + 8)
      const s = readRational(valOffset + 16)
      if (d === null || m === null || s === null) return null
      return d + m / 60 + s / 3600
    }

    // IFD0 offset
    const ifd0Offset = read32(4)
    if (ifd0Offset < 8 || tiffStart + ifd0Offset + 2 > buf.length) return {}

    const numEntries = read16(ifd0Offset)
    let gpsIfdOffset = -1

    for (let i = 0; i < numEntries; i++) {
      const entryPos = ifd0Offset + 2 + i * 12
      if (tiffStart + entryPos + 12 > buf.length) break
      const tag = read16(entryPos)
      if (tag === GPS_IFD_TAG) {
        gpsIfdOffset = read32(entryPos + 8)
        break
      }
    }

    if (gpsIfdOffset < 0 || tiffStart + gpsIfdOffset + 2 > buf.length) return {}

    const numGpsEntries = read16(gpsIfdOffset)
    let latRef: string | null = null
    let lonRef: string | null = null
    let latDeg: number | null = null
    let lonDeg: number | null = null

    for (let i = 0; i < numGpsEntries; i++) {
      const entryPos = gpsIfdOffset + 2 + i * 12
      if (tiffStart + entryPos + 12 > buf.length) break
      const tag = read16(entryPos)

      if (tag === GPS_TAG_LAT_REF) {
        latRef = String.fromCharCode(buf[tiffStart + entryPos + 8])
      } else if (tag === GPS_TAG_LON_REF) {
        lonRef = String.fromCharCode(buf[tiffStart + entryPos + 8])
      } else if (tag === GPS_TAG_LAT) {
        const valOffset = read32(entryPos + 8)
        latDeg = readDMS(valOffset)
      } else if (tag === GPS_TAG_LON) {
        const valOffset = read32(entryPos + 8)
        lonDeg = readDMS(valOffset)
      }
    }

    // Extract capturedAt timestamp if present in EXIF text
    let capturedAt: string | undefined
    const textSlice = new TextDecoder('latin1').decode(buf)
    const dateMatch = /\b(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})\b/.exec(textSlice)
    if (dateMatch) {
      const [, y, m, d, h, min, s] = dateMatch
      const dateObj = new Date(Date.UTC(+y, +m - 1, +d, +h, +min, +s))
      if (!Number.isNaN(dateObj.getTime())) {
        capturedAt = dateObj.toISOString()
      }
    }

    if (latDeg !== null && lonDeg !== null) {
      let latitude = latDeg
      let longitude = lonDeg

      if (latRef === 'S') latitude = -latitude
      if (lonRef === 'W') longitude = -longitude

      if (
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        Math.abs(latitude) <= 90 &&
        Math.abs(longitude) <= 180 &&
        !(latitude === 0 && longitude === 0)
      ) {
        return {
          latitude: Number.parseFloat(latitude.toFixed(6)),
          longitude: Number.parseFloat(longitude.toFixed(6)),
          capturedAt: capturedAt || (file.lastModified ? new Date(file.lastModified).toISOString() : undefined),
        }
      }
    }

    // Fallback: check embedded JSON / key-value telemetry (e.g. camera kit frame telemetry {"c_lat": ..., "c_lon": ...})
    const cLatMatch = /(?:c_lat|latitude|lat)[\s"':=]+([+-]?\d{1,2}\.\d{4,})/i.exec(textSlice)
    const cLonMatch = /(?:c_lon|longitude|lon)[\s"':=]+([+-]?\d{1,3}\.\d{4,})/i.exec(textSlice)
    if (cLatMatch && cLonMatch) {
      const pLat = Number.parseFloat(cLatMatch[1])
      const pLon = Number.parseFloat(cLonMatch[1])
      if (
        Number.isFinite(pLat) &&
        Number.isFinite(pLon) &&
        Math.abs(pLat) <= 90 &&
        Math.abs(pLon) <= 180 &&
        !(pLat === 0 && pLon === 0)
      ) {
        return {
          latitude: Number.parseFloat(pLat.toFixed(6)),
          longitude: Number.parseFloat(pLon.toFixed(6)),
          capturedAt: capturedAt || (file.lastModified ? new Date(file.lastModified).toISOString() : undefined),
        }
      }
    }

    return capturedAt ? { capturedAt } : {}
  } catch (error) {
    console.warn('[imageExif] Failed to extract EXIF from image file:', error)
    return {}
  }
}
