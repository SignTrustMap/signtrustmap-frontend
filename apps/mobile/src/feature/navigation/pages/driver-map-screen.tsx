import { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { getRouteStopCoordinates } from '../utils/route-stop-markers';

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
  const [navigationSession, setNavigationSession] = useState<{
    routeKey: string;
    stopSignCoordinates: MapCoordinate[];
  }>();
  const [isStartingNavigation, setIsStartingNavigation] = useState(false);
  const [navigationError, setNavigationError] = useState<string>();
  const routeCoordinates =
    routeResult && routeResult.key === routeKey ? routeResult.coordinates : undefined;
  const isFptStudentHouseRoute =
    selectedStart?.id === 'dai-hoc-fpt'
    && selectedDestination?.id === 'nha-van-hoa-sinh-vien';
  const plannedStopSignCoordinates = useMemo(
    () => (isFptStudentHouseRoute ? getRouteStopCoordinates(routeCoordinates) : []),
    [isFptStudentHouseRoute, routeCoordinates],
  );
  const isNavigating = Boolean(routeKey && navigationSession?.routeKey === routeKey);
  const visibleStopSignCoordinates = isNavigating
    ? navigationSession?.stopSignCoordinates ?? []
    : plannedStopSignCoordinates;

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

  const handleBeginNavigation = async () => {
    if (Platform.OS === 'web' || !selectedDestination || !routeStart || !routeKey) return;

    if (isFptStudentHouseRoute && plannedStopSignCoordinates.length !== 5) {
      setNavigationError('The route is still loading. Try again in a moment.');
      return;
    }

    setIsStartingNavigation(true);
    setNavigationError(undefined);

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mapLibre = require('@maplibre/maplibre-react-native') as MapLibreModule;
      const hasPermission = await mapLibre.LocationManager.requestPermissions();

      if (!hasPermission) {
        setNavigationError('Location permission is required to start navigation.');
        return;
      }

      const currentPosition = await mapLibre.LocationManager.getCurrentPosition();

      if (!currentPosition) {
        setNavigationError('Your current location is not available. Try again outdoors.');
        return;
      }

      setNavigationSession({
        routeKey,
        stopSignCoordinates: plannedStopSignCoordinates,
      });
    } catch {
      setNavigationError('Navigation could not start on this device.');
    } finally {
      setIsStartingNavigation(false);
    }
  };

  const handleClearDestination = () => {
    router.replace('/(driver)');
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
          navigationActive={Platform.OS !== 'web' && isNavigating}
          routeCoordinates={routeCoordinates}
          routeStart={routeStart}
          routeStopCoordinates={visibleStopSignCoordinates}
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
                <View
                  style={[
                    styles.selectedDestinationInput,
                    { backgroundColor: theme.backgroundElement },
                  ]}
                >
                  <AppButton
                    accessibilityLabel="Clear destination"
                    hitSlop={Spacing.one}
                    onPress={handleClearDestination}
                    pressedOpacity={0.7}
                    style={styles.inlineBackButton}
                    variant="ghost"
                  >
                    <Text style={[styles.backIcon, { color: theme.text }]}>{'<'}</Text>
                  </AppButton>
                  <AppButton
                    accessibilityLabel="Change destination"
                    onPress={() => router.push('/(driver)/search')}
                    style={styles.destinationNameButton}
                    variant="ghost"
                  >
                    <Text
                      ellipsizeMode="tail"
                      numberOfLines={1}
                      style={[styles.destinationNameText, { color: theme.text }]}
                    >
                      {selectedDestination.title}
                    </Text>
                  </AppButton>
                </View>
              </>
            ) : selectedDestination ? (
              <View
                style={[
                  styles.selectedDestinationInput,
                  { backgroundColor: theme.backgroundElement },
                ]}
              >
                <AppButton
                  accessibilityLabel="Clear destination"
                  hitSlop={Spacing.one}
                  onPress={handleClearDestination}
                  pressedOpacity={0.7}
                  style={styles.inlineBackButton}
                  variant="ghost"
                >
                  <Text style={[styles.backIcon, { color: theme.text }]}>{'<'}</Text>
                </AppButton>
                <AppButton
                  accessibilityLabel="Change destination"
                  onPress={() => router.push('/(driver)/search')}
                  style={styles.destinationNameButton}
                  variant="ghost"
                >
                  <Text
                    ellipsizeMode="tail"
                    numberOfLines={1}
                    style={[styles.destinationNameText, { color: theme.text }]}
                  >
                    {selectedDestination.title}
                  </Text>
                </AppButton>
              </View>
            ) : (
              <AppButton
                accessibilityLabel="Search destination"
                onPress={() => router.push('/(driver)/search')}
                style={styles.searchButton}
                variant="surface"
              >
                <Text numberOfLines={1} style={[styles.searchText, { color: theme.text }]}>
                  Where to?
                </Text>
              </AppButton>
            )}
          </View>
        </SafeAreaView>
      </View>

      {selectedDestination ? (
        <SafeAreaView
          edges={['bottom']}
          style={[styles.destinationSheet, { backgroundColor: theme.backgroundElement }]}
        >
          <View style={styles.destinationSheetHandle} />
          <Text
            numberOfLines={1}
            style={[styles.destinationTitle, { color: theme.text }]}
          >
            {selectedDestination.title}
          </Text>
          {navigationError ? (
            <Text accessibilityRole="alert" style={styles.navigationError}>
              {navigationError}
            </Text>
          ) : null}
          <AppButton
            accessibilityLabel={
              isNavigating
                ? 'Navigation active'
                : routeStart
                  ? 'Begin navigation'
                  : 'Start route'
            }
            disabled={isNavigating || isStartingNavigation}
            label={isNavigating ? 'Navigating' : isStartingNavigation ? 'Starting...' : 'Go'}
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
  inlineBackButton: {
    width: 44,
    height: 44,
    minHeight: 44,
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
  selectedDestinationInput: {
    minHeight: 44,
    borderRadius: Rounded.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Spacing.three,
    shadowColor: '#09233C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
  },
  destinationNameButton: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    alignItems: 'flex-start',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  destinationNameText: {
    flexShrink: 1,
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: 700,
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
  searchText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: 700,
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
  navigationError: {
    color: '#B42318',
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 18,
    marginBottom: Spacing.two,
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
