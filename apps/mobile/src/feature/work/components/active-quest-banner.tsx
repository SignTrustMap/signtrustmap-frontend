import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useMyBountyClaims } from '@/feature/work/hooks/use-bounty-board';

function formatCountdown(expiresAtStr: string, now: number = Date.now()): { text: string; isUrgent: boolean; isExpired: boolean } {
  const expiresAt = new Date(expiresAtStr).getTime();
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

export function ActiveQuestBanner() {
  const theme = useTheme();
  const router = useRouter();

  const { data: myClaims } = useMyBountyClaims();
  const activeClaim = myClaims?.find((c) => c.status === 'CLAIMED');

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!activeClaim) return;
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [activeClaim]);

  const countdown = useMemo(() => {
    if (!activeClaim?.expiresAt) return null;
    return formatCountdown(activeClaim.expiresAt, now);
  }, [activeClaim, now]);

  if (!activeClaim || !countdown) return null;

  const timerColor = countdown.isExpired
    ? theme.danger
    : countdown.isUrgent
      ? '#D97706'
      : theme.primary;

  const totalReward =
    activeClaim.totalRewardCredits ??
    activeClaim.baseRewardCredits + (activeClaim.escalatedBonusCredits || 0);
  const signLabel = [activeClaim.signCode, activeClaim.signName].filter(Boolean).join(' - ');
  const locationLabel = activeClaim.displayAddress?.trim() || activeClaim.roadName?.trim();

  const handlePress = () => {
    if (activeClaim.targetType === 'CANDIDATE_VALIDATION') {
      router.push({
        pathname: '/work/submission-review',
        params: {
          candidateId: activeClaim.targetId,
          questClaimId: activeClaim.id,
        },
      });
    } else {
      router.push({
        pathname: '/work/revalidation-review',
        params: {
          taskId: activeClaim.targetId,
          questClaimId: activeClaim.id,
        },
      });
    }
  };

  return (
    <Pressable
      accessibilityLabel="Nhiệm vụ đang thực hiện"
      onPress={handlePress}
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: countdown.isUrgent || countdown.isExpired ? timerColor : theme.border,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.badge}>
            <Text style={[styles.badgeText, { color: theme.textSecondary }]}>
              {activeClaim.targetType === 'CANDIDATE_VALIDATION'
                ? 'Nhiệm vụ: Biển báo mới'
                : 'Nhiệm vụ: Biển cần kiểm tra lại'}
            </Text>
          </View>
          <Text style={[styles.reward, { color: theme.primary }]}>
            +{totalReward} điểm
          </Text>
        </View>

        {signLabel ? (
          <Text numberOfLines={1} style={[styles.signTitle, { color: theme.text }]}>
            {signLabel}
          </Text>
        ) : null}

        {locationLabel ? (
          <Text numberOfLines={1} style={[styles.addressText, { color: theme.textSecondary }]}>
            {locationLabel}
          </Text>
        ) : null}

        <View style={styles.bottomRow}>
          <Text style={[styles.timerValue, { color: timerColor }]}>
            {countdown.isExpired ? countdown.text : `Còn lại ${countdown.text}`}
          </Text>

          <View style={styles.actionPrompt}>
            <Text style={[styles.actionPromptText, { color: theme.primary }]}>
              Đến vị trí
            </Text>
            <MaterialCommunityIcons color={theme.primary} name="chevron-right" size={18} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Rounded.lg,
    borderWidth: 1.5,
    padding: Spacing.three,
    marginBottom: Spacing.two,
  },
  content: {
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    paddingVertical: 2,
    borderRadius: Rounded.sm,
  },
  badgeText: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    fontWeight: '700',
  },
  reward: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: '700',
  },
  signTitle: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    fontWeight: '700',
  },
  addressText: {
    fontFamily: Fonts.sans,
    fontSize: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timerValue: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: '700',
  },
  actionPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionPromptText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: '700',
  },
});
