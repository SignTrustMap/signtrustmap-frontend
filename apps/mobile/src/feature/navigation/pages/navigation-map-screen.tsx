import { useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { AppButton } from '@/components/ui/button';
import { AppToast } from '@/components/ui/toast';
import { NavigationManeuverBanner } from '@/components/navigation-maneuver-banner';
import { Fonts, Rounded, Spacing } from '@/constants/theme';
import {
  previousLocations,
  startLocations,
  type MapCoordinate,
} from '@/feature/navigation/data/navigation-locations';
import { useTheme } from '@/hooks/use-theme';

import { NavigationMapView } from '../components/navigation-map-view';
import { getDrivingRoute, type OsrmRouteStep } from '../services/osrm';
import { getRouteProgressMeters } from '../utils/route-progress';
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

export function NavigationMapScreen() {
  const router = useRouter();
  const { destinationId, startId, startLat, startLng } = useLocalSearchParams<{
    destinationId?: string;
    startId?: string;
    startLat?: string;
    startLng?: string;
  }>();
  const theme = useTheme();
  const selectedDestination = previousLocations.find((location) => location.id === destinationId);
  const selectedStart = startLocations.find((location) => location.id === startId);
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
    distance: number;
    duration: number;
    key: string;
    steps: OsrmRouteStep[];
  }>();
  const [navigationSession, setNavigationSession] = useState<{
    hasLiveLocation: boolean;
    routeKey: string;
    stopSignCoordinates: MapCoordinate[];
  }>();
  const [isStartingNavigation, setIsStartingNavigation] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationToast, setLocationToast] = useState<{ id: number; message: string }>();
  const [mapFocus, setMapFocus] = useState<{ coordinate: MapCoordinate; requestId: number }>();
  const [navigationError, setNavigationError] = useState<string>();
  const [userCoordinate, setUserCoordinate] = useState<MapCoordinate>();
  const routeCoordinates =
    routeResult && routeResult.key === routeKey ? routeResult.coordinates : undefined;
  const routeDistance = routeResult && routeResult.key === routeKey ? routeResult.distance : undefined;
  const routeDuration = routeResult && routeResult.key === routeKey ? routeResult.duration : undefined;
  const routeSteps = routeResult && routeResult.key === routeKey ? routeResult.steps : undefined;
  const plannedStopSignCoordinates = useMemo(
    () => getRouteStopCoordinates(routeCoordinates),
    [routeCoordinates],
  );
  const isNavigating = Boolean(routeKey && navigationSession?.routeKey === routeKey);
  const hasLiveLocation = Boolean(isNavigating && navigationSession?.hasLiveLocation);
  const visibleStopSignCoordinates = isNavigating
    ? navigationSession?.stopSignCoordinates ?? []
    : plannedStopSignCoordinates;
  const maneuverProgresses = useMemo(
    () => routeSteps?.map((step) =>
      step.maneuver.location && routeCoordinates
        ? getRouteProgressMeters(step.maneuver.location, routeCoordinates)
        : undefined),
    [routeCoordinates, routeSteps],
  );
  const activeManeuver = useMemo(() => {
    const navigationCoordinate = userCoordinate ?? routeStart;

    if (
      !isNavigating ||
      !navigationCoordinate ||
      !routeCoordinates ||
      !routeSteps?.length ||
      !maneuverProgresses
    ) {
      return undefined;
    }

    const currentProgress = getRouteProgressMeters(navigationCoordinate, routeCoordinates);
    let stepIndex = routeSteps.findIndex((step, index) => {
      const maneuverProgress = maneuverProgresses[index];

      return (
        step.maneuver.type !== 'depart' &&
        maneuverProgress !== undefined &&
        maneuverProgress >= currentProgress + 10
      );
    });

    if (stepIndex < 0) stepIndex = routeSteps.length - 1;

    return {
      distance: Math.max(0, (maneuverProgresses[stepIndex] ?? currentProgress) - currentProgress),
      step: routeSteps[stepIndex],
    };
  }, [isNavigating, maneuverProgresses, routeCoordinates, routeStart, routeSteps, userCoordinate]);

  useEffect(() => {
    if (!selectedDestination || !routeStart || !routeKey) return;

    const controller = new AbortController();

    getDrivingRoute(routeStart, selectedDestination.coordinate, controller.signal)
      .then(({ coordinates, distance, duration, steps }) => {
        setRouteResult({ coordinates, distance, duration, key: routeKey, steps });
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === 'AbortError') return;
      });

    return () => {
      controller.abort();
    };
  }, [routeKey, routeStart, selectedDestination]);

  useEffect(() => {
    if (Platform.OS === 'web' || !hasLiveLocation) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mapLibre = require('@maplibre/maplibre-react-native') as MapLibreModule;
      const handleLocationUpdate = (position: {
        coords: { latitude: number; longitude: number };
      }) => {
        setUserCoordinate([position.coords.longitude, position.coords.latitude]);
      };

      mapLibre.LocationManager.setMinDisplacement(3);
      mapLibre.LocationManager.addListener(handleLocationUpdate);

      return () => {
        mapLibre.LocationManager.removeListener(handleLocationUpdate);
      };
    } catch {
      return;
    }
  }, [hasLiveLocation]);

  const handleBeginNavigation = async () => {
    if (Platform.OS === 'web' || !selectedDestination || !routeStart || !routeKey) return;

    if (plannedStopSignCoordinates.length !== 5) {
      setNavigationError('The route is still loading. Try again in a moment.');
      return;
    }

    setIsStartingNavigation(true);
    setNavigationError(undefined);

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mapLibre = require('@maplibre/maplibre-react-native') as MapLibreModule;
      const currentPosition = await mapLibre.LocationManager.getCurrentPosition();

      setUserCoordinate(
        currentPosition
          ? [currentPosition.coords.longitude, currentPosition.coords.latitude]
          : routeStart,
      );

      setNavigationSession({
        hasLiveLocation: Boolean(currentPosition),
        routeKey,
        stopSignCoordinates: plannedStopSignCoordinates,
      });
    } catch {
      setUserCoordinate(routeStart);
      setNavigationSession({
        hasLiveLocation: false,
        routeKey,
        stopSignCoordinates: plannedStopSignCoordinates,
      });
    } finally {
      setIsStartingNavigation(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    if (isLocating) return;

    setIsLocating(true);

    try {
      let coordinate: MapCoordinate;


      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mapLibre = require('@maplibre/maplibre-react-native') as MapLibreModule;
      const hasPermission = await mapLibre.LocationManager.requestPermissions();

      if (!hasPermission) {
        throw new Error('Allow location access to use your current position.');
      }

      const position = await mapLibre.LocationManager.getCurrentPosition();

      if (!position) {
        throw new Error('Turn on GPS and try again.');
      }

      coordinate = [position.coords.longitude, position.coords.latitude];


      setMapFocus((current) => ({
        coordinate,
        requestId: (current?.requestId ?? 0) + 1,
      }));
    } catch (error) {
      setLocationToast((current) => ({
        id: (current?.id ?? 0) + 1,
        message: error instanceof Error ? error.message : 'Unable to get your current location.',
      }));
    } finally {
      setIsLocating(false);
    }
  };

  const handleBackToDriverHome = () => {
    router.replace('/home');
  };

  const handleBackToDestinationInput = () => {
    router.replace({
      pathname: '/home/search',
      params: {
        ...(startId ? { startId } : {}),
        ...(startLat && startLng ? { startLat, startLng } : {}),
      },
    });
  };

  const handleChangeDestination = () => {
    router.push({
      pathname: '/home/search',
      params: {
        ...(startId ? { startId } : {}),
        ...(startLat && startLng ? { startLat, startLng } : {}),
      },
    });
  };

  const handleGo = async () => {
    if (!selectedDestination) return;

    if (Platform.OS !== 'web') {
      const nativeGpsStart = await getNativeGpsStart();

      if (nativeGpsStart) {
        router.replace({
          pathname: '/home',
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
              pathname: '/home',
              params: {
                destinationId: selectedDestination.id,
                startLat: String(coords.latitude),
                startLng: String(coords.longitude),
              },
            });
          },
          () => {
            router.push({
              pathname: '/home/start',
              params: { destinationId: selectedDestination.id },
            });
          },
        );
        return;
      }
    }

    router.push({
      pathname: '/home/start',
      params: { destinationId: selectedDestination.id },
    });
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={styles.map}>
        <NavigationMapView
          destination={selectedDestination}
          focusCoordinate={selectedDestination ? undefined : mapFocus?.coordinate}
          focusRequestId={mapFocus?.requestId}
          navigationActive={
            Platform.OS !== 'web' &&
            isNavigating &&
            Boolean(navigationSession?.hasLiveLocation)
          }
          routeCoordinates={routeCoordinates}
          routeStart={routeStart}
          routeStopCoordinates={visibleStopSignCoordinates}
          showCurrentLocation={!isNavigating}
        />

        {isNavigating && activeManeuver ? (
          <NavigationManeuverBanner
            distance={formatManeuverDistance(activeManeuver.distance)}
            instruction={formatRouteInstruction(activeManeuver.step)}
            symbol={getManeuverSymbol(activeManeuver.step)}
          />
        ) : null}

        {!isNavigating ? (
          <SafeAreaView pointerEvents="box-none" style={styles.overlay}>
            <View style={styles.topControls}>
              {selectedDestination && routeStart ? (
                <>
                  <View
                    style={[
                      styles.routeInput,
                      { backgroundColor: theme.backgroundElement },
                    ]}
                  >
                    <AppButton
                      accessibilityLabel="Back to driver home"
                      hitSlop={Spacing.one}
                      onPress={handleBackToDriverHome}
                      pressedOpacity={0.7}
                      style={styles.routeInputBackButton}
                      variant="ghost"
                    >
                      <Text style={[styles.routeInputBackIcon, { color: theme.text }]}>{'<'}</Text>
                    </AppButton>
                    <AppButton
                      accessibilityLabel="Change starting point"
                      onPress={() => router.push({
                        pathname: '/home/start',
                        params: { destinationId: selectedDestination.id },
                      })}
                      style={styles.routeInputContentButton}
                      variant="ghost"
                    >
                      <Text style={[styles.routeInputIcon, { color: theme.tertiary }]}>G</Text>
                      <Text numberOfLines={1} style={[styles.routeInputText, { color: theme.text }]}>
                        {routeStartTitle}
                      </Text>
                    </AppButton>
                  </View>
                  <View
                    style={[
                      styles.selectedDestinationInput,
                      { backgroundColor: theme.backgroundElement },
                    ]}
                  >
                    <AppButton
                      accessibilityLabel="Back to destination input"
                      hitSlop={Spacing.one}
                      onPress={handleBackToDestinationInput}
                      pressedOpacity={0.7}
                      style={styles.inlineBackButton}
                      variant="ghost"
                    >
                      <Text style={[styles.backIcon, { color: theme.text }]}>{'<'}</Text>
                    </AppButton>
                    <AppButton
                      accessibilityLabel="Change destination"
                      onPress={handleChangeDestination}
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
                    accessibilityLabel="Back to destination input"
                    hitSlop={Spacing.one}
                    onPress={handleBackToDestinationInput}
                    pressedOpacity={0.7}
                    style={styles.inlineBackButton}
                    variant="ghost"
                  >
                    <Text style={[styles.backIcon, { color: theme.text }]}>{'<'}</Text>
                  </AppButton>
                  <AppButton
                    accessibilityLabel="Change destination"
                    onPress={handleChangeDestination}
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
                  onPress={() => router.push('/home/search')}
                  style={styles.searchButton}
                  variant="surface"
                >
                  <Text numberOfLines={1} style={[styles.searchText, { color: theme.text }]}>
                    Search here...
                  </Text>
                </AppButton>
              )}
            </View>
            {!selectedDestination ? (
              <View style={styles.mapActions}>
                <AppButton
                  accessibilityLabel={isLocating ? 'Getting current location' : 'Use current location'}
                  disabled={isLocating}
                  onPress={handleUseCurrentLocation}
                  style={[
                    styles.mapActionButton,
                    styles.locationActionButton,
                    { backgroundColor: theme.backgroundElement, borderColor: theme.tertiary },
                  ]}
                  variant="surface"
                >
                  <SymbolView
                    name={{ android: 'my_location', ios: 'location.fill', web: 'my_location' }}
                    size={22}
                    tintColor={theme.tertiary}
                  />
                </AppButton>
                <AppButton
                  accessibilityLabel="Search destination"
                  onPress={() => router.push('/home/search')}
                  style={styles.mapActionButton}
                >
                  <SymbolView
                    name={{ android: 'search', ios: 'magnifyingglass', web: 'search' }}
                    size={22}
                    tintColor={theme.onTertiary}
                  />
                </AppButton>
              </View>
            ) : null}
          </SafeAreaView>
        ) : null}
      </View>

      {selectedDestination ? (
        <View
          style={[
            styles.destinationSheet,
            routeStart ? styles.routeDestinationSheet : undefined,
            { backgroundColor: theme.backgroundElement },
          ]}
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
          {routeStart ? (
            <View style={styles.directionsSection}>
              {routeDuration !== undefined && routeDistance !== undefined ? (
                <Text style={[styles.routeSummary, { color: theme.text }]}>
                  ETA {formatRouteDuration(routeDuration)} (
                  {formatRouteDistanceInKilometers(routeDistance)})
                </Text>
              ) : (
                <Text style={[styles.routeSummary, { color: theme.textSecondary }]}>
                  Calculating ETA...
                </Text>
              )}
              <Text style={[styles.directionsHeading, { color: theme.text }]}>Sections:</Text>
              {routeSteps ? (
                routeSteps.length > 0 ? (
                  <ScrollView
                    contentContainerStyle={styles.directionsList}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator
                    style={styles.directionsScroll}
                  >
                    {routeSteps.map((step, index) => (
                      <View
                        key={`${index}-${step.maneuver.type}-${step.name}`}
                        style={styles.directionRow}
                      >
                        <Text style={[styles.directionNumber, { color: theme.tertiary }]}>
                          {index + 1}
                        </Text>
                        <View style={styles.directionCopy}>
                          <Text style={[styles.directionInstruction, { color: theme.text }]}>
                            {formatRouteInstruction(step)}
                          </Text>
                          <Text style={[styles.directionDistance, { color: theme.textSecondary }]}>
                            {formatRouteDistance(step.distance)}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  <Text style={[styles.directionsStatus, { color: theme.textSecondary }]}>
                    No turn-by-turn directions are available for this route.
                  </Text>
                )
              ) : (
                <Text style={[styles.directionsStatus, { color: theme.textSecondary }]}>
                  Loading directions...
                </Text>
              )}
            </View>
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
            label={isNavigating ? 'Navigating...' : isStartingNavigation ? 'Starting...' : 'Go'}
            onPress={routeStart ? handleBeginNavigation : handleGo}
            style={styles.goButton}
          />
        </View>
      ) : null}
      {locationToast ? (
        <AppToast
          key={locationToast.id}
          message={locationToast.message}
          onDismiss={() => setLocationToast(undefined)}
        />
      ) : null}
    </View>
  );
}

function formatRouteInstruction(step: OsrmRouteStep) {
  const roadName = step.name || 'the road';
  const modifier = step.maneuver.modifier?.replaceAll('_', ' ');

  switch (step.maneuver.type) {
    case 'depart':
      return `Start on ${roadName}`;
    case 'arrive':
      return 'Arrive at your destination';
    case 'turn':
      return `Turn ${modifier ?? ''} onto ${roadName}`.replace('  ', ' ');
    case 'continue':
      return `Continue${modifier ? ` ${modifier}` : ''} on ${roadName}`;
    case 'new name':
      return `Continue onto ${roadName}`;
    case 'merge':
      return `Merge${modifier ? ` ${modifier}` : ''} onto ${roadName}`;
    case 'on ramp':
      return `Take the ramp${modifier ? ` ${modifier}` : ''} onto ${roadName}`;
    case 'off ramp':
      return `Take the exit${modifier ? ` ${modifier}` : ''} onto ${roadName}`;
    case 'roundabout':
    case 'rotary':
      return `Enter the roundabout toward ${roadName}`;
    default:
      return `${step.maneuver.type.replaceAll('_', ' ')} on ${roadName}`;
  }
}

function getManeuverSymbol(step: OsrmRouteStep) {
  if (step.maneuver.type === 'arrive') return '●';
  if (step.maneuver.type === 'roundabout' || step.maneuver.type === 'rotary') return '↻';

  const modifier = step.maneuver.modifier ?? '';

  if (modifier.includes('left')) return modifier.includes('sharp') ? '↰' : '↖';
  if (modifier.includes('right')) return modifier.includes('sharp') ? '↱' : '↗';
  if (modifier.includes('uturn')) return '↶';

  return '↑';
}

function formatManeuverDistance(distanceInMeters: number) {
  if (distanceInMeters < 20) return 'Now';
  if (distanceInMeters < 1000) return `${Math.max(10, Math.round(distanceInMeters / 10) * 10)} m`;

  return `${(distanceInMeters / 1000).toFixed(1)} km`;
}

function formatRouteDistance(distanceInMeters: number) {
  if (distanceInMeters < 1000) return `${Math.round(distanceInMeters)} m`;

  return `${(distanceInMeters / 1000).toFixed(1)} km`;
}

function formatRouteDistanceInKilometers(distanceInMeters: number) {
  return `${(distanceInMeters / 1000).toFixed(1)} km`;
}

function formatRouteDuration(durationInSeconds: number) {
  const totalMinutes = Math.max(1, Math.round(durationInSeconds / 60));

  if (totalMinutes < 60) return `${totalMinutes} min`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return minutes ? `${hours} hr ${minutes} min` : `${hours} hr`;
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
  mapActions: {
    position: 'absolute',
    right: Spacing.four,
    bottom: Spacing.four,
    gap: Spacing.one,
  },
  mapActionButton: {
    width: 50,
    height: 50,
    minHeight: 50,
    borderRadius: 25,
    paddingHorizontal: 0,
    paddingVertical: 0,
    shadowColor: '#09233C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
  },
  locationActionButton: {
    borderWidth: 1,
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
    shadowColor: '#09233C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
  },
  routeInputBackButton: {
    width: 44,
    height: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  routeInputContentButton: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: Spacing.two,
    paddingHorizontal: 0,
    paddingRight: Spacing.three,
    paddingVertical: 0,
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
  routeDestinationSheet: {
    height: '48%',
    maxHeight: 440,
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
  directionsSection: {
    flex: 1,
    gap: Spacing.two,
    marginBottom: Spacing.three,
    minHeight: 0,
  },
  routeSummary: {
    fontFamily: Fonts.body,
    fontSize: 18,
    fontWeight: 900,
    lineHeight: 24,
  },
  directionsHeading: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 900,
  },
  directionsScroll: {
    flex: 1,
    minHeight: 0,
  },
  directionsList: {
    gap: Spacing.two,
    paddingRight: Spacing.one,
  },
  directionRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  directionNumber: {
    width: 22,
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: 900,
    textAlign: 'center',
  },
  directionCopy: {
    flex: 1,
    minWidth: 0,
  },
  directionInstruction: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 18,
  },
  directionDistance: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: 600,
    lineHeight: 16,
  },
  directionsStatus: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: 600,
    lineHeight: 18,
  },
  goButton: {
    alignSelf: 'stretch',
    marginTop: 'auto',
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
