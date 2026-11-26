import type { QuestTargetType } from '@/types/bountyBoardType';

/**
 * Formats a distance in meters into a short, plain Vietnamese label without parentheses.
 */
export function formatQuestDistance(distanceMeters?: number | null): string | null {
  if (distanceMeters == null || !Number.isFinite(distanceMeters)) return null;
  if (distanceMeters >= 1000) {
    return `Cách ${(distanceMeters / 1000).toFixed(1)} km`;
  }
  return `Cách ${Math.round(distanceMeters)} m`;
}

/**
 * Resolves a human-readable location label from enriched quest fields or coordinates.
 */
export function formatQuestLocation(item: {
  displayAddress?: string | null;
  roadName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}): string {
  const address = item.displayAddress?.trim() || item.roadName?.trim();
  if (address) return address;
  if (item.latitude != null && item.longitude != null) {
    return `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}`;
  }
  return 'Chưa rõ địa điểm';
}

/**
 * Maps a quest target type to a simple Vietnamese label.
 */
export function getQuestTypeLabel(targetType: QuestTargetType): string {
  return targetType === 'CANDIDATE_VALIDATION' ? 'Biển báo mới' : 'Biển cần kiểm tra lại';
}
