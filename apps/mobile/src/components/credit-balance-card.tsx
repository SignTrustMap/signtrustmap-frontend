import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useGetWallet } from '@/feature/credits/hooks/use-wallet';
import { useTheme } from '@/hooks/use-theme';

export interface CreditBalanceCardProps {
  balance?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function CreditBalanceCard({
  balance: propBalance,
  onPress,
  style,
  testID = 'credit-balance-card',
}: CreditBalanceCardProps) {
  const router = useRouter();
  const theme = useTheme();

  // Retrieve wallet balance if not directly passed via prop
  const { data: walletData } = useGetWallet(propBalance === undefined);
  const balance = propBalance ?? walletData?.wallet?.balance ?? 0;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/credits/history');
    }
  };

  return (
    <Pressable
      accessibilityHint="Chạm để xem chi tiết lịch sử biến động số dư credits"
      accessibilityLabel={`Số dư ví ${balance} credits. Xem lịch sử.`}
      accessibilityRole="button"
      onPress={handlePress}
      style={({ pressed }) => [
        styles.cardContainer,
        {
          backgroundColor: theme.primary,
        },
        pressed && styles.pressed,
        style,
      ]}
      testID={testID}
    >
      {/* Decorative background overlay */}
      <View style={styles.backgroundAccentCircle} />

      {/* Top Row: Title & Action Hint */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleGroup}>
          <MaterialCommunityIcons color="#FFFFFF" name="wallet-outline" size={18} />
          <Text style={styles.headerTitle}>Số dư Credits</Text>
        </View>

        <View style={styles.actionHint}>
          <Text style={styles.actionHintText}>Lịch sử</Text>
          <MaterialCommunityIcons color="#FFFFFF" name="chevron-right" size={16} />
        </View>
      </View>

      {/* Main Content: Large Prominent White Credit Number */}
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceNumber}>{balance.toLocaleString('vi-VN')}</Text>
        <Text style={styles.balanceCurrency}>Credits</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    height: 180,
    display: 'flex',
    justifyContent: 'space-between',
    borderRadius: Rounded.xlg,
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.four,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  backgroundAccentCircle: {
    position: 'absolute',
    right: -30,
    bottom: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFFFFF',
    opacity: 0.08,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  headerTitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.92,
  },
  actionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: Rounded.round,
    gap: 2,
  },
  actionHintText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.one,
  },
  balanceNumber: {
    fontFamily: Fonts.title,
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  balanceCurrency: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    opacity: 0.88,
  },
});
