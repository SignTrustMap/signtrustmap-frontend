import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { DriverBottomTabs } from '@/components/driver-bottom-tabs';
import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { DriverMapView } from '../components/driver-map-view';

export function DriverMapScreen() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={styles.map}>
        <DriverMapView />

        <SafeAreaView pointerEvents="box-none" style={styles.overlay}>
          <View style={styles.topControls}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/(driver)/search')}
              style={({ pressed }) => [
                styles.searchButton,
                { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.82 : 1 },
              ]}
            >
              <Text style={[styles.searchIcon, { color: theme.tertiary }]}>Q</Text>
              <Text style={[styles.searchText, { color: theme.text }]}>Where to?</Text>
              <Text style={[styles.profileIcon, { color: theme.text }]}>U</Text>
            </Pressable>

            <View style={[styles.creditPill, { backgroundColor: theme.backgroundElement }]}>
              <Text style={[styles.creditLabel, { color: theme.text }]}>Credit </Text>
              <Text style={[styles.creditValue, { color: theme.tertiary }]}>500</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <DriverBottomTabs activeRoute="/(driver)" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  map: {
    flex: 1,
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
  },
  topControls: {
    gap: Spacing.one,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
  },
  searchButton: {
    minHeight: 42,
    borderRadius: Rounded.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    shadowColor: '#09233C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  searchIcon: {
    fontFamily: Fonts.body,
    fontSize: 16,
    fontWeight: 900,
  },
  searchText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: 700,
  },
  profileIcon: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: 800,
  },
  creditPill: {
    alignSelf: 'flex-end',
    borderRadius: Rounded.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    shadowColor: '#09233C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 9,
    elevation: 3,
  },
  creditLabel: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: 800,
  },
  creditValue: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: 900,
  },
});
