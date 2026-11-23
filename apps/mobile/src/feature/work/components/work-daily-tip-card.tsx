import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Safely fallback to useEffect if useFocusEffect is undefined in test environments
const useSafeFocusEffect = typeof useFocusEffect === 'function' ? useFocusEffect : useEffect;

export const DAILY_TIPS: string[] = [
  'Mỗi biển báo được xác minh chính xác sẽ góp phần xây dựng bản đồ giao thông đáng tin cậy hơn.',
  'Chụp ảnh từ góc nhìn của bạn khi chạy xe sẽ giúp AI dễ nhận diện biển báo hơn.',
  'Độ tin cậy của biển báo giảm dần theo thời gian nếu không có minh chứng hoắc xác nhận mới.',
  'Thẩm định viên có thể chuyển đổi giữa ảnh thực địa và ảnh gốc để so sánh chi tiết trước khi bỏ phiếu.',
  'Hoàn thành nhiệm vụ hàng ngày giúp bạn tích lũy thêm Credits để sử dụng tính năng di chuyển trong ứng dụng.',
  'Điểm uy tín thấp sẽ ảnh hưởng đến Credits bạn nhận được từ hệ thống và ngược lại.',
  'Mỗi đóng góp nhỏ của bạn hôm nay là một bước tiến vì cộng đồng giao thông văn minh ngày mai.',
];

export interface WorkDailyTipCardProps {
  initialIndex?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function WorkDailyTipCard({
  initialIndex,
  style,
  testID = 'work-daily-tip-card',
}: WorkDailyTipCardProps) {
  const theme = useTheme();
  const isFirstMount = useRef(true);

  // Pick a random tip on initial screen mount
  const [currentIndex, setCurrentIndex] = useState(() =>
    initialIndex !== undefined
      ? initialIndex % DAILY_TIPS.length
      : Math.floor(Math.random() * DAILY_TIPS.length),
  );

  // Rotate tip when the screen gains focus on subsequent visits
  useSafeFocusEffect(
    useCallback(() => {
      if (isFirstMount.current) {
        isFirstMount.current = false;
        return;
      }
      if (initialIndex !== undefined) return;

      setCurrentIndex((prev) => {
        let next = Math.floor(Math.random() * DAILY_TIPS.length);
        if (next === prev && DAILY_TIPS.length > 1) {
          next = (prev + 1) % DAILY_TIPS.length;
        }
        return next;
      });
    }, [initialIndex]),
  );

  const currentTip = DAILY_TIPS[currentIndex] ?? DAILY_TIPS[0];

  return (
    <View
      accessibilityLabel={`Bạn có biết? ${currentTip}`}
      accessibilityRole="text"
      style={[
        styles.cardContainer,
        {
          borderColor: theme.border,
        },
        style,
      ]}
      testID={testID}
    >
      {/* Decorative Credit-Card Geometric Background Ornaments */}
      <View style={styles.backgroundAccentCircleLarge} />
      <View style={styles.backgroundAccentCircleSmall} />

      {/* Top Row: "Bạn có biết?" Pill Badge + Smart Card Chip Emblem */}
      <View style={styles.headerRow}>
        <View style={styles.tipBadge}>
          <MaterialCommunityIcons color="#087F89" name="lightbulb-on" size={14} />
          <Text style={styles.tipBadgeText}>BẠN CÓ BIẾT?</Text>
        </View>
      </View>

      {/* Middle: Tip Quote Content */}
      <View style={styles.bodyContainer}>
        <Text numberOfLines={3} style={styles.tipText}>
          {currentTip}
        </Text>
      </View>

      {/* Bottom Row: Card Branding / Watermark */}
      <View style={styles.footerRow}>
        <View style={styles.footerBrandGroup}>
          <Text style={styles.footerBrandText}>SIGNTRUSTMAP</Text>
        </View>
        <Text style={styles.footerCategoryText}>TIPS</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    minHeight: 146,
    borderRadius: Rounded.xlg,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.four,
    justifyContent: 'space-between',
    backgroundColor: '#E6F4F1',
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 4,
  },
  backgroundAccentCircleLarge: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#38BDF8',
    opacity: 0.07,
  },
  backgroundAccentCircleSmall: {
    position: 'absolute',
    right: 60,
    bottom: -50,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#818CF8',
    opacity: 0.06,
  },
  backgroundAccentGlow: {
    position: 'absolute',
    left: -30,
    bottom: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F59E0B',
    opacity: 0.05,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  tipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 3.5,
  },
  tipBadgeText: {
    fontFamily: Fonts.title,
    fontSize: 10.5,
    fontWeight: '800',
    color: '#087F89',
    letterSpacing: 0.8,
  },
  chipContainer: {
    width: 30,
    height: 22,
    borderRadius: 4,
    backgroundColor: 'rgba(217, 119, 6, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.45)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipInner: {
    width: '100%',
    height: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipLineHorizontal: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(245, 158, 11, 0.4)',
  },
  chipLineVertical: {
    position: 'absolute',
    height: '100%',
    width: 1,
    backgroundColor: 'rgba(245, 158, 11, 0.4)',
  },
  bodyContainer: {
    marginVertical: Spacing.one,
    marginBottom: Spacing.two,
  },
  tipText: {
    fontFamily: Fonts.body,
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  footerBrandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerBrandText: {
    fontFamily: Fonts.title,
    fontSize: 9.5,
    fontWeight: '700',
    color: '#087F89',
    letterSpacing: 1.2,
  },
  footerCategoryText: {
    fontFamily: Fonts.body,
    fontSize: 9.5,
    fontWeight: '600',
    color: '#087F89',
    letterSpacing: 0.8,
  },
});
