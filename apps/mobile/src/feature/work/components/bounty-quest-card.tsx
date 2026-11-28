import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { resolveS3Url } from '@/api/reviews/review-workflow';
import { AppButton } from '@/components/button';
import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  formatQuestDistance,
  formatQuestLocation,
  getQuestTypeLabel,
} from '@/feature/work/utils/quest-display';
import type { BountyQuestItem } from '@/types/bountyBoardType';

export interface BountyQuestCardProps {
  quest: BountyQuestItem;
  onClaim: (quest: BountyQuestItem) => void;
  isClaiming?: boolean;
}

export function BountyQuestCard({ quest, onClaim, isClaiming = false }: BountyQuestCardProps) {
  const theme = useTheme();

  const imageUrl = resolveS3Url(quest.signCropUrl || quest.bestFrameUrl);
  const typeLabel = getQuestTypeLabel(quest.targetType);
  const signTitle = quest.signName?.trim() || quest.signCode?.trim() || 'Biển báo giao thông';
  const locationText = formatQuestLocation(quest);
  const distanceText = formatQuestDistance(quest.distanceMeters) ?? 'Chưa rõ khoảng cách';

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
          {quest.signCode ? (
            <View
              style={[
                styles.codeBadge,
                { backgroundColor: theme.backgroundElement },
              ]}
            >
              <Text style={[styles.codeBadgeText, { color: theme.text }]}>
                {quest.signCode}
              </Text>
            </View>
          ) : null}
          {quest.isPromoted ? (
            <View style={[styles.bonusBadge, { backgroundColor: '#FEF3C7' }]}>
              <Text style={styles.bonusBadgeText}>Thưởng thêm</Text>
            </View>
          ) : null}
        </View>

        <Text style={[styles.rewardText, { color: theme.primary }]}>
          +{quest.totalRewardCredits} điểm
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

          <Text style={[styles.distanceText, { color: theme.placeholder }]}>
            {distanceText}
          </Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <View style={styles.bottomRow}>
        <Text style={[styles.timeLimitText, { color: theme.placeholder }]}>
          Thời gian làm 120 phút
        </Text>

        <AppButton
          accessibilityLabel="Nhận nhiệm vụ"
          disabled={isClaiming}
          label={isClaiming ? 'Đang nhận...' : 'Nhận nhiệm vụ'}
          onPress={() => onClaim(quest)}
          style={styles.claimButton}
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
  bonusBadge: {
    paddingHorizontal: Spacing.one,
    paddingVertical: 3,
    borderRadius: Rounded.sm,
  },
  bonusBadgeText: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
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
  distanceText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  divider: {
    height: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  timeLimitText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
  },
  claimButton: {
    minHeight: 40,
    paddingHorizontal: Spacing.three,
  },
});
