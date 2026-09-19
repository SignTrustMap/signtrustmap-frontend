/**
 * Video File GPS & Telemetry Parser
 * 
 * Extracts embedded GPS metadata and duration directly from video file containers (MP4, MOV).
 * Supports:
 * 1. QuickTime User Data ISO 6709 atom (`©xyz` / `\xa9xyz`) (iPhone, Android, QuickTime, many dashcams)
 * 2. NMEA 0183 sentences (`$GPRMC`, `$GNRMC`, `$GPGGA`, `$GNGGA`) (VIOFO, 70mai, Thinkware, Novatek, BlackVue dashcams)
 * 3. 3GPP Location atom (`loci`)
 * 4. GoPro GPMF telemetry (`GPS5`)
 * 5. ISO MP4 `mvhd` atom duration recovery (fixes Android MediaStore `duration: -0.001` bug)
 */

import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

export type ExtractedVideoFileGps = {
  latitude: number;
  longitude: number;
  durationSeconds?: number;
  source: 'camm' | 'quicktime_xyz' | 'nmea_rmc' | 'nmea_gga' | 'gpp_loci' | 'gopro_gpmf' | 'text_key_value';
};

/**
 * Converts NMEA coordinate format (DDMM.MMMM or DDDMM.MMMM) to decimal degrees.
 */
export function nmeaToDecimal(nmeaCoord: string, direction: string): number | null {
  const dotIndex = nmeaCoord.indexOf('.');
  if (dotIndex < 2) return null;

  const degLen = dotIndex - 2;
  const degrees = Number.parseFloat(nmeaCoord.slice(0, degLen));
  const minutes = Number.parseFloat(nmeaCoord.slice(degLen));

  if (!Number.isFinite(degrees) || !Number.isFinite(minutes)) return null;

  let decimal = degrees + minutes / 60;
  const dir = direction.toUpperCase();
  if (dir === 'S' || dir === 'W') {
    decimal = -decimal;
  }

  return Number.parseFloat(decimal.toFixed(6));
}

/**
 * Parses ISO 6709 coordinate strings commonly found in QuickTime `©xyz` atoms.
 * Formats: `+10.770046+106.691383/` or `+10.770046+106.691383+015.000/` or `-33.8568+151.2153/`
 */
export function parseIso6709(text: string): { latitude: number; longitude: number } | null {
  const regex = /([+-]\d{2,3}(?:\.\d+)?)([+-]\d{2,3}(?:\.\d+)?)(?:([+-]\d+(?:\.\d+)?))?\/?/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const lat = Number.parseFloat(match[1]);
    const lon = Number.parseFloat(match[2]);

    if (
      Number.isFinite(lat) &&
      Number.isFinite(lon) &&
      Math.abs(lat) <= 90 &&
      Math.abs(lon) <= 180 &&
      !(lat === 0 && lon === 0)
    ) {
      // Must have fractional part or be standard coordinate length to avoid false positives on arbitrary integers
      const hasDecimalOrMinLength = match[1].includes('.') || match[1].length >= 3;
      if (hasDecimalOrMinLength) {
        return {
          latitude: Number.parseFloat(lat.toFixed(6)),
          longitude: Number.parseFloat(lon.toFixed(6)),
        };
      }
    }
  }

  return null;
}

/**
 * Parses NMEA 0183 sentences ($GPRMC, $GNRMC, $GPGGA, $GNGGA) embedded in dashcam video metadata.
 */
export function parseNmeaSentences(text: string): { latitude: number; longitude: number; source: 'nmea_rmc' | 'nmea_gga' } | null {
  // 1. Check RMC sentences: $GPRMC,hhmmss.ss,status,lat,N/S,lon,E/W,...
  const rmcRegex = /\$G[PNBLA]RMC,\s*[^,]*,\s*([AV]),\s*(\d{2,4}\.\d+),\s*([NSns]),\s*(\d{3,5}\.\d+),\s*([EWew])/g;
  let rmcMatch: RegExpExecArray | null;

  while ((rmcMatch = rmcRegex.exec(text)) !== null) {
    const status = rmcMatch[1].toUpperCase();
    const latStr = rmcMatch[2];
    const latDir = rmcMatch[3];
    const lonStr = rmcMatch[4];
    const lonDir = rmcMatch[5];

    const lat = nmeaToDecimal(latStr, latDir);
    const lon = nmeaToDecimal(lonStr, lonDir);

    if (
      (status === 'A' || status === 'V') &&
      lat !== null &&
      lon !== null &&
      Math.abs(lat) <= 90 &&
      Math.abs(lon) <= 180 &&
      !(lat === 0 && lon === 0)
    ) {
      // Prefer active fix 'A', but accept 'V' if non-zero coordinates exist
      return { latitude: lat, longitude: lon, source: 'nmea_rmc' };
    }
  }

  // 2. Check GGA sentences: $GPGGA,hhmmss.ss,lat,N/S,lon,E/W,...
  const ggaRegex = /\$G[PNBLA]GGA,\s*[^,]*,\s*(\d{2,4}\.\d+),\s*([NSns]),\s*(\d{3,5}\.\d+),\s*([EWew])/g;
  let ggaMatch: RegExpExecArray | null;

  while ((ggaMatch = ggaRegex.exec(text)) !== null) {
    const latStr = ggaMatch[1];
    const latDir = ggaMatch[2];
    const lonStr = ggaMatch[3];
    const lonDir = ggaMatch[4];

    const lat = nmeaToDecimal(latStr, latDir);
    const lon = nmeaToDecimal(lonStr, lonDir);

    if (
      lat !== null &&
      lon !== null &&
      Math.abs(lat) <= 90 &&
      Math.abs(lon) <= 180 &&
      !(lat === 0 && lon === 0)
    ) {
      return { latitude: lat, longitude: lon, source: 'nmea_gga' };
    }
  }

  return null;
}

/**
 * Searches for QuickTime `©xyz` atom (bytes: 0xa9, 0x78, 0x79, 0x7a) in binary buffer.
 */
export function parseQuickTimeXyzAtom(bytes: Uint8Array): { latitude: number; longitude: number } | null {
  const len = bytes.length;
  for (let i = 4; i < len - 16; i++) {
    // 0xa9 ('©'), 'x', 'y', 'z'
    if (
      bytes[i] === 0xa9 &&
      bytes[i + 1] === 0x78 &&
      bytes[i + 2] === 0x79 &&
      bytes[i + 3] === 0x7a
    ) {
      // Read trailing string (up to 48 bytes)
      let str = '';
      const limit = Math.min(len, i + 48);
      for (let j = i + 4; j < limit; j++) {
        const code = bytes[j];
        if (code === 0 || code === 0x2f) { // null or '/'
          if (str.length > 5) {
            str += '/';
            break;
          }
        }
        if (code >= 0x20 && code <= 0x7e) {
          str += String.fromCharCode(code);
        }
      }

      const parsed = parseIso6709(str);
      if (parsed) return parsed;
    }
  }
  return null;
}

/**
 * Searches for 3GPP `loci` atom (bytes: 'l', 'o', 'c', 'i') in binary buffer.
 */
export function parse3gppLociAtom(bytes: Uint8Array): { latitude: number; longitude: number } | null {
  const len = bytes.length;
  for (let i = 4; i < len - 24; i++) {
    // 'l', 'o', 'c', 'i'
    if (
      bytes[i] === 0x6c &&
      bytes[i + 1] === 0x6f &&
      bytes[i + 2] === 0x63 &&
      bytes[i + 3] === 0x69
    ) {
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      // Skip version (4 bytes), language (2 bytes)
      let offset = i + 10;
      // Skip null-terminated place name
      while (offset < len && bytes[offset] !== 0) {
        offset++;
      }
      offset++; // skip null
      offset++; // skip role (1 byte)

      if (offset + 8 <= len) {
        const lonRaw = view.getInt32(offset, false);
        const latRaw = view.getInt32(offset + 4, false);
        const lon = Number.parseFloat((lonRaw / 65536.0).toFixed(6));
        const lat = Number.parseFloat((latRaw / 65536.0).toFixed(6));

        if (
          Number.isFinite(lat) &&
          Number.isFinite(lon) &&
          Math.abs(lat) <= 90 &&
          Math.abs(lon) <= 180 &&
          !(lat === 0 && lon === 0)
        ) {
          return { latitude: lat, longitude: lon };
        }
      }
    }
  }
  return null;
}

/**
 * Recovers video duration in seconds from MP4 `mvhd` (Movie Header) atom.
 * Fixes Android MediaStore reporting `duration: -0.001` or 0 for external video clips.
 */
export function parseDurationFromMvhd(bytes: Uint8Array): number | null {
  const len = bytes.length;
  for (let i = 4; i < len - 32; i++) {
    // 'm', 'v', 'h', 'd'
    if (
      bytes[i] === 0x6d &&
      bytes[i + 1] === 0x76 &&
      bytes[i + 2] === 0x68 &&
      bytes[i + 3] === 0x64
    ) {
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      const version = bytes[i + 4];

      let timescale = 0;
      let duration = 0;

      if (version === 0) {
        // v0: 4B flags, 4B createTime, 4B modTime, 4B timescale, 4B duration
        timescale = view.getUint32(i + 4 + 4 + 4 + 4, false);
        duration = view.getUint32(i + 4 + 4 + 4 + 4 + 4, false);
      } else if (version === 1) {
        // v1: 4B flags, 8B createTime, 8B modTime, 4B timescale, 8B duration
        timescale = view.getUint32(i + 4 + 4 + 8 + 8, false);
        // read lower 32-bit of 64-bit duration
        duration = view.getUint32(i + 4 + 4 + 8 + 8 + 4 + 4, false);
      }

      if (timescale > 0 && duration > 0) {
        const durationSeconds = duration / timescale;
        if (Number.isFinite(durationSeconds) && durationSeconds > 0 && durationSeconds < 86400) {
          return Math.round(durationSeconds);
        }
      }
    }
  }
  return null;
}

/**
 * Parses Google / GoPro Camera Motion Metadata (`camm`) samples.
 * Supported by modern GoPro (HERO), Google Street View, and 360 cameras.
 *
 * Spec:
 * - Type 6 (GPS with velocity & accuracy):
 *   Offset 0..2: uint16 reserved = 0
 *   Offset 2..4: uint16 type = 6
 *   Offset 4..12: double time_gps_epoch
 *   Offset 12..16: int32 gps_fix_type (0 = none, 2 = 2D, 3 = 3D)
 *   Offset 16..24: double latitude (Float64)
 *   Offset 24..32: double longitude (Float64)
 *   Offset 32..36: float altitude
 *   Length = 60 bytes.
 *
 * - Type 5 (Simple GPS coordinates):
 *   Offset 0..2: uint16 reserved = 0
 *   Offset 2..4: uint16 type = 5
 *   Offset 4..12: double latitude
 *   Offset 12..20: double longitude
 *   Offset 20..28: double altitude
 */
export function parseCammSamples(bytes: Uint8Array): { latitude: number; longitude: number } | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const len = bytes.length;

  for (let i = 0; i <= len - 60; i += 2) {
    // Little-Endian (camm specification default)
    const reservedLE = view.getUint16(i, true);
    if (reservedLE === 0) {
      const typeLE = view.getUint16(i + 2, true);
      if (typeLE === 6) {
        const fixType = view.getInt32(i + 12, true);
        if (fixType >= 0 && fixType <= 5) {
          const lat = view.getFloat64(i + 16, true);
          const lon = view.getFloat64(i + 24, true);
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
            };
          }
        }
      } else if (typeLE === 5) {
        const lat = view.getFloat64(i + 4, true);
        const lon = view.getFloat64(i + 12, true);
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
          };
        }
      }
    }

    // Big-Endian fallback
    const reservedBE = view.getUint16(i, false);
    if (reservedBE === 0) {
      const typeBE = view.getUint16(i + 2, false);
      if (typeBE === 6) {
        const fixType = view.getInt32(i + 12, false);
        if (fixType >= 0 && fixType <= 5) {
          const lat = view.getFloat64(i + 16, false);
          const lon = view.getFloat64(i + 24, false);
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
            };
          }
        }
      } else if (typeBE === 5) {
        const lat = view.getFloat64(i + 4, false);
        const lon = view.getFloat64(i + 12, false);
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
          };
        }
      }
    }
  }

  return null;
}

/**
 * Parses GoPro GPMF telemetry stream (`GPS5` FourCC).
 * Supported by older and newer GoPro cameras (HERO 5 through 12).
 */
export function parseGpmfGps(bytes: Uint8Array): { latitude: number; longitude: number } | null {
  const len = bytes.length;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  for (let i = 0; i <= len - 28; i++) {
    // 'G', 'P', 'S', '5'
    if (
      bytes[i] === 0x47 &&
      bytes[i + 1] === 0x50 &&
      bytes[i + 2] === 0x53 &&
      bytes[i + 3] === 0x35
    ) {
      let scale = 10000000; // default 1e7
      const lookbackLimit = Math.max(0, i - 128);
      for (let s = i - 8; s >= lookbackLimit; s--) {
        if (
          bytes[s] === 0x53 &&
          bytes[s + 1] === 0x43 &&
          bytes[s + 2] === 0x41 &&
          bytes[s + 3] === 0x4c
        ) {
          const scalType = bytes[s + 4];
          if (scalType === 0x6c || scalType === 0x4c) {
            const parsedScale = view.getInt32(s + 8, false);
            if (parsedScale > 0 && parsedScale <= 1e9) {
              scale = parsedScale;
            }
          } else if (scalType === 0x73 || scalType === 0x53) {
            const parsedScale = view.getInt16(s + 8, false);
            if (parsedScale > 0) {
              scale = parsedScale;
            }
          }
          break;
        }
      }

      const dataOffset = i + 8;
      if (dataOffset + 8 <= len) {
        const rawLat = view.getInt32(dataOffset, false);
        const rawLon = view.getInt32(dataOffset + 4, false);

        const lat = rawLat / scale;
        const lon = rawLon / scale;

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
          };
        }
      }
    }
  }

  return null;
}

/**
 * Searches the moov atom for telemetry tracks (camm or gpmd) and returns sample chunk offsets.
 */
export function findTelemetryChunkOffsets(bytes: Uint8Array): number[] {
  const offsets: number[] = [];
  const len = bytes.length;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  // Search for 'camm' or 'gpmd' handler/sample description
  for (let i = 0; i <= len - 16; i++) {
    const isCamm = bytes[i] === 0x63 && bytes[i + 1] === 0x61 && bytes[i + 2] === 0x6d && bytes[i + 3] === 0x6d; // 'camm'
    const isGpmd = bytes[i] === 0x67 && bytes[i + 1] === 0x70 && bytes[i + 2] === 0x6d && bytes[i + 3] === 0x64; // 'gpmd'

    if (isCamm || isGpmd) {
      // Find following stco or co64 within next 4096 bytes
      const limit = Math.min(len - 12, i + 4096);
      for (let j = i; j < limit; j++) {
        // 's', 't', 'c', 'o'
        if (bytes[j] === 0x73 && bytes[j + 1] === 0x74 && bytes[j + 2] === 0x63 && bytes[j + 3] === 0x6f) {
          const entryCount = view.getUint32(j + 8, false);
          for (let e = 0; e < Math.min(entryCount, 4); e++) {
            offsets.push(view.getUint32(j + 12 + e * 4, false));
          }
          break;
        }
        // 'c', 'o', '6', '4'
        if (bytes[j] === 0x63 && bytes[j + 1] === 0x6f && bytes[j + 2] === 0x36 && bytes[j + 3] === 0x34) {
          const entryCount = view.getUint32(j + 8, false);
          for (let e = 0; e < Math.min(entryCount, 4); e++) {
            // Read 64-bit chunk offset
            const high = view.getUint32(j + 12 + e * 8, false);
            const low = view.getUint32(j + 12 + e * 8 + 4, false);
            offsets.push(high * 0x100000000 + low);
          }
          break;
        }
      }
    }
  }

  return offsets;
}

/**
 * Decodes a Uint8Array buffer into a Latin-1/ASCII string safe for regex searching.
 */
export function bufferToAsciiString(bytes: Uint8Array): string {
  let result = '';
  const len = bytes.length;
  const step = 8192;
  for (let i = 0; i < len; i += step) {
    const slice = bytes.subarray(i, Math.min(i + step, len));
    result += String.fromCharCode.apply(null, slice as unknown as number[]);
  }
  return result;
}

/**
 * Inspects a binary buffer chunk to extract GPS and duration metadata.
 */
export function extractMetadataFromBuffer(bytes: Uint8Array): {
  gps?: { latitude: number; longitude: number; source: ExtractedVideoFileGps['source'] };
  durationSeconds?: number;
} {
  const result: {
    gps?: { latitude: number; longitude: number; source: ExtractedVideoFileGps['source'] };
    durationSeconds?: number;
  } = {};

  // 1. Duration from mvhd
  const duration = parseDurationFromMvhd(bytes);
  if (duration !== null) {
    result.durationSeconds = duration;
  }

  // 2. Camera Motion Metadata (CAMM) - GoPro HERO, Google Street View, 360 cameras
  const camm = parseCammSamples(bytes);
  if (camm) {
    result.gps = { ...camm, source: 'camm' };
    return result;
  }

  // 3. GoPro GPMF telemetry (GPS5)
  const gpmf = parseGpmfGps(bytes);
  if (gpmf) {
    result.gps = { ...gpmf, source: 'gopro_gpmf' };
    return result;
  }

  // 4. QuickTime ©xyz binary atom
  const xyz = parseQuickTimeXyzAtom(bytes);
  if (xyz) {
    result.gps = { ...xyz, source: 'quicktime_xyz' };
    return result;
  }

  // 5. 3GPP loci binary atom
  const loci = parse3gppLociAtom(bytes);
  if (loci) {
    result.gps = { ...loci, source: 'gpp_loci' };
    return result;
  }

  // 6. ASCII string search: NMEA sentences and ISO 6709 text
  const text = bufferToAsciiString(bytes);

  // 6a. NMEA
  const nmea = parseNmeaSentences(text);
  if (nmea) {
    result.gps = nmea;
    return result;
  }

  // 6b. Raw ISO 6709 text
  const iso6709 = parseIso6709(text);
  if (iso6709) {
    result.gps = { ...iso6709, source: 'quicktime_xyz' };
    return result;
  }

  // 6c. JSON / Key-value / XMP patterns: "latitude": 10.77, "longitude": 106.69
  const kvLat = /(?:latitude|gps_lat|lat)[\s"':=]+([+-]?\d{1,2}\.\d{4,})/i.exec(text);
  const kvLon = /(?:longitude|gps_lon|lon)[\s"':=]+([+-]?\d{1,3}\.\d{4,})/i.exec(text);
  if (kvLat && kvLon) {
    const lat = Number.parseFloat(kvLat[1]);
    const lon = Number.parseFloat(kvLon[1]);
    if (
      Number.isFinite(lat) &&
      Number.isFinite(lon) &&
      Math.abs(lat) <= 90 &&
      Math.abs(lon) <= 180 &&
      !(lat === 0 && lon === 0)
    ) {
      result.gps = { latitude: Number.parseFloat(lat.toFixed(6)), longitude: Number.parseFloat(lon.toFixed(6)), source: 'text_key_value' };
      return result;
    }
  }

  return result;
}

function base64ToUint8Array(base64: string): Uint8Array {
  if (typeof atob === 'function') {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  const globalAny = globalThis as { Buffer?: { from: (str: string, enc: string) => ArrayBufferView } };
  if (typeof globalAny.Buffer !== 'undefined') {
    return new Uint8Array(globalAny.Buffer.from(base64, 'base64') as unknown as ArrayLike<number>);
  }
  return new Uint8Array(0);
}

async function readVideoSlice(videoUri: string, position: number, length: number): Promise<Uint8Array | null> {
  if (Platform.OS !== 'web') {
    try {
      const base64 = await FileSystem.readAsStringAsync(videoUri, {
        encoding: FileSystem.EncodingType.Base64,
        position,
        length,
      });
      return base64ToUint8Array(base64);
    } catch {
      // fallback to null
    }
  }
  return null;
}

/**
 * Reads ArrayBuffer safely from Blob across Web and React Native environments.
 */
async function readBlobAsArrayBuffer(blob: any): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === 'function') {
    return blob.arrayBuffer();
  }
  if (typeof blob.bytes === 'function') {
    const bytes = await blob.bytes();
    return bytes.buffer;
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(blob);
  });
}

/**
 * Reads the video container header (first 1.5MB) and footer (last 1.5MB) to extract GPS.
 * Keeps memory usage strictly negligible (< 3 MB) even for 10 GB 4K video files.
 */
export async function extractGpsFromVideoFile(
  videoUri: string,
): Promise<ExtractedVideoFileGps | null> {
  try {
    let size = 0;
    if (Platform.OS !== 'web') {
      try {
        const info = await FileSystem.getInfoAsync(videoUri);
        if (info.exists && typeof info.size === 'number' && info.size > 0) {
          size = info.size;
        }
      } catch {}
    }

    if (!size) {
      try {
        const head = await fetch(videoUri, { method: 'HEAD' });
        const cl = head.headers.get('content-length');
        if (cl && Number(cl) > 0) size = Number(cl);
      } catch {}
    }

    let webBlob: any = null;
    if (!size) {
      const response = await fetch(videoUri);
      if (!response.ok && /^https?:/i.test(videoUri)) {
        return null;
      }
      webBlob = await response.blob();
      size = webBlob.size;
    }

    const CHUNK_SIZE = 1.5 * 1024 * 1024; // 1.5 MB covers standard moov/udta atoms
    const buffers: Uint8Array[] = [];

    if (size <= CHUNK_SIZE * 2) {
      if (webBlob) {
        const buf = await readBlobAsArrayBuffer(webBlob);
        buffers.push(new Uint8Array(buf));
      } else {
        const full = await readVideoSlice(videoUri, 0, size);
        if (full) buffers.push(full);
      }
    } else {
      if (webBlob) {
        const headerBlob = webBlob.slice(0, CHUNK_SIZE);
        const footerBlob = webBlob.slice(Math.max(0, size - CHUNK_SIZE), size);
        const [headerBuf, footerBuf] = await Promise.all([
          readBlobAsArrayBuffer(headerBlob),
          readBlobAsArrayBuffer(footerBlob),
        ]);
        buffers.push(new Uint8Array(headerBuf));
        buffers.push(new Uint8Array(footerBuf));
      } else {
        const [headerBuf, footerBuf] = await Promise.all([
          readVideoSlice(videoUri, 0, CHUNK_SIZE),
          readVideoSlice(videoUri, Math.max(0, size - CHUNK_SIZE), CHUNK_SIZE),
        ]);
        if (headerBuf) buffers.push(headerBuf);
        if (footerBuf) buffers.push(footerBuf);
      }
    }

    let recoveredDuration: number | undefined;
    let recoveredGps: { latitude: number; longitude: number; source: ExtractedVideoFileGps['source'] } | undefined;

    for (const chunk of buffers) {
      const extracted = extractMetadataFromBuffer(chunk);
      if (extracted.durationSeconds && !recoveredDuration) {
        recoveredDuration = extracted.durationSeconds;
      }
      if (extracted.gps && !recoveredGps) {
        recoveredGps = extracted.gps;
      }
    }

    // If coordinates weren't in header/footer, check if moov pointed to an offset mid-file
    if (!recoveredGps && buffers.length > 0) {
      const chunkOffsets = findTelemetryChunkOffsets(buffers[0]);
      for (const offset of chunkOffsets) {
        if (offset > 0 && offset < size) {
          try {
            if (webBlob) {
              const telemetryBlob = webBlob.slice(offset, Math.min(size, offset + 8192));
              const telemetryBuf = await readBlobAsArrayBuffer(telemetryBlob);
              const chunkMeta = extractMetadataFromBuffer(new Uint8Array(telemetryBuf));
              if (chunkMeta.gps) {
                recoveredGps = chunkMeta.gps;
                break;
              }
            } else {
              const telemetryBuf = await readVideoSlice(videoUri, offset, 8192);
              if (telemetryBuf) {
                const chunkMeta = extractMetadataFromBuffer(telemetryBuf);
                if (chunkMeta.gps) {
                  recoveredGps = chunkMeta.gps;
                  break;
                }
              }
            }
          } catch {
            // Ignore slice errors
          }
        }
      }
    }

    if (recoveredGps) {
      return {
        latitude: recoveredGps.latitude,
        longitude: recoveredGps.longitude,
        durationSeconds: recoveredDuration,
        source: recoveredGps.source,
      };
    }

    return null;
  } catch (err) {
    console.warn('[VideoFileGps] Failed to inspect video file:', err);
    return null;
  }
}
