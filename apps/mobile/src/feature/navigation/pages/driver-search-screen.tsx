import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, Spacing } from '@/constants/theme';
import { previousDriverLocations } from '@/data/driverLocations';
import { useTheme } from '@/hooks/use-theme';

const filters = [
  { id: 'home', icon: 'H', label: 'Home' },
  { id: 'work', icon: 'W', label: 'Work' },
  { id: 'saved', icon: 'S', label: 'Saved' },
];

export function DriverSearchScreen() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          hitSlop={Spacing.one}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Text style={[styles.backIcon, { color: theme.tertiary }]}>{'<'}</Text>
        </Pressable>
        <Text style={[styles.searchPrompt, { color: theme.text }]}>Where to?</Text>
      </View>

      <View style={styles.filterRow}>
        {filters.map((filter) => (
          <Pressable
            accessibilityRole="button"
            key={filter.id}
            style={({ pressed }) => [
              styles.filterPill,
              {
                backgroundColor: theme.background,
                borderColor: theme.border,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Text style={[styles.filterIcon, { color: theme.tertiary }]}>{filter.icon}</Text>
            <Text style={[styles.filterText, { color: theme.text }]}>{filter.label}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      >
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>RECENT</Text>
        {previousDriverLocations.map((location) => (
          <Pressable
            accessibilityRole="button"
            key={location.id}
            style={({ pressed }) => [
              styles.locationRow,
              { borderColor: theme.border, opacity: pressed ? 0.72 : 1 },
            ]}
          >
            <View style={[styles.recentIconCircle, { backgroundColor: theme.background }]}>
              <Text style={[styles.recentIcon, { color: theme.textSecondary }]}>R</Text>
            </View>
            <View style={styles.locationCopy}>
              <Text style={[styles.locationTitle, { color: theme.text }]}>{location.title}</Text>
              <Text style={[styles.locationSubtitle, { color: theme.textSecondary }]}>
                {location.subtitle}
              </Text>
            </View>
            <Text style={[styles.arrowIcon, { color: theme.textSecondary }]}>/</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  backIcon: {
    fontFamily: Fonts.body,
    fontSize: 22,
    fontWeight: 700,
  },
  searchPrompt: {
    fontFamily: Fonts.body,
    fontSize: 15,
    fontWeight: 700,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.one,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  filterPill: {
    minHeight: 36,
    borderWidth: 1,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
  filterIcon: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 900,
  },
  filterText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 800,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  sectionLabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: 900,
    marginBottom: Spacing.one,
  },
  locationRow: {
    minHeight: 64,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  recentIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentIcon: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 900,
  },
  locationCopy: {
    flex: 1,
    minWidth: 0,
  },
  locationTitle: {
    fontFamily: Fonts.body,
    fontSize: 16,
    fontWeight: 900,
  },
  locationSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: 600,
  },
  arrowIcon: {
    fontFamily: Fonts.body,
    fontSize: 16,
    fontWeight: 700,
  },
});
