import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { RouteSign } from '@/api/navigation/navigation';

type NavigationSignAlertBannerProps = {
  sign: RouteSign;
  distanceMeters: number;
};

const defaultStopSignImage = require('@/assets/images/smaple_signs/stop_sign.webp');

export function NavigationSignAlertBanner({
  sign,
  distanceMeters,
  hasActiveManeuver = false,
}: NavigationSignAlertBannerProps & { hasActiveManeuver?: boolean }) {
  const theme = useTheme();
  const signTitle = sign.name || sign.signCode || 'Traffic Sign';

  return (
    <SafeAreaView
      edges={['top']}
      pointerEvents="none"
      style={[
        styles.safeArea,
        hasActiveManeuver ? styles.safeAreaWithManeuver : undefined,
      ]}
    >
      <View
        accessibilityLiveRegion="assertive"
        accessibilityRole="alert"
        style={[
          styles.container,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.danger,
          },
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: theme.backgroundSelected }]}>
          <Image
            contentFit="contain"
            source={sign.imageUrl ? { uri: sign.imageUrl } : defaultStopSignImage}
            style={styles.signImage}
          />
        </View>
        <View style={styles.copy}>
          <View style={styles.headerRow}>
            <Text style={[styles.tag, { color: theme.danger }]}>
              SIGN AHEAD • {distanceMeters}M
            </Text>
          </View>
          <Text numberOfLines={1} style={[styles.title, { color: theme.text }]}>
            {signTitle}
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
    zIndex: 35,
    paddingHorizontal: Spacing.four,
  },
  safeAreaWithManeuver: {
    top: 96,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Rounded.md,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    marginTop: Spacing.one,
    shadowColor: '#09233C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 6,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: Rounded.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  signImage: {
    width: 32,
    height: 32,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tag: {
    fontFamily: Fonts.body,
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: 800,
  },
});
