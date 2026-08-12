import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/button';
import { Fonts, Spacing } from '@/constants/theme';
import { previousDriverLocations } from '@/data/driverLocations';
import { useTheme } from '@/hooks/use-theme';


export function DriverSearchScreen() {
  const router = useRouter();
  const theme = useTheme();

  const handleSelectLocation = (locationId: string) => {
    router.replace({
      pathname: '/(driver)',
      params: { destinationId: locationId },
    });
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.header}>
        <AppButton
          accessibilityLabel="Go back"
          hitSlop={Spacing.one}
          onPress={() => router.back()}
          pressedOpacity={0.7}
          style={styles.backButton}
          variant="ghost"
        >
          <Text style={[styles.backIcon, { color: theme.tertiary }]}>{'<'}</Text>
        </AppButton>
        <Text style={[styles.searchPrompt, { color: theme.text }]}>Where to?</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      >
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>RECENT</Text>
        {previousDriverLocations.map((location) => (
          <AppButton
            accessibilityLabel={location.title}
            key={location.id}
            onPress={() => handleSelectLocation(location.id)}
            pressedOpacity={0.72}
            style={[styles.locationRow, { borderColor: theme.border }]}
            variant="ghost"
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
          </AppButton>
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
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
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
    paddingVertical: 0,
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
    paddingHorizontal: 0,
    paddingVertical: 0,
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
