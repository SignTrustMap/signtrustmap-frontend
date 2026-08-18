import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type NavigationManeuverBannerProps = {
  distance: string;
  instruction: string;
  symbol: string;
};

export function NavigationManeuverBanner({
  distance,
  instruction,
  symbol,
}: NavigationManeuverBannerProps) {
  const theme = useTheme();

  return (
    <SafeAreaView edges={['top']} pointerEvents="none" style={styles.safeArea}>
      <View
        accessibilityLiveRegion="polite"
        accessibilityRole="summary"
        style={[styles.banner, { backgroundColor: theme.tertiary }]}
      >
        <View style={styles.symbolContainer}>
          <Text style={[styles.symbol, { color: theme.onTertiary }]}>{symbol}</Text>
        </View>
        <View style={styles.copy}>
          <Text style={[styles.distance, { color: theme.onTertiary }]}>{distance}</Text>
          <Text numberOfLines={2} style={[styles.instruction, { color: theme.onTertiary }]}>
            {instruction}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    zIndex: 30,
    paddingHorizontal: Spacing.four,
  },
  banner: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Rounded.lg,
    marginTop: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    shadowColor: '#09233C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 8,
  },
  symbolContainer: {
    width: 52,
    height: 52,
    borderRadius: Rounded.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  symbol: {
    fontFamily: Fonts.body,
    fontSize: 30,
    fontWeight: 900,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  distance: {
    fontFamily: Fonts.body,
    fontSize: 20,
    fontWeight: 900,
    lineHeight: 24,
  },
  instruction: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: 800,
    lineHeight: 19,
  },
});
