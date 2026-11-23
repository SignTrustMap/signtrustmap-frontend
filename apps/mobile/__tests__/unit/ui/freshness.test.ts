import {
  formatFreshnessScore,
  formatFreshness,
  getFreshnessLabel,
} from '@/utils/freshness';
import { REVALIDATION_STATUS_LABELS } from '@/constants/revalidation';

describe('freshness utilities', () => {
  it('handles RETIRED status immediately', () => {
    const res = formatFreshnessScore(100, 'RETIRED');
    expect(res.scorePercent).toBe(0);
    expect(res.range).toBe('0_19');
    expect(res.isStale).toBe(true);
    expect(res.label).toBe(REVALIDATION_STATUS_LABELS.NEEDS_REVALIDATION);
  });

  it('formats fractional 0..1 scores into 0..100 percentage', () => {
    const res = formatFreshnessScore(0.85);
    expect(res.scorePercent).toBe(85);
    expect(res.range).toBe('80_100');
    expect(res.isFresh).toBe(true);
    expect(res.color).toBe('#10B981');
  });

  it('formats scores across all tier thresholds', () => {
    // 80 - 100
    const fresh = formatFreshnessScore(90);
    expect(fresh.range).toBe('80_100');
    expect(fresh.label).toBe(REVALIDATION_STATUS_LABELS.FRESH);

    // 50 - 79
    const yellow = formatFreshnessScore(65);
    expect(yellow.range).toBe('50_79');
    expect(yellow.isAttentionYellow).toBe(true);
    expect(yellow.color).toBe('#EAB308');

    // 20 - 49
    const red = formatFreshnessScore(35);
    expect(red.range).toBe('20_49');
    expect(red.isAttentionRed).toBe(true);
    expect(red.color).toBe('#EF4444');

    // 0 - 19
    const stale = formatFreshnessScore(10);
    expect(stale.range).toBe('0_19');
    expect(stale.isStale).toBe(true);
    expect(stale.color).toBe('#6B7280');
  });

  it('handles clamps, strings, and missing values', () => {
    // String number
    expect(formatFreshnessScore('75').scorePercent).toBe(75);

    // Over 100 clamped
    expect(formatFreshnessScore(150).scorePercent).toBe(100);

    // Negative clamped
    expect(formatFreshnessScore(-20).scorePercent).toBe(0);

    // Missing / invalid fallback (55%)
    const fallback = formatFreshnessScore(null);
    expect(fallback.scorePercent).toBe(55);
    expect(fallback.isAttentionYellow).toBe(true);

    const emptyFallback = formatFreshnessScore('');
    expect(emptyFallback.scorePercent).toBe(55);

    // formatFreshness alias
    expect(formatFreshness(95).scorePercent).toBe(95);

    // getFreshnessLabel
    expect(getFreshnessLabel(95)).toBe(REVALIDATION_STATUS_LABELS.FRESH);
    expect(getFreshnessLabel(10, 'RETIRED')).toBe(REVALIDATION_STATUS_LABELS.NEEDS_REVALIDATION);
  });
});
