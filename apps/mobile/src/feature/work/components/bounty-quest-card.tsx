import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppButton } from '@/components/button';
import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { resolveS3Url } from '@/api/reviews/review-workflow';
import type { BountyQuestItem } from '@/types/bountyBoardType';

export interface BountyQuestCardProps {
  quest: BountyQuestItem;
  onClaim: (quest: BountyQuestItem) => void;
  isClaiming?: boolean;
}

export function BountyQuestCard({ quest, onClaim, isClaiming = false }: BountyQuestCardProps) {
  const theme = useTheme();

  const formattedDistance =
    quest.distanceMeters != null
      ? quest.distanceMeters >= 1000
        ? `${(quest.distanceMeters / 1000).toFixed(1)} km`
        : `${Math.round(quest.distanceMeters)} mét`
      : 'Chưa có vị trí';

  const imageUrl = resolveS3Url(quest.signCropUrl || quest.bestFrameUrl);
  const targetLabel =
    quest.targetType === 'CANDIDATE_VALIDATION' ? 'Biển báo mới' : 'Biển cần kiểm tra lại';

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
      <View style={styles.topRow}>
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image
              contentFit="contain"
              source={{ uri: imageUrl }}
              style={styles.signImage}
              transition={200}
            />
          ) : (
            <View
              style={[
                styles.imagePlaceholder,
                { backgroundColor: theme.backgroundElement },
              ]}
            >
              <MaterialCommunityIcons
                color={theme.placeholder}
                name="traffic-light"
                size={28}
              />
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: theme.backgroundElement },
              ]}
            >
              <Text style={[styles.typeBadgeText, { color: theme.textSecondary }]}>
                {targetLabel}
              </Text>
            </View>
            {quest.isPromoted && (
              <View style={[styles.bonusBadge, { backgroundColor: '#FEF3C7' }]}>
                <Text style={styles.bonusBadgeText}>Thưởng thêm</Text>
              </View>
            )}
          </View>

          <Text numberOfLines={1} style={[styles.signTitle, { color: theme.text }]}>
            {quest.signName || quest.signCode || 'Biển báo giao thông'}
          </Text>

          {quest.signCode && quest.signName ? (
            <Text style={[styles.signCode, { color: theme.placeholder }]}>
              {quest.signCode}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons
                color={theme.placeholder}
                name="map-marker-outline"
                size={14}
              />
              <Text style={[styles.metaText, { color: theme.placeholder }]}>
                {formattedDistance}
              </Text>
            </View>

            <View style={styles.metaItem}>
              <MaterialCommunityIcons
                color={theme.primary}
                name="star-circle"
                size={14}
              />
              <Text style={[styles.rewardText, { color: theme.primary }]}>
                +{quest.totalRewardCredits} điểm
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <View style={styles.bottomRow}>
        <View style={styles.timeLimitContainer}>
          <MaterialCommunityIcons
            color={theme.placeholder}
            name="clock-outline"
            size={16}
          />
          <Text style={[styles.timeLimitText, { color: theme.placeholder }]}>
            Thời gian: 120 phút
          </Text>
        </View>

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
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  imageContainer: {
    width: 64,
    height: 64,
    borderRadius: Rounded.md,
    overflow: 'hidden',
  },
  signImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.one,
    marginBottom: 4,
  },
  typeBadge: {
    paddingHorizontal: Spacing.one,
    paddingVertical: 2,
    borderRadius: Rounded.sm,
  },
  typeBadgeText: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '600',
  },
  bonusBadge: {
    paddingHorizontal: Spacing.one,
    paddingVertical: 2,
    borderRadius: Rounded.sm,
  },
  bonusBadgeText: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  signTitle: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    fontWeight: '700',
  },
  signCode: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    marginTop: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: Fonts.sans,
    fontSize: 12,
  },
  rewardText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: Spacing.two,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeLimitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeLimitText: {
    fontFamily: Fonts.sans,
    fontSize: 12,
  },
  claimButton: {
    minHeight: 36,
    paddingHorizontal: Spacing.three,
  },
});
