import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { CandidateCheckInResponse, ReviewerQuestClaim } from '@/types/bountyBoardType';

export interface ReviewGpsCheckInBarProps {
  checkIn: CandidateCheckInResponse | null;
  loading: boolean;
  claim?: ReviewerQuestClaim | null;
  onRefreshLocation: () => void;
  onNavigateToSign?: () => void;
}

function formatCountdown(expiresAtStr?: string, now: number = Date.now()): { text: string; isExpired: boolean } {
  if (!expiresAtStr) return { text: '', isExpired: false };
  const diff = new Date(expiresAtStr).getTime() - now;
  if (diff <= 0) return { text: 'Đã hết giờ', isExpired: true };

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    text: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
    isExpired: false,
  };
}

export function ReviewGpsCheckInBar({
  checkIn,
  loading,
  claim,
  onRefreshLocation,
  onNavigateToSign,
}: ReviewGpsCheckInBarProps) {
  const theme = useTheme();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!claim?.expiresAt) return;
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [claim?.expiresAt]);

  const countdown = useMemo(() => formatCountdown(claim?.expiresAt, now), [claim?.expiresAt, now]);

  if (loading && !checkIn) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        <ActivityIndicator color={theme.primary} size="small" />
        <Text style={[styles.text, { color: theme.placeholder }]}>
          Đang kiểm tra vị trí hiện tại...
        </Text>
      </View>
    );
  }

  // Claim expired state
  if (countdown.isExpired || claim?.status === 'EXPIRED') {
    return (
      <View style={[styles.container, styles.expiredContainer]}>
        <MaterialCommunityIcons color="#DC2626" name="alert-circle-outline" size={20} />
        <View style={styles.textWrap}>
          <Text style={styles.expiredTitle}>Nhiệm vụ đã hết hạn</Text>
          <Text style={styles.expiredSubtitle}>
            Bạn bị trừ 5 điểm uy tín do không hoàn thành đúng thời gian quy định.
          </Text>
        </View>
      </View>
    );
  }

  const isEligible = checkIn?.eligible ?? true;
  const distance = checkIn?.distanceMeters;
  const remaining = checkIn?.remainingDistanceMeters;

  return (
    <View
      style={[
        styles.container,
        isEligible ? styles.successContainer : styles.warningContainer,
      ]}
    >
      <MaterialCommunityIcons
        color={isEligible ? '#059669' : '#D97706'}
        name={isEligible ? 'check-circle-outline' : 'map-marker-alert-outline'}
        size={20}
      />

      <View style={styles.textWrap}>
        {isEligible ? (
          <>
            <Text style={styles.successTitle}>
              Vị trí hợp lệ để đánh giá
            </Text>
            {distance != null && (
              <Text style={styles.successSubtitle}>
                Bạn đang cách biển báo {Math.round(distance)} mét.
              </Text>
            )}
          </>
        ) : (
          <>
            <Text style={styles.warningTitle}>
              Chưa đủ điều kiện vị trí
            </Text>
            <Text style={styles.warningSubtitle}>
              {distance != null && remaining != null
                ? `Bạn đang cách biển báo ${Math.round(distance)} mét. Vui lòng di chuyển lại gần thêm ${Math.round(remaining)} mét để mở quyền đánh giá.`
                : 'Vui lòng di chuyển lại gần biển báo trong phạm vi 50 mét để đánh giá.'}
            </Text>
          </>
        )}

        {claim && countdown.text && (
          <View style={styles.timerLine}>
            <MaterialCommunityIcons color={theme.placeholder} name="clock-outline" size={14} />
            <Text style={[styles.timerText, { color: theme.placeholder }]}>
              Thời gian còn lại: {countdown.text}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.rightActions}>
        {!isEligible && onNavigateToSign && (
          <Pressable
            accessibilityLabel="Chỉ đường tới biển báo"
            onPress={onNavigateToSign}
            style={styles.actionBtn}
          >
            <Text style={styles.actionBtnText}>Chỉ đường</Text>
          </Pressable>
        )}
        <Pressable
          accessibilityLabel="Lấy lại vị trí"
          onPress={onRefreshLocation}
          style={styles.refreshBtn}
        >
          <MaterialCommunityIcons color={theme.placeholder} name="refresh" size={18} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: Rounded.md,
    borderWidth: 1,
    padding: Spacing.two,
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  successContainer: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  warningContainer: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  expiredContainer: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  text: {
    fontFamily: Fonts.sans,
    fontSize: 13,
  },
  successTitle: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
  },
  successSubtitle: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: '#047857',
  },
  warningTitle: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  warningSubtitle: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: '#B45309',
    lineHeight: 17,
  },
  expiredTitle: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: '700',
    color: '#991B1B',
  },
  expiredSubtitle: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: '#B91C1C',
    lineHeight: 17,
  },
  timerLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  timerText: {
    fontFamily: Fonts.sans,
    fontSize: 12,
  },
  rightActions: {
    alignItems: 'center',
    gap: 6,
    marginLeft: 4,
  },
  actionBtn: {
    backgroundColor: '#007B8B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Rounded.sm,
  },
  actionBtnText: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  refreshBtn: {
    padding: 2,
  },
});
