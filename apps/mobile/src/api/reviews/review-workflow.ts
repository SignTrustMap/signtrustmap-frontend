import type { MyReviewHistoryResponse, RemedySignDto, ReviewCandidate, ReviewQueueResponse } from '@/types/reviewsType';

export type RemedySign = RemedySignDto;

export type ReviewSubmission = {
  captured: string;
  id: string;
  image: any;
  location: string;
  predictedSignTypeId?: number;
  remedySigns?: RemedySign[];
  surveyorId: string;
  title: string;
  latitude?: number | null;
  longitude?: number | null;
  rawCandidate?: any;
};

export type ReviewDecision = {
  action: 'approved' | 'declined' | 'reported';
  declineNote?: string;
  declineReason?: string;
  suggestedSignTypeId?: number | string;
};

export type ReviewHistoryItem = {
  action: 'approved' | 'declined';
  submission: ReviewSubmission;
};

import { env } from '@/config/env';

const S3_BASE = env.storageUrl;

const KNOWN_BUCKETS = ['stm-sign-crops', 'stm-raw-videos', 'stm-gpx-logs', 'stm-raw-images'];

export function resolveS3Url(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('file://') || url.startsWith('content://')) return url;
  if (url.startsWith('https://cdn.signmap.site/')) {
    const rawPath = url.slice('https://cdn.signmap.site/'.length).replace(/^\/+/, '');
    const hasBucket = KNOWN_BUCKETS.some((b) => rawPath.startsWith(b + '/'));
    return `${S3_BASE}/${hasBucket ? '' : 'stm-sign-crops/'}${rawPath}`;
  }
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const clean = url.replace(/^\/+/, '');
  const hasBucket = KNOWN_BUCKETS.some((b) => clean.startsWith(b + '/'));
  return `${S3_BASE}/${hasBucket ? '' : 'stm-sign-crops/'}${clean}`;
}

export const resolveCdnUrl = resolveS3Url;

function formatCaptured(value?: string) {
  if (!value) return 'Capture time unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
  });
}

export function extractCoordinateFromCandidate(candidate: any): { latitude: number | null; longitude: number | null } {
  if (!candidate || typeof candidate !== 'object') return { latitude: null, longitude: null };

  const parseNumber = (val: any): number | null => {
    if (val === null || val === undefined || val === '') return null;
    const num = typeof val === 'number' ? val : parseFloat(String(val));
    return Number.isFinite(num) ? num : null;
  };

  // 1. Direct latitude / longitude or lat / lng / lon
  let lat = parseNumber(candidate.latitude ?? candidate.lat);
  let lon = parseNumber(candidate.longitude ?? candidate.lng ?? candidate.lon);

  // 2. locationContext.coordinates
  if (lat == null || lon == null) {
    const locCoord = candidate.locationContext?.coordinates;
    if (Array.isArray(locCoord) && locCoord.length >= 2) {
      lon = parseNumber(locCoord[0]);
      lat = parseNumber(locCoord[1]);
    } else if (locCoord && typeof locCoord === 'object') {
      lat = parseNumber(locCoord.latitude ?? locCoord.lat);
      lon = parseNumber(locCoord.longitude ?? locCoord.lng ?? locCoord.lon);
    }
  }

  // 3. locationContext direct
  if (lat == null || lon == null) {
    lat = parseNumber(candidate.locationContext?.latitude ?? candidate.locationContext?.lat);
    lon = parseNumber(candidate.locationContext?.longitude ?? candidate.locationContext?.lng ?? candidate.locationContext?.lon);
  }

  // 4. location object or coordinates array
  if (lat == null || lon == null) {
    const loc = candidate.location;
    if (Array.isArray(loc) && loc.length >= 2) {
      lon = parseNumber(loc[0]);
      lat = parseNumber(loc[1]);
    } else if (loc && typeof loc === 'object') {
      if (Array.isArray(loc.coordinates) && loc.coordinates.length >= 2) {
        lon = parseNumber(loc.coordinates[0]);
        lat = parseNumber(loc.coordinates[1]);
      } else {
        lat = parseNumber(loc.latitude ?? loc.lat);
        lon = parseNumber(loc.longitude ?? loc.lng ?? loc.lon);
      }
    }
  }

  // 5. coordinates array on candidate
  if (lat == null || lon == null) {
    if (Array.isArray(candidate.coordinates) && candidate.coordinates.length >= 2) {
      lon = parseNumber(candidate.coordinates[0]);
      lat = parseNumber(candidate.coordinates[1]);
    }
  }

  // 6. candidate.candidateSign
  if (lat == null || lon == null) {
    const cs = candidate.candidateSign;
    if (cs && typeof cs === 'object') {
      const csCoord = extractCoordinateFromCandidate(cs);
      if (csCoord.latitude != null && csCoord.longitude != null) {
        lat = csCoord.latitude;
        lon = csCoord.longitude;
      }
    }
  }

  // 7. submission nested
  if (lat == null || lon == null) {
    const sub = candidate.submission;
    if (sub && typeof sub === 'object') {
      const subCoord = extractCoordinateFromCandidate(sub);
      if (subCoord.latitude != null && subCoord.longitude != null) {
        lat = subCoord.latitude;
        lon = subCoord.longitude;
      }
    }
  }

  // 8. rawCandidate nested
  if (lat == null || lon == null) {
    if (candidate.rawCandidate && candidate.rawCandidate !== candidate) {
      const rawCoord = extractCoordinateFromCandidate(candidate.rawCandidate);
      if (rawCoord.latitude != null && rawCoord.longitude != null) {
        lat = rawCoord.latitude;
        lon = rawCoord.longitude;
      }
    }
  }

  return { latitude: lat, longitude: lon };
}

export function toSubmission(candidate: ReviewCandidate): ReviewSubmission {
  const type = candidate.predictedSignType;
  const cropUrl = resolveS3Url(candidate.signCropUrl);
  const frameUrl = resolveS3Url(candidate.bestFrameUrl);
  const imageSource = cropUrl ? { uri: cropUrl } : (frameUrl ? { uri: frameUrl } : undefined);
  const coord = extractCoordinateFromCandidate(candidate);
  const locationText =
    candidate.locationContext?.displayLocation ||
    candidate.locationContext?.nearbyRoad ||
    (typeof (candidate as any).location === 'string' ? (candidate as any).location : '');

  return {
    captured: formatCaptured(candidate.submission?.createdAt ?? candidate.createdAt),
    id: candidate.id,
    image: imageSource,
    location: locationText,
    predictedSignTypeId: type?.id,
    remedySigns: candidate.remedySigns,
    surveyorId: candidate.submission?.surveyorId ?? candidate.submissionId,
    title: type?.nameVi ? `${type.nameVi} (${type.signCode})` : (type?.nameEn || type?.signCode || 'Unidentified sign'),
    latitude: coord.latitude,
    longitude: coord.longitude,
    rawCandidate: candidate,
  };
}

export function selectReviewQueue(response: ReviewQueueResponse) {
  return {
    submissions: (response?.items || []).map(toSubmission),
    total: response?.total ?? (response?.items || []).length,
  };
}

export function selectReviewHistory(response: MyReviewHistoryResponse): ReviewHistoryItem[] {
  return (response?.items || []).map((record) => ({
    action: record.vote === 1 ? 'approved' : 'declined',
    submission: toSubmission(record.candidate),
  }));
}
