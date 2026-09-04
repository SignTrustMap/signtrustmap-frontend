import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDebounce } from '@/hooks/use-debounce';
import AntDesign from '@expo/vector-icons/AntDesign';

import { AppButton } from '@/components/ui/button';
import { AppToast } from '@/components/ui/toast';
import { Fonts, Rounded, Spacing } from '@/constants/theme';
import {
  previousLocations,
  startLocations,
  type MapCoordinate,
} from '@/feature/navigation/data/navigation-locations';
import { useTheme } from '@/hooks/use-theme';

import { areSameLocation } from '../utils/location';
import { AppInput } from '@/components/ui/input';
import { SAME_LOCATION_MESSAGE } from '@/constants/message';


export function RouteSearchScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { startId, startLat, startLng } = useLocalSearchParams<{
    startId?: string;
    startLat?: string;
    startLng?: string;
  }>();

  const [searchText, setSearchText] = useState('');
  const debouncedSearchText = useDebounce(searchText, 500);
  const [searchResults, setSearchResults] = useState<typeof previousLocations>(previousLocations);

  const [toast, setToast] = useState<{ id: number; message: string }>();
  const selectedStart = startLocations.find((location) => location.id === startId);
  const coordinateStart = useMemo(
    () => (startLng && startLat ? ([Number(startLng), Number(startLat)] as MapCoordinate) : undefined),
    [startLat, startLng],
  );
  const routeStart = coordinateStart ?? selectedStart?.coordinate;

  const handleSelectLocation = (locationId: string) => {
    const destination = previousLocations.find((location) => location.id === locationId);

    if (areSameLocation(destination?.coordinate, routeStart)) {
      setToast((currentToast) => ({
        id: (currentToast?.id ?? 0) + 1,
        message: SAME_LOCATION_MESSAGE,
      }));
      return;
    }

    router.replace({
      pathname: '/home',
      params: {
        destinationId: locationId,
        ...(startId ? { startId } : {}),
        ...(startLat && startLng ? { startLat, startLng } : {}),
      },
    });
  };

  useEffect(() => {
    if (debouncedSearchText) {
      setTimeout(() => {
        const results = previousLocations.filter((location) =>
          location.title.toLowerCase().includes(debouncedSearchText.toLowerCase())
        );
        setSearchResults(results);
      }, 500);
    }

    return () => {
      setSearchResults(previousLocations);
    };
  }, [debouncedSearchText]);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.header}>
        <View style={{ flex: 1, minWidth: 0, marginTop: Spacing.one }}>
          <AppInput
            accessibilityLabel='Search for your destination'
            autoFocus
            placeholder="Where to?"
            style={[styles.searchPrompt, { color: theme.primary }]}
            containerStyle={[
              styles.searchInputContainer,
              {
                backgroundColor: theme.background,
                borderColor: 'transparent',
              },
            ]}
            leadingIcon={
              <AppButton
                accessibilityLabel="Go back"
                hitSlop={Spacing.one}
                onPress={() => router.back()}
                pressedOpacity={0.7}
                style={styles.backButton}
                variant="ghost"
              >
                <AntDesign
                  name="arrow-left"
                  style={[styles.backIcon, { color: theme.primary }]}
                />
              </AppButton>
            }
            callback={setSearchText}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      >
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>RECENT</Text>
        {searchResults.map((location) => (
          <AppButton
            accessibilityLabel={location.title}
            key={location.id}
            onPress={() => handleSelectLocation(location.id)}
            pressedOpacity={0.72}
            style={[styles.locationRow, { borderColor: theme.border }]}
            variant="ghost"
          >
            <View style={[styles.recentIconCircle, { backgroundColor: theme.background }]}>
              <SymbolView
                name={{ android: 'history', ios: 'clock', web: 'history' }}
                size={17}
                tintColor={theme.primary}
              />
            </View>
            <View style={styles.locationCopy}>
              <Text style={[styles.locationTitle, { color: theme.text }]}>{location.title}</Text>
              <Text style={[styles.locationSubtitle, { color: theme.grey }]}>
                {location.subtitle}
              </Text>
            </View>
          </AppButton>
        ))}
      </ScrollView>
      {toast ? (
        <AppToast
          key={toast.id}
          message={toast.message}
          onDismiss={() => setToast(undefined)}
        />
      ) : null}
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
    marginBottom: Spacing.four,
    marginTop: Spacing.three,
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
    fontSize: 18,
    fontWeight: 700,
  },
  searchPrompt: {
    fontFamily: Fonts.body,
    fontSize: 18,
    fontWeight: 600,
    paddingHorizontal: Spacing.one
  },
  searchInputContainer: {
    borderRadius: Rounded.round,
    shadowColor: '#09233C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
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
    gap: Spacing.three,
    paddingHorizontal: 0,
    paddingVertical: Spacing.three,
  },
  recentIconCircle: {
    padding: Spacing.one * 1.2,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationCopy: {
    flex: 1,
    minWidth: 0,
  },
  locationTitle: {
    fontFamily: Fonts.body,
    fontSize: 16,
    fontWeight: 600,
  },
  locationSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: 600,
    paddingTop: Spacing.half,
  },
});
