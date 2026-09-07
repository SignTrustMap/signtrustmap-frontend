import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/button';
import { AppInput } from '@/components/ui/input';
import { AppToast } from '@/components/ui/toast';
import { Fonts, Spacing, Rounded } from '@/constants/theme';
import { useSession } from '@/context/session-provider';
import {
  startLocations,
  type MapCoordinate,
} from '@/feature/navigation/data/navigation-locations';
import {
  getUserPlaces,
  saveRecentPlace,
  searchPlaces,
  type ApiPlace,
} from '@/feature/navigation/services/places-api';
import { useTheme } from '@/hooks/use-theme';

import { areSameLocation } from '../utils/location';
import { SAME_LOCATION_MESSAGE } from '@/constants/message';


export function RouteSearchScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { session } = useSession();
  const { startId, startLat, startLng, startTitle } = useLocalSearchParams<{
    startId?: string;
    startLat?: string;
    startLng?: string;
    startTitle?: string;
  }>();

  const [toast, setToast] = useState<{ id: number; message: string }>();
  const [query, setQuery] = useState('');
  const [locations, setLocations] = useState<ApiPlace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const selectedStart = startLocations.find((location) => location.id === startId);
  const coordinateStart = useMemo(
    () => (startLng && startLat ? ([Number(startLng), Number(startLat)] as MapCoordinate) : undefined),
    [startLat, startLng],
  );
  const routeStart = coordinateStart ?? selectedStart?.coordinate;

  useEffect(() => {
    if (!session?.accessToken) return;
    if (query.trim().length >= 2) return;
    getUserPlaces(session.accessToken)
      .then((places) => {
        setLocations(places);
        setError(undefined);
      })
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : 'Unable to load saved destinations.');
      })
      .finally(() => setIsLoading(false));
  }, [query, session?.accessToken]);

  useEffect(() => {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 2) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      setIsLoading(true);
      searchPlaces(normalizedQuery, controller.signal)
        .then((places) => {
          setLocations(places);
          setError(undefined);
        })
        .catch((cause: unknown) => {
          if (cause instanceof Error && cause.name === 'AbortError') return;
          setError(cause instanceof Error ? cause.message : 'Unable to search for destinations.');
        })
        .finally(() => setIsLoading(false));
    }, 350);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  const handleSelectLocation = (destination: ApiPlace) => {
    if (destination.latitude == null || destination.longitude == null) return;
    const coordinate: MapCoordinate = [destination.longitude, destination.latitude];

    if (areSameLocation(coordinate, routeStart)) {
      setToast((currentToast) => ({
        id: (currentToast?.id ?? 0) + 1,
        message: SAME_LOCATION_MESSAGE,
      }));
      return;
    }

    if (session?.accessToken) saveRecentPlace(destination, session.accessToken).catch(() => undefined);
    router.replace({
      pathname: '/home',
      params: {
        destinationId: destination.id,
        destinationLat: String(destination.latitude),
        destinationLng: String(destination.longitude),
        destinationSubtitle: destination.address ?? '',
        destinationTitle: destination.title,
        ...(startId ? { startId } : {}),
        ...(startLat && startLng ? { startLat, startLng } : {}),
        ...(startTitle ? { startTitle } : {}),
      },
    });
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.header}>
        <View style={styles.searchInputWrapper}>
          <AppInput
            accessibilityLabel="Search for your destination"
            autoFocus
            onChangeText={setQuery}
            placeholder="Where to?"
            returnKeyType="search"
            style={[styles.searchPrompt, { color: theme.text }]}
            containerStyle={[
              styles.searchInputContainer,
              { backgroundColor: theme.background, borderColor: 'transparent' },
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
                  style={[styles.backIcon, { color: theme.text }]}
                />
              </AppButton>
            }
            value={query}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      >
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          {query.trim().length >= 2 ? 'SEARCH RESULTS' : 'SAVED & RECENT'}
        </Text>
        {isLoading ? <ActivityIndicator color={theme.primary} style={styles.loading} /> : null}
        {!isLoading && error ? (
          <Text accessibilityRole="alert" style={[styles.error, { color: theme.textSecondary }]}>{error}</Text>
        ) : null}
        {!isLoading && !error && locations.length === 0 ? (
          <Text style={[styles.error, { color: theme.textSecondary }]}>No destinations found.</Text>
        ) : null}
        {!isLoading && locations.map((location) => (
          <AppButton
            accessibilityLabel={location.title}
            key={location.id}
            onPress={() => handleSelectLocation(location)}
            pressedOpacity={0.72}
            style={[styles.locationRow, { borderColor: theme.border }]}
            variant="ghost"
          >
            <View style={[styles.recentIconCircle, { backgroundColor: theme.background }]}>
              <SymbolView
                name={{ android: 'history', ios: 'clock', web: 'history' }}
                size={17}
                tintColor={theme.text}
              />
            </View>
            <View style={styles.locationCopy}>
              <Text style={[styles.locationTitle, { color: theme.text }]}>{location.title}</Text>
              <Text style={[styles.locationSubtitle, { color: theme.textSecondary }]}>
                {location.address}
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
  searchInputWrapper: {
    flex: 1,
    minWidth: 0,
    marginTop: Spacing.one,
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
  loading: { paddingVertical: Spacing.four },
  error: {
    paddingVertical: Spacing.four,
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
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
