import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { resolveS3Url } from '@/api/reviews/review-workflow';
import { AppButton } from '@/components/button';
import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  formatQuestDistance,
  formatQuestLocation,
  getQuestTypeLabel,
} from '@/feature/work/utils/quest-display';
import type { ReviewerQuestClaim } from '@/types/bountyBoardType';

export interface ActiveQuestItemCardProps {
  claim: ReviewerQuestClaim;
  onAbandon: (claim: ReviewerQuestClaim) => void;
  isAbandoning?: boolean;
}

function formatCountdown(expiresAtStr: string): { text: string; isUrgent: boolean; isExpired: boolean } {
  const expiresAt = new Date(expiresAtStr).getTime();
  const now = Date.now();
  const diff = expiresAt - now;

  if (diff <= 0) {
    return { text: 'Đã hết giờ', isUrgent: true, isExpired: true };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  const pad = (n: number) => String(n).padStart(2, '0');
  const text = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  const isUrgent = diff < 15 * 60 * 1000;

  return { text, isUrgent, isExpired: false };
}

export function ActiveQuestItemCard({ claim, onAbandon, isAbandoning = false }: ActiveQuestItemCardProps) {
  const theme = useTheme();
  const router = useRouter();
  const [countdown, setCountdown] = useState(() => formatCountdown(claim.expiresAt));

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(formatCountdown(claim.expiresAt));
    }, 1000);
    return () => clearInterval(timer);
  }, [claim.expiresAt]);

  const handleNavigateToReview = () => {
    if (claim.targetType === 'CANDIDATE_VALIDATION') {
      router.push({
        pathname: '/work/submission-review',
        params: {
          candidateId: claim.targetId,
          questClaimId: claim.id,
        },
      });
    } else {
      router.push({
        pathname: '/work/revalidation-review',
        params: {
          taskId: claim.targetId,
          questClaimId: claim.id,
        },
      });
    }
  };

  const timerColor = countdown.isExpired
    ? theme.danger
    : countdown.isUrgent
      ? '#D97706'
      : theme.primary;

  const totalReward =
    claim.totalRewardCredits ?? claim.baseRewardCredits + (claim.escalatedBonusCredits || 0);
  const imageUrl = resolveS3Url(claim.signCropUrl || claim.bestFrameUrl);
  const signTitle = claim.signName?.trim() || claim.signCode?.trim() || 'Biển báo giao thông';
  const typeLabel = getQuestTypeLabel(claim.targetType);
  const locationText = formatQuestLocation(claim);
  const distanceText = formatQuestDistance(claim.distanceMeters);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.badgeRow}>
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: theme.backgroundElement },
            ]}
          >
            <Text style={[styles.typeBadgeText, { color: theme.textSecondary }]}>
              {typeLabel}
            </Text>
          </View>
          {claim.signCode ? (
            <View
              style={[
                styles.codeBadge,
                { backgroundColor: theme.backgroundElement },
              ]}
            >
              <Text style={[styles.codeBadgeText, { color: theme.text }]}>
                {claim.signCode}
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={[styles.rewardText, { color: theme.primary }]}>
          +{totalReward} điểm
        </Text>
      </View>

      <View style={styles.bodyRow}>
        <View style={[styles.imageContainer, { backgroundColor: theme.backgroundElement }]}>
          {imageUrl ? (
            <Image
              contentFit="cover"
              source={{ uri: imageUrl }}
              style={styles.signImage}
              transition={200}
            />
          ) : (
            <Text numberOfLines={2} style={[styles.imageFallbackText, { color: theme.placeholder }]}>
              Chưa có ảnh
            </Text>
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text numberOfLines={2} style={[styles.signTitle, { color: theme.text }]}>
            {signTitle}
          </Text>

          <Text numberOfLines={2} style={[styles.addressText, { color: theme.textSecondary }]}>
            {locationText}
          </Text>

          <View style={styles.metaRow}>
            {distanceText ? (
              <>
                <Text style={[styles.distanceText, { color: theme.placeholder }]}>
                  {distanceText}
                </Text>
                <Text style={[styles.dotSeparator, { color: theme.placeholder }]}>•</Text>
              </>
            ) : null}
            <Text style={[styles.timerValue, { color: timerColor }]}>
              {countdown.isExpired ? countdown.text : `Còn ${countdown.text}`}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <View style={styles.actionsRow}>
        <AppButton
          disabled={isAbandoning}
          label="Hủy nhiệm vụ"
          onPress={() => onAbandon(claim)}
          style={styles.abandonButton}
          variant="surface"
        />
        <AppButton
          accessibilityLabel="Đến vị trí xác thực"
          disabled={countdown.isExpired}
          label={countdown.isExpired ? 'Đã quá hạn' : 'Đến vị trí xác thực'}
          onPress={handleNavigateToReview}
          style={styles.actionButton}
          variant="primary"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Rounded.lg,
    borderWidth: 1,
    padding: Spacing.three,
    marginBottom: Spacing.two,
    gap: Spacing.two,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.one,
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: Spacing.one,
    paddingVertical: 3,
    borderRadius: Rounded.sm,
  },
  typeBadgeText: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    fontWeight: '600',
  },
  codeBadge: {
    paddingHorizontal: Spacing.one,
    paddingVertical: 3,
    borderRadius: Rounded.sm,
  },
  codeBadgeText: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    fontWeight: '700',
  },
  rewardText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    fontWeight: '700',
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  imageContainer: {
    width: 68,
    height: 68,
    borderRadius: Rounded.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signImage: {
    width: '100%',
    height: '100%',
  },
  imageFallbackText: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 6,
  },
  infoContainer: {
    flex: 1,
    gap: 4,
  },
  signTitle: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  addressText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  distanceText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: '500',
  },
  dotSeparator: {
    fontFamily: Fonts.sans,
    fontSize: 13,
  },
  timerValue: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: '700',
  },
  divider: {
    height: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  abandonButton: {
    flex: 1,
    minHeight: 40,
  },
  actionButton: {
    flex: 1.5,
    minHeight: 40,
  },
});
