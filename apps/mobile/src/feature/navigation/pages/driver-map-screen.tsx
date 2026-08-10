import { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { DriverBottomTabs } from '@/components/driver-bottom-tabs';
import { AppButton } from '@/components/ui/button';
import { Fonts, Rounded, Spacing } from '@/constants/theme';
import {
  driverStartLocations,
  previousDriverLocations,
  type MapCoordinate,
} from '@/data/driverLocations';
import { useTheme } from '@/hooks/use-theme';

import { DriverMapView } from '../components/driver-map-view';
import { getDrivingRoute } from '../services/osrm';

type MapLibreModule = typeof import('@maplibre/maplibre-react-native');

async function getNativeGpsStart(): Promise<MapCoordinate | null> {
  try {
    // Guarded require keeps Expo Go or stale native builds on the manual-start path.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mapLibre = require('@maplibre/maplibre-react-native') as MapLibreModule;
    const position = await mapLibre.LocationManager.getCurrentPosition();

    if (!position) return null;

    return [position.coords.longitude, position.coords.latitude];
  } catch {
    return null;
  }
}

export function DriverMapScreen() {
  const router = useRouter();
  const { destinationId, startId, startLat, startLng } = useLocalSearchParams<{
    destinationId?: string;
    startId?: string;
    startLat?: string;
    startLng?: string;
  }>();
  const theme = useTheme();
  const selectedDestination = previousDriverLocations.find((location) => location.id === destinationId);
  const selectedStart = driverStartLocations.find((location) => location.id === startId);
  const gpsStart = useMemo(
    () => (startLng && startLat ? ([Number(startLng), Number(startLat)] as MapCoordinate) : undefined),
    [startLat, startLng],
  );
  const routeStart = useMemo(() => gpsStart ?? selectedStart?.coordinate, [gpsStart, selectedStart]);
  const routeStartTitle = selectedStart?.title ?? (gpsStart ? 'Current Location' : undefined);
  const routeKey =
    selectedDestination && routeStart
      ? `${routeStart[0]},${routeStart[1]}:${selectedDestination.coordinate[0]},${selectedDestination.coordinate[1]}`
      : undefined;
  const [routeResult, setRouteResult] = useState<{
    coordinates: MapCoordinate[];
    key: string;
  }>();
  const routeCoordinates =
    routeResult && routeResult.key === routeKey ? routeResult.coordinates : undefined;

  useEffect(() => {
    if (!selectedDestination || !routeStart || !routeKey) return;

    const controller = new AbortController();

    getDrivingRoute(routeStart, selectedDestination.coordinate, controller.signal)
      .then((coordinates) => {
        setRouteResult({ coordinates, key: routeKey });
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === 'AbortError') return;
      });

    return () => {
      controller.abort();
    };
  }, [routeKey, routeStart, selectedDestination]);

  const handleBeginNavigation = () => {
    return;
  };

  const handleGo = async () => {
    if (!selectedDestination) return;

    if (Platform.OS !== 'web') {
      const nativeGpsStart = await getNativeGpsStart();

      if (nativeGpsStart) {
        router.replace({
          pathname: '/(driver)',
          params: {
            destinationId: selectedDestination.id,
            startLat: String(nativeGpsStart[1]),
            startLng: String(nativeGpsStart[0]),
          },
        });
        return;
      }
    }

    if (Platform.OS === 'web' && 'geolocation' in navigator && 'permissions' in navigator) {
      const permission = await navigator.permissions.query({ name: 'geolocation' });

      if (permission.state === 'granted') {
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => {
            router.replace({
              pathname: '/(driver)',
              params: {
                destinationId: selectedDestination.id,
                startLat: String(coords.latitude),
                startLng: String(coords.longitude),
              },
            });
          },
          () => {
            router.push({
              pathname: '/(driver)/start',
              params: { destinationId: selectedDestination.id },
            });
          },
        );
        return;
      }
    }

    router.push({
      pathname: '/(driver)/start',
      params: { destinationId: selectedDestination.id },
    });
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={styles.map}>
        <DriverMapView
          destination={selectedDestination}
          routeCoordinates={routeCoordinates}
          routeStart={routeStart}
        />

        <SafeAreaView pointerEvents="box-none" style={styles.overlay}>
          <View style={styles.topControls}>
            {selectedDestination && routeStart ? (
              <>
                <AppButton
                  accessibilityLabel="Change starting point"
                  onPress={() => router.push({
                    pathname: '/(driver)/start',
                    params: { destinationId: selectedDestination.id },
                  })}
                  style={styles.routeInput}
                  variant="surface"
                >
                  <Text style={[styles.routeInputBackIcon, { color: theme.text }]}>{'<'}</Text>
                  <Text style={[styles.routeInputIcon, { color: theme.tertiary }]}>G</Text>
                  <Text numberOfLines={1} style={[styles.routeInputText, { color: theme.text }]}>
                    {routeStartTitle}
                  </Text>
                </AppButton>
                <AppButton
                  accessibilityLabel="Change destination"
                  onPress={() => router.push('/(driver)/search')}
                  style={styles.routeInput}
                  variant="surface"
                >
                  <Text style={[styles.routeInputSearchIcon, { color: theme.text }]}>Q</Text>
                  <Text numberOfLines={1} style={[styles.routeInputText, { color: theme.text }]}>
                    {selectedDestination.title}
                  </Text>
                </AppButton>
              </>
            ) : (
              <AppButton
                accessibilityLabel="Search destination"
                onPress={() => router.push('/(driver)/search')}
                style={styles.searchButton}
                variant="surface"
              >
                <Text style={[styles.searchIcon, { color: theme.tertiary }]}>Q</Text>
                <Text numberOfLines={1} style={[styles.searchText, { color: theme.text }]}>
                  {selectedDestination?.title ?? 'Where to?'}
                </Text>
                <Text style={[styles.profileIcon, { color: theme.text }]}>U</Text>
              </AppButton>
            )}
          </View>
        </SafeAreaView>
      </View>

      <DriverBottomTabs activeRoute="/(driver)" />

      {selectedDestination ? (
        <SafeAreaView
          edges={['bottom']}
          style={[styles.destinationSheet, { backgroundColor: theme.backgroundElement }]}
        >
          <View style={styles.destinationSheetHandle} />
          <Text numberOfLines={1} style={[styles.destinationTitle, { color: theme.text }]}>
            {selectedDestination.title}
          </Text>
          <AppButton
            accessibilityLabel={routeStart ? 'Begin navigation' : 'Start route'}
            label="Go"
            onPress={routeStart ? handleBeginNavigation : handleGo}
            style={styles.goButton}
          />
        </SafeAreaView>
      ) : null}
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
  routeInput: {
    minHeight: 44,
    borderRadius: Rounded.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    shadowColor: '#09233C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
  },
  routeInputBackIcon: {
    fontFamily: Fonts.body,
    fontSize: 20,
    fontWeight: 700,
  },
  routeInputIcon: {
    fontFamily: Fonts.body,
    fontSize: 15,
    fontWeight: 900,
  },
  routeInputSearchIcon: {
    fontFamily: Fonts.body,
    fontSize: 15,
    fontWeight: 900,
    marginLeft: Spacing.three,
  },
  routeInputText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: 700,
  },
  destinationSheet: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    borderTopLeftRadius: Rounded.lg,
    borderTopRightRadius: Rounded.lg,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.one,
    paddingBottom: Spacing.two,
    shadowColor: '#09233C',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  destinationSheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    backgroundColor: '#D8DDE6',
    marginBottom: Spacing.two,
  },
  destinationTitle: {
    fontFamily: Fonts.body,
    fontSize: 16,
    fontWeight: 900,
    marginBottom: Spacing.three,
  },
  goButton: {
    alignSelf: 'stretch',
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
