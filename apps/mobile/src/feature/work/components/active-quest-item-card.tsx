import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AppButton } from '@/components/button';
import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
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
  const isUrgent = diff < 15 * 60 * 1000; // less than 15 mins

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
        pathname: '/work/inspect-revalidate',
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
              {claim.targetType === 'CANDIDATE_VALIDATION' ? 'Biển báo mới' : 'Biển cần kiểm tra lại'}
            </Text>
          </View>
        </View>

        <View style={styles.rewardContainer}>
          <MaterialCommunityIcons color={theme.primary} name="star-circle" size={16} />
          <Text style={[styles.rewardText, { color: theme.primary }]}>
            +{claim.baseRewardCredits + (claim.escalatedBonusCredits || 0)} điểm
          </Text>
        </View>
      </View>

      <View style={styles.timerRow}>
        <MaterialCommunityIcons color={timerColor} name="clock-fast" size={18} />
        <Text style={[styles.timerLabel, { color: theme.placeholder }]}>
          Thời gian còn lại:
        </Text>
        <Text style={[styles.timerValue, { color: timerColor }]}>
          {countdown.text}
        </Text>
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
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  typeBadge: {
    paddingHorizontal: Spacing.one,
    paddingVertical: 2,
    borderRadius: Rounded.sm,
  },
  typeBadgeText: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    fontWeight: '600',
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: '700',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerLabel: {
    fontFamily: Fonts.sans,
    fontSize: 13,
  },
  timerValue: {
    fontFamily: Fonts.sans,
    fontSize: 15,
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
    minHeight: 38,
  },
  actionButton: {
    flex: 1.5,
    minHeight: 38,
  },
});
