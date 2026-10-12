/**
 * Utility functions for formatting sign freshness scores into descriptive status ranges:
 * - 80 - 100: "Vừa được xác thực" (Xanh lá / Green: #10B981)
 * - 50 - 79:  "Cần chú ý" (Vàng / Yellow: #EAB308)
 * - 20 - 49:  "Cần chú ý" (Đỏ / Red: #EF4444)
 * - 0 - 19:   "Đã lâu chưa xác thực" (Xám / Slate: #6B7280)
 */

export type FreshnessRangeKey = '80_100' | '50_79' | '20_49' | '0_19';

export interface FormattedFreshness {
  scorePercent: number;
  label: string;
  color: string;
  range: FreshnessRangeKey;
  rangeLabel: string;
  badgeBg: string;
  badgeBorder: string;
  icon: string;
  isFresh: boolean;
  isAttentionYellow: boolean;
  isAttentionRed: boolean;
  isStale: boolean;
}

/**
 * Parses and formats a sign's freshness score into human-readable range status and color.
 *
 * @param freshnessScore Raw score from API (can be 0..1 fractional, 0..100 percentage, string, or undefined)
 * @param status Optional sign status (e.g. 'RETIRED')
 * @returns FormattedFreshness object containing label, color, range, and display properties
 */
export function formatFreshnessScore(
  freshnessScore?: number | string | null,
  status?: string,
): FormattedFreshness {
  if (status?.toUpperCase() === 'RETIRED') {
    return {
      scorePercent: 0,
      label: 'Đã lâu chưa xác thực',
      color: '#6B7280',
      range: '0_19',
      rangeLabel: '0 - 19',
      badgeBg: '#F3F4F6',
      badgeBorder: '#D1D5DB',
      icon: 'shield-alert-outline',
      isFresh: false,
      isAttentionYellow: false,
      isAttentionRed: false,
      isStale: true,
    };
  }

  const num =
    freshnessScore !== undefined && freshnessScore !== null && freshnessScore !== ''
      ? Number(freshnessScore)
      : undefined;
  const rawScore = num !== undefined && !Number.isNaN(num) ? num : undefined;

  // Convert 0..1 to 0..100 if value is in decimal notation
  const parsedPercent =
    rawScore !== undefined
      ? rawScore <= 1 && rawScore > 0
        ? Math.round(rawScore * 100)
        : Math.round(rawScore)
      : 55; // Default fallback if score is absent

  const clampedScore = Math.max(0, Math.min(100, parsedPercent));

  if (clampedScore >= 80) {
    return {
      scorePercent: clampedScore,
      label: 'Vừa được xác thực',
      color: '#10B981', // Xanh lá
      range: '80_100',
      rangeLabel: '80 - 100',
      badgeBg: '#ECFDF5',
      badgeBorder: '#6EE7B7',
      icon: 'check-circle-outline',
      isFresh: true,
      isAttentionYellow: false,
      isAttentionRed: false,
      isStale: false,
    };
  }

  if (clampedScore >= 50) {
    return {
      scorePercent: clampedScore,
      label: 'Cần chú ý',
      color: '#EAB308', // Màu vàng
      range: '50_79',
      rangeLabel: '50 - 79',
      badgeBg: '#FEFCE8',
      badgeBorder: '#FDE047',
      icon: 'alert-circle-outline',
      isFresh: false,
      isAttentionYellow: true,
      isAttentionRed: false,
      isStale: false,
    };
  }

  if (clampedScore >= 20) {
    return {
      scorePercent: clampedScore,
      label: 'Cần chú ý',
      color: '#EF4444', // Màu đỏ
      range: '20_49',
      rangeLabel: '20 - 49',
      badgeBg: '#FEF2F2',
      badgeBorder: '#FCA5A5',
      icon: 'alert-circle-outline',
      isFresh: false,
      isAttentionYellow: false,
      isAttentionRed: true,
      isStale: false,
    };
  }

  return {
    scorePercent: clampedScore,
    label: 'Đã lâu chưa xác thực',
    color: '#6B7280', // Xám / Muted
    range: '0_19',
    rangeLabel: '0 - 19',
    badgeBg: '#F3F4F6',
    badgeBorder: '#D1D5DB',
    icon: 'shield-alert-outline',
    isFresh: false,
    isAttentionYellow: false,
    isAttentionRed: false,
    isStale: true,
  };
}

/** Alias for formatFreshnessScore */
export const formatFreshness = formatFreshnessScore;

/**
 * Returns only the freshness text label for a given score.
 */
export function getFreshnessLabel(
  freshnessScore?: number | string | null,
  status?: string,
): string {
  return formatFreshnessScore(freshnessScore, status).label;
}
