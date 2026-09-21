/**
 * Image File GPS Parser
 *
 * Extracts GPS coordinates directly from the JPEG binary EXIF APP1 segment,
 * bypassing Android scoped storage GPS redaction that affects MediaStore and
 * the expo-media-library APIs (getAssetInfoAsync / getLocation / getExif).
 *
 * On Android 10+, even with ACCESS_MEDIA_LOCATION granted, the legacy
 * MediaLibrary API sometimes strips GPS from the EXIF object it returns.
 * This parser reads the raw bytes directly from the file on disk, which
 * always contains the full, unredacted EXIF data.
 *
 * Supports:
 * - JPEG APP1 EXIF segment (standard DSLR / smartphone / dashcam images)
 * - Both little-endian and big-endian TIFF byte orders
 * - GPS IFD rational DMS arrays (degrees, minutes, seconds as rationals)
 * - GPS IFD pointer lookup from IFD0 (tag 0x8825)
 */

import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

import type { ImageGpsCoordinates } from './image-gps';

// ─── Constants ──────────────────────────────────────────────────────────────

/** Maximum bytes to read from the start of the JPEG to find the EXIF APP1 segment. */
const JPEG_HEADER_READ_SIZE = 65536; // 64 KB — covers any reasonable EXIF block

const JPEG_SOI = 0xffd8; // Start Of Image marker
const JPEG_APP1 = 0xffe1; // APP1 marker (EXIF)
const EXIF_HEADER = 0x45786966; // 'Exif' in ASCII

const TIFF_LITTLE_ENDIAN = 0x4949; // 'II'
const TIFF_BIG_ENDIAN = 0x4d4d; // 'MM'

// GPS IFD tag numbers
const GPS_IFD_TAG = 0x8825; // Pointer to GPS IFD, in IFD0
const GPS_TAG_LAT_REF = 0x0001;
const GPS_TAG_LAT = 0x0002;
const GPS_TAG_LON_REF = 0x0003;
const GPS_TAG_LON = 0x0004;

// TIFF field types
const TIFF_TYPE_ASCII = 2;
const TIFF_TYPE_RATIONAL = 5; // unsigned rational: two 32-bit unsigned ints

// ─── Base64 helpers ──────────────────────────────────────────────────────────

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const BASE64_LOOKUP = new Uint8Array(256).fill(255);
for (let i = 0; i < BASE64_CHARS.length; i++) {
  BASE64_LOOKUP[BASE64_CHARS.charCodeAt(i)] = i;
}

function base64ToUint8Array(base64: string): Uint8Array {
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, '');
  const len = Math.floor((clean.length * 3) / 4);
  const out = new Uint8Array(len);
  let outIdx = 0;

  for (let i = 0; i < clean.length; i += 4) {
    const a = BASE64_LOOKUP[clean.charCodeAt(i)] ?? 0;
    const b = BASE64_LOOKUP[clean.charCodeAt(i + 1)] ?? 0;
    const c = BASE64_LOOKUP[clean.charCodeAt(i + 2)] ?? 0;
    const d = BASE64_LOOKUP[clean.charCodeAt(i + 3)] ?? 0;

    if (outIdx < len) out[outIdx++] = (a << 2) | (b >> 4);
    if (outIdx < len) out[outIdx++] = ((b & 0xf) << 4) | (c >> 2);
    if (outIdx < len) out[outIdx++] = ((c & 0x3) << 6) | d;
  }

  return out;
}

// ─── TIFF / EXIF binary reader ───────────────────────────────────────────────

function makeTiffReader(buf: Uint8Array, tiffStart: number) {
  const isLE = ((buf[tiffStart] ?? 0) << 8) | (buf[tiffStart + 1] ?? 0);
  const littleEndian = isLE === TIFF_LITTLE_ENDIAN;

  function read16(offset: number): number {
    const a = buf[tiffStart + offset] ?? 0;
    const b = buf[tiffStart + offset + 1] ?? 0;
    return littleEndian ? a | (b << 8) : (a << 8) | b;
  }

  function read32(offset: number): number {
    const a = buf[tiffStart + offset] ?? 0;
    const b = buf[tiffStart + offset + 1] ?? 0;
    const c = buf[tiffStart + offset + 2] ?? 0;
    const d = buf[tiffStart + offset + 3] ?? 0;
    return littleEndian
      ? (a | (b << 8) | (c << 16) | (d << 24)) >>> 0
      : ((a << 24) | (b << 16) | (c << 8) | d) >>> 0;
  }

  function readRational(offset: number): number | null {
    const num = read32(offset);
    const den = read32(offset + 4);
    return den === 0 ? null : num / den;
  }

  function readAscii(offset: number, count: number): string {
    const end = Math.min(tiffStart + offset + count, buf.length);
    let str = '';
    for (let i = tiffStart + offset; i < end; i++) {
      const ch = buf[i];
      if (ch === 0 || ch === undefined) break;
      str += String.fromCharCode(ch);
    }
    return str;
  }

  return { read16, read32, readRational, readAscii };
}

// ─── GPS extraction ──────────────────────────────────────────────────────────

/**
 * Parses GPS coordinates from a TIFF structure at `tiffStart` within `buf`.
 * Returns decimal lat/lon or null if the GPS IFD is absent or malformed.
 */
function extractGpsFromTiff(buf: Uint8Array, tiffStart: number): ImageGpsCoordinates | null {
  if (tiffStart + 8 > buf.length) return null;

  const { read16, read32, readRational, readAscii } = makeTiffReader(buf, tiffStart);

  const byteOrder = read16(0);
  if (byteOrder !== TIFF_LITTLE_ENDIAN && byteOrder !== TIFF_BIG_ENDIAN) return null;

  const magic = read16(2);
  if (magic !== 42) return null; // TIFF magic number

  const ifd0Offset = read32(4);
  if (ifd0Offset + 2 > buf.length - tiffStart) return null;

  const ifd0Count = read16(ifd0Offset);
  let gpsIfdOffset: number | null = null;

  for (let i = 0; i < ifd0Count; i++) {
    const entryOffset = ifd0Offset + 2 + i * 12;
    if (entryOffset + 12 > buf.length - tiffStart) break;

    const tag = read16(entryOffset);
    if (tag === GPS_IFD_TAG) {
      gpsIfdOffset = read32(entryOffset + 8);
      break;
    }
  }

  if (gpsIfdOffset === null) return null;
  if (gpsIfdOffset + 2 > buf.length - tiffStart) return null;

  const gpsCount = read16(gpsIfdOffset);
  let latRef: string | null = null;
  let lonRef: string | null = null;
  let latDms: [number, number, number] | null = null;
  let lonDms: [number, number, number] | null = null;

  for (let i = 0; i < gpsCount; i++) {
    const entryOffset = gpsIfdOffset + 2 + i * 12;
    if (entryOffset + 12 > buf.length - tiffStart) break;

    const tag = read16(entryOffset);
    const type = read16(entryOffset + 2);
    const count = read32(entryOffset + 4);
    const valueField = entryOffset + 8;

    if (type === TIFF_TYPE_ASCII && (tag === GPS_TAG_LAT_REF || tag === GPS_TAG_LON_REF)) {
      // ASCII value: inline if ≤ 4 bytes, else pointer
      let str: string;
      const totalBytes = count;
      if (totalBytes <= 4) {
        str = readAscii(valueField, totalBytes);
      } else {
        const strOffset = read32(valueField);
        str = readAscii(strOffset, totalBytes);
      }

      if (tag === GPS_TAG_LAT_REF) latRef = str.trim();
      else lonRef = str.trim();
    }

    if (type === TIFF_TYPE_RATIONAL && count === 3 && (tag === GPS_TAG_LAT || tag === GPS_TAG_LON)) {
      // 3 rationals (D, M, S) — always stored at offset because 3×8 = 24 bytes > 4
      const ratOffset = read32(valueField);
      const d = readRational(ratOffset);
      const m = readRational(ratOffset + 8);
      const s = readRational(ratOffset + 16);

      if (d !== null && m !== null && s !== null) {
        const dms: [number, number, number] = [d, m, s];
        if (tag === GPS_TAG_LAT) latDms = dms;
        else lonDms = dms;
      }
    }
  }

  if (!latDms || !lonDms) return null;

  const toDecimal = (dms: [number, number, number], ref: string | null): number => {
    const sign = ref === 'S' || ref === 'W' ? -1 : 1;
    return sign * (dms[0] + dms[1] / 60 + dms[2] / 3600);
  };

  const latitude = toDecimal(latDms, latRef);
  const longitude = toDecimal(lonDms, lonRef);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;

  return { latitude, longitude };
}

/**
 * Scans the beginning of a JPEG buffer for the EXIF APP1 segment and extracts
 * GPS coordinates from the embedded TIFF structure.
 *
 * Exported for unit testing.
 */
export function extractGpsFromJpegBuffer(buf: Uint8Array): ImageGpsCoordinates | null {
  if (buf.length < 4) return null;

  const soi = ((buf[0] ?? 0) << 8) | (buf[1] ?? 0);
  if (soi !== JPEG_SOI) return null;

  let offset = 2;

  while (offset + 4 <= buf.length) {
    const marker = ((buf[offset] ?? 0) << 8) | (buf[offset + 1] ?? 0);
    const segLen = ((buf[offset + 2] ?? 0) << 8) | (buf[offset + 3] ?? 0);

    if (segLen < 2 || offset + 2 + segLen > buf.length) break;

    if (marker === JPEG_APP1 && segLen > 6) {
      // Check for 'Exif\0\0' header (6 bytes after the APP1 length field)
      const headerWord = ((buf[offset + 4] ?? 0) << 24) | ((buf[offset + 5] ?? 0) << 16) | ((buf[offset + 6] ?? 0) << 8) | (buf[offset + 7] ?? 0);

      if (headerWord === EXIF_HEADER) {
        // TIFF data starts 6 bytes after the length field: offset+4 ('E','x','i','f') + '\0\0'
        const tiffStart = offset + 4 + 6;
        const gps = extractGpsFromTiff(buf, tiffStart);
        if (gps) return gps;
      }
    }

    // Stop scanning past SOS (Start Of Scan) — image data begins, no more metadata segments
    if (marker === 0xffda) break;

    offset += 2 + segLen;
  }

  return null;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Reads GPS coordinates directly from a JPEG image file on disk.
 *
 * This bypasses Android's scoped storage GPS redaction that affects the
 * expo-media-library `getExif()` and `getLocation()` APIs. Only reads the
 * first 64 KB of the file (the EXIF block is always near the beginning of
 * a JPEG), so memory overhead is negligible even for large images.
 *
 * @param imageUri - A `file://` URI or a `content://` URI to the image.
 * @returns The GPS coordinates, or `null` if not found or not applicable.
 */
export async function extractGpsFromImageFile(
  imageUri: string,
): Promise<ImageGpsCoordinates | null> {
  if (Platform.OS === 'web') return null;

  try {
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
      position: 0,
      length: JPEG_HEADER_READ_SIZE,
    });

    const buf = base64ToUint8Array(base64);
    return extractGpsFromJpegBuffer(buf);
  } catch (err) {
    console.warn('[ImageFileGps] Failed to read GPS from image file:', err);
    return null;
  }
}
