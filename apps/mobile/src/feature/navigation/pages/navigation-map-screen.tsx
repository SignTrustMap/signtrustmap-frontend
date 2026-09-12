import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AntDesign from "@expo/vector-icons/AntDesign";
import { Animated, BackHandler, PanResponder, Platform, ScrollView, Share, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Image } from "expo-image";
import { AppButton } from "@/components/ui/button";
import { AppToast } from "@/components/ui/toast";
import { NavigationManeuverBanner } from "@/components/navigation-maneuver-banner";
import { NavigationSignAlertBanner } from "@/components/navigation-sign-alert-banner";
import { Fonts, Rounded, Spacing } from "@/constants/theme";
import {
  previousLocations,
  startLocations,
  type MapCoordinate,
} from "@/feature/navigation/data/navigation-locations";
import { useTheme } from "@/hooks/use-theme";

import { NavigationMapView } from "../components/navigation-map-view";
import type { NavigationStep, RouteSign } from '@/api/navigation/navigation';
import type { VehicleMode } from '@/types/navigation/navigationType';
import { useGetNavigationRoute, useGetVehicleModes } from '../hooks/use-navigation';
import { useGetSignsAlongRoute, useGetSignsInBounds } from '../hooks/use-signs';
import { useSignProximityAlert } from '../hooks/use-sign-proximity-alert';
import type { FindSignsInBoundsParams } from '@/types/sign-map/signMapType';
import { getRouteProgressMeters } from "../utils/route-progress";
import { resolveImageUrl, TARGET_SIGN_IMAGE_URL } from "../utils/signs";
import { getMapLibre } from "@/services/maplibre";

async function getNativeGpsStart(): Promise<MapCoordinate | null> {
  const mapLibre = getMapLibre();
  if (!mapLibre) return null;

  try {
    const position = await mapLibre.LocationManager.getCurrentPosition();

    if (!position) return null;

    return [position.coords.longitude, position.coords.latitude];
  } catch {
    return null;
  }
}

export function NavigationMapScreen() {
  const router = useRouter();
  const {
    destinationId,
    destinationLat,
    destinationLng,
    destinationSubtitle,
    destinationTitle,
    startId,
    startLat,
    startLng,
    startTitle,
  } = useLocalSearchParams<{
    destinationId?: string;
    destinationLat?: string;
    destinationLng?: string;
    destinationSubtitle?: string;
    destinationTitle?: string;
    startId?: string;
    startLat?: string;
    startLng?: string;
    startTitle?: string;
  }>();
  const theme = useTheme();
  const { height: windowHeight } = useWindowDimensions();
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const sheetProgress = useRef(new Animated.Value(0)).current;
  const sheetExpandedRef = useRef(false);
  const gestureStart = useRef(0);
  const gestureStartedExpanded = useRef(false);
  const directionsScrollRef = useRef<ScrollView>(null);
  const stepLayoutOffsets = useRef<number[]>([]);
  const collapsedSheetHeight = Math.min(280, windowHeight * 0.36);
  const expandedSheetHeight = Math.max(collapsedSheetHeight, Math.min(560, windowHeight * 0.68));
  const sheetTravel = Math.max(1, expandedSheetHeight - collapsedSheetHeight);
  const sheetHeight = sheetProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [collapsedSheetHeight, expandedSheetHeight],
  });
  const animateRouteSheet = useCallback((expanded: boolean) => {
    sheetExpandedRef.current = expanded;
    setIsSheetExpanded(expanded);
    Animated.spring(sheetProgress, {
      toValue: expanded ? 1 : 0,
      damping: 22,
      mass: 0.8,
      stiffness: 220,
      useNativeDriver: false,
    }).start();
  }, [sheetProgress]);
  const sheetPanResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      gestureStartedExpanded.current = sheetExpandedRef.current;
      gestureStart.current = sheetExpandedRef.current ? 1 : 0;
      sheetProgress.stopAnimation((value) => { gestureStart.current = value; });
    },
    onPanResponderMove: (_, gesture) => {
      sheetProgress.setValue(Math.max(0, Math.min(1, gestureStart.current - gesture.dy / sheetTravel)));
    },
    onPanResponderRelease: (_, gesture) => {
      if (Math.abs(gesture.dx) < 6 && Math.abs(gesture.dy) < 6) {
        animateRouteSheet(!gestureStartedExpanded.current);
      } else if (Math.abs(gesture.vy) > 0.35) {
        animateRouteSheet(gesture.vy < 0);
      } else if (Math.abs(gesture.dy) > 32) {
        animateRouteSheet(gesture.dy < 0);
      } else {
        animateRouteSheet(gestureStartedExpanded.current);
      }
    },
    onPanResponderTerminate: () => animateRouteSheet(gestureStartedExpanded.current),
  }), [animateRouteSheet, sheetProgress, sheetTravel]);

  useEffect(() => {
    if (Platform.OS !== 'android' || !destinationId || !isSheetExpanded) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      animateRouteSheet(false);
      return true;
    });
    return () => subscription.remove();
  }, [animateRouteSheet, destinationId, isSheetExpanded]);

  useEffect(() => () => sheetProgress.stopAnimation(), [sheetProgress]);
  const savedDestination = previousLocations.find(
    (location) => location.id === destinationId,
  );
  const selectedDestination = useMemo(() => {
    if (destinationLat && destinationLng && destinationId) {
      return {
        category: "recent" as const,
        coordinate: [
          Number(destinationLng),
          Number(destinationLat),
        ] as MapCoordinate,
        id: destinationId,
        subtitle: destinationSubtitle ?? "",
        title: destinationTitle ?? "Destination",
      };
    }
    return savedDestination;
  }, [
    destinationId,
    destinationLat,
    destinationLng,
    destinationSubtitle,
    destinationTitle,
    savedDestination,
  ]);
  const selectedStart = startLocations.find(
    (location) => location.id === startId,
  );
  const gpsStart = useMemo(
    () =>
      startLng && startLat
        ? ([Number(startLng), Number(startLat)] as MapCoordinate)
        : undefined,
    [startLat, startLng],
  );
  const routeStart = useMemo(
    () => gpsStart ?? selectedStart?.coordinate,
    [gpsStart, selectedStart],
  );
  const routeStartTitle =
    startTitle ??
    selectedStart?.title ??
    (gpsStart ? "Current Location" : undefined);
  const [vehicleMode, setVehicleMode] = useState<VehicleMode["id"]>("DRIVING");
  const routeKey =
    selectedDestination && routeStart
      ? `${routeStart[0]},${routeStart[1]}:${selectedDestination.coordinate[0]},${selectedDestination.coordinate[1]}:${vehicleMode}`
      : undefined;

  const [navigationSession, setNavigationSession] = useState<{
    hasLiveLocation: boolean;
    routeKey: string;
  }>();
  const { data: vehicleModes = [] } = useGetVehicleModes();
  const [isStartingNavigation, setIsStartingNavigation] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationToast, setLocationToast] = useState<{
    id: number;
    message: string;
  }>();
  const [mapFocus, setMapFocus] = useState<{
    coordinate: MapCoordinate;
    requestId: number;
  }>();
  const [navigationActionError, setNavigationError] = useState<string>();
  const [userCoordinate, setUserCoordinate] = useState<MapCoordinate>();
  const { data: routeResult, error: routeError } = useGetNavigationRoute(
    routeStart,
    selectedDestination?.coordinate,
    vehicleMode,
  );
  const [mapBounds, setMapBounds] = useState<FindSignsInBoundsParams>();
  const hasSelectedRoute = Boolean(routeStart && selectedDestination);
  const { data: mapSigns = [], error: boundsSignsError } = useGetSignsInBounds(
    mapBounds,
    !hasSelectedRoute,
  );
  const { data: plannedSigns = [], error: routeSignsError } = useGetSignsAlongRoute(
    routeStart,
    selectedDestination?.coordinate,
    routeResult?.geometry,
  );
  console.log('plannedSigns', plannedSigns);
  const navigationError = routeError?.message ?? navigationActionError
    ?? (routeSignsError ? 'Unable to load traffic signs for this route.' : undefined);
  const routeCoordinates = routeResult?.coordinates;
  const routeDistance = routeResult?.distance;
  const routeDuration = routeResult?.duration;
  const routeSteps = routeResult?.steps;
  const isNavigating = Boolean(
    routeKey && navigationSession?.routeKey === routeKey,
  );
  const hasLiveLocation = Boolean(
    isNavigating && navigationSession?.hasLiveLocation,
  );
  const visibleSigns = useMemo(() => {
    const rawSigns = hasSelectedRoute ? plannedSigns : mapSigns;
    return rawSigns.map((sign) => ({
      ...sign,
      imageUrl: sign.imageUrl && !sign.imageUrl.includes('mock/')
        ? resolveImageUrl(sign.imageUrl)
        : TARGET_SIGN_IMAGE_URL,
    }));
  }, [hasSelectedRoute, mapSigns, plannedSigns]);
  const sampleRouteSigns = useMemo((): RouteSign[] => {
    if (!hasSelectedRoute || !routeCoordinates || routeCoordinates.length < 2) return [];
    const nearStart = routeCoordinates[Math.min(1, routeCoordinates.length - 1)];
    const mid = routeCoordinates[Math.floor((routeCoordinates.length - 1) / 2)];
    return [
      { id: 'sample-sign-start', coordinate: nearStart, imageUrl: '', name: 'Stop', signCode: 'STOP' },
      { id: 'sample-sign-mid', coordinate: mid, imageUrl: '', name: 'Stop', signCode: 'STOP' },
    ];
  }, [hasSelectedRoute, routeCoordinates]);

  const signsWithSamples = useMemo(
    () => {
      const sampleIds = new Set(sampleRouteSigns.map((s) => s.id));
      const deduped = visibleSigns.filter((s) => !sampleIds.has(s.id));
      return [...sampleRouteSigns, ...deduped];
    },
    [sampleRouteSigns, visibleSigns],
  );
  const maneuverProgresses = useMemo(
    () =>
      routeSteps?.map((step) =>
        step.maneuver.location && routeCoordinates
          ? getRouteProgressMeters(step.maneuver.location, routeCoordinates)
          : undefined,
      ),
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

    const currentProgress = getRouteProgressMeters(
      navigationCoordinate,
      routeCoordinates,
    );
    let stepIndex = routeSteps.findIndex((step, index) => {
      const maneuverProgress = maneuverProgresses[index];

      return (
        step.maneuver.type !== "depart" &&
        maneuverProgress !== undefined &&
        maneuverProgress >= currentProgress + 10
      );
    });

    if (stepIndex < 0) stepIndex = routeSteps.length - 1;

    return {
      distance: Math.max(
        0,
        (maneuverProgresses[stepIndex] ?? currentProgress) - currentProgress,
      ),
      step: routeSteps[stepIndex],
      stepIndex,
    };
  }, [
    isNavigating,
    maneuverProgresses,
    routeCoordinates,
    routeStart,
    routeSteps,
    userCoordinate,
  ]);

  const { activeAlert: activeSignAlert } = useSignProximityAlert({
    alertDistanceMeters: 50,
    isNavigating,
    signs: signsWithSamples,
    userCoordinate: userCoordinate ?? routeStart,
    speechLanguage: "en-US",
  });

  useEffect(() => {
    setNavigationError(undefined);
  }, [routeKey, vehicleMode]);

  useEffect(() => {
    const stepIndex = activeManeuver?.stepIndex;
    if (stepIndex == null) return;
    const offset = stepLayoutOffsets.current[stepIndex];
    if (offset != null) {
      directionsScrollRef.current?.scrollTo({ y: offset, animated: true });
    }
  }, [activeManeuver?.stepIndex]);

  useEffect(() => {
    if (Platform.OS === "web" || !hasLiveLocation) return;

    const mapLibre = getMapLibre();
    if (!mapLibre) return;

    try {
      const handleLocationUpdate = (position: {
        coords: { latitude: number; longitude: number };
      }) => {
        setUserCoordinate([
          position.coords.longitude,
          position.coords.latitude,
        ]);
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
    if (
      Platform.OS === "web" ||
      !selectedDestination ||
      !routeStart ||
      !routeKey
    )
      return;

    if (!routeCoordinates?.length) {
      setNavigationError("The route is still loading. Try again in a moment.");
      return;
    }

    setIsStartingNavigation(true);
    setNavigationError(undefined);

    try {
      const mapLibre = getMapLibre();
      const currentPosition = mapLibre
        ? await mapLibre.LocationManager.getCurrentPosition()
        : null;

      setUserCoordinate(
        currentPosition
          ? [currentPosition.coords.longitude, currentPosition.coords.latitude]
          : routeStart,
      );

      setNavigationSession({
        hasLiveLocation: Boolean(currentPosition),
        routeKey,
      });
    } catch {
      setUserCoordinate(routeStart);
      setNavigationSession({
        hasLiveLocation: false,
        routeKey,
      });
    } finally {
      setIsStartingNavigation(false);
    }
  };

  const handleCurrentLocation = async () => {
    if (isLocating) return;

    setIsLocating(true);

    try {
      let coordinate: MapCoordinate;

      const mapLibre = getMapLibre();
      if (!mapLibre) {
        throw new Error("Current GPS location requires a native build.");
      }
      const hasPermission = await mapLibre.LocationManager.requestPermissions();

      if (!hasPermission) {
        throw new Error("Allow location access to use your current position.");
      }

      const position = await mapLibre.LocationManager.getCurrentPosition();

      if (!position) {
        throw new Error("Turn on GPS and try again.");
      }

      coordinate = [position.coords.longitude, position.coords.latitude];
      console.log(coordinate);
      setMapFocus((current) => ({
        coordinate,
        requestId: (current?.requestId ?? 0) + 1,
      }));
    } catch (error) {
      setLocationToast((current) => ({
        id: (current?.id ?? 0) + 1,
        message:
          error instanceof Error
            ? error.message
            : "Unable to get your current location.",
      }));
    } finally {
      setIsLocating(false);
    }
  };

  const handleSwapSelectedRoute = () => {
    if (!selectedDestination || !routeStart) return;
    setNavigationSession(undefined);
    router.replace({
      pathname: '/home',
      params: {
        destinationId: startId ?? 'swapped-start',
        destinationLat: String(routeStart[1]),
        destinationLng: String(routeStart[0]),
        destinationTitle: routeStartTitle ?? 'Starting point',
        destinationSubtitle: '',
        startId: selectedDestination.id,
        startLat: String(selectedDestination.coordinate[1]),
        startLng: String(selectedDestination.coordinate[0]),
        startTitle: selectedDestination.title,
      },
    });
  };

  const handleChangeDestination = () => {
    router.push({
      pathname: "/home/search",
      params: {
        ...(startId ? { startId } : {}),
        ...(startLat && startLng ? { startLat, startLng } : {}),
        ...(startTitle ? { startTitle } : {}),
      },
    });
  };

  const handleGo = async () => {
    if (!selectedDestination) return;

    if (Platform.OS !== "web") {
      const nativeGpsStart = await getNativeGpsStart();

      if (nativeGpsStart) {
        router.replace({
          pathname: "/home",
          params: {
            destinationId: selectedDestination.id,
            destinationLat: String(selectedDestination.coordinate[1]),
            destinationLng: String(selectedDestination.coordinate[0]),
            destinationSubtitle: selectedDestination.subtitle,
            destinationTitle: selectedDestination.title,
            startLat: String(nativeGpsStart[1]),
            startLng: String(nativeGpsStart[0]),
          },
        });
        return;
      }
    }

    if (
      Platform.OS === "web" &&
      "geolocation" in navigator &&
      "permissions" in navigator
    ) {
      const permission = await navigator.permissions.query({
        name: "geolocation",
      });

      if (permission.state === "granted") {
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => {
            router.replace({
              pathname: "/home",
              params: {
                destinationId: selectedDestination.id,
                destinationLat: String(selectedDestination.coordinate[1]),
                destinationLng: String(selectedDestination.coordinate[0]),
                destinationSubtitle: selectedDestination.subtitle,
                destinationTitle: selectedDestination.title,
                startLat: String(coords.latitude),
                startLng: String(coords.longitude),
                startTitle: "Current Location",
              },
            });
          },
          () => {
            router.push({
              pathname: "/home/start",
              params: {
                destinationId: selectedDestination.id,
                destinationLat: String(selectedDestination.coordinate[1]),
                destinationLng: String(selectedDestination.coordinate[0]),
                destinationSubtitle: selectedDestination.subtitle,
                destinationTitle: selectedDestination.title,
              },
            });
          },
        );
        return;
      }
    }

    router.push({
      pathname: "/home/start",
      params: {
        destinationId: selectedDestination.id,
        destinationLat: String(selectedDestination.coordinate[1]),
        destinationLng: String(selectedDestination.coordinate[0]),
        destinationSubtitle: selectedDestination.subtitle,
        destinationTitle: selectedDestination.title,
      },
    });
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={styles.map}>
        <NavigationMapView
          onBoundsChange={setMapBounds}
          destination={selectedDestination}
          focusCoordinate={
            selectedDestination ? undefined : mapFocus?.coordinate
          }
          focusRequestId={mapFocus?.requestId}
          navigationActive={
            Platform.OS !== "web" &&
            isNavigating &&
            Boolean(navigationSession?.hasLiveLocation)
          }
          routeCoordinates={routeCoordinates}
          routeStart={routeStart}
          routeSigns={signsWithSamples}
          showCurrentLocation={!isNavigating}
        />

        {!hasSelectedRoute && boundsSignsError ? (
          <AppToast
            message="Unable to load traffic signs."
          />
        ) : null}

        {isNavigating && activeManeuver ? (
          <NavigationManeuverBanner
            distance={formatManeuverDistance(activeManeuver.distance)}
            instruction={formatRouteInstruction(activeManeuver.step)}
            symbol={getManeuverSymbol(activeManeuver.step)}
          />
        ) : null}

        {isNavigating && activeSignAlert ? (
          <NavigationSignAlertBanner
            distanceMeters={activeSignAlert.distanceMeters}
            hasActiveManeuver={Boolean(activeManeuver)}
            sign={activeSignAlert.sign}
          />
        ) : null}

        {!isNavigating ? (
          <SafeAreaView pointerEvents="box-none" style={styles.overlay}>
            <View style={styles.topControls}>
              {selectedDestination && routeStart ? (
                <View style={[styles.selectedRouteRow, { backgroundColor: theme.backgroundElement }]}>
                  <View style={styles.selectedRouteFields}>
                    <AppButton
                      accessibilityLabel="Change starting point"
                      onPress={() => router.push({
                        pathname: '/home/start',
                        params: {
                          destinationId: selectedDestination.id,
                          destinationLat: String(selectedDestination.coordinate[1]),
                          destinationLng: String(selectedDestination.coordinate[0]),
                          destinationSubtitle: selectedDestination.subtitle,
                          destinationTitle: selectedDestination.title,
                        },
                      })}
                      style={styles.selectedRouteInput}
                      variant="ghost"
                    >
                      <View style={[styles.routeOriginCircle, { borderColor: theme.textSecondary }]} />
                      <Text numberOfLines={1} style={[styles.selectedStartText, { color: theme.text }]}>
                        {routeStartTitle}
                      </Text>
                    </AppButton>
                    <View pointerEvents="none" style={[styles.routeFieldDivider, { backgroundColor: theme.border }]} />
                    <View pointerEvents="none" style={styles.selectedRouteConnector}>
                      {[0, 1, 2].map((dot) => (
                        <View key={dot} style={[styles.selectedRouteDot, { backgroundColor: theme.placeholder }]} />
                      ))}
                    </View>
                    <AppButton
                      accessibilityLabel="Change destination"
                      onPress={handleChangeDestination}
                      style={[styles.selectedRouteInput, styles.destinationWithSwap]}
                      variant="ghost"
                    >
                      <AntDesign name="environment" size={17} color={theme.danger} />
                      <Text numberOfLines={1} style={[styles.selectedDestinationText, { color: theme.text }]}>
                        {selectedDestination.title}
                      </Text>
                    </AppButton>
                  </View>
                  <AppButton
                    accessibilityLabel="Swap starting point and destination"
                    onPress={handleSwapSelectedRoute}
                    style={styles.routeSwapButton}
                    variant="ghost"
                  >
                    <AntDesign name="swap" size={20} color={theme.text} style={{ transform: [{ rotate: '90deg' }] }} />
                  </AppButton>
                </View>
              ) : selectedDestination ? (
                <View
                  style={[
                    styles.selectedRouteRow,
                    { borderRadius: Rounded.round },
                    { backgroundColor: theme.backgroundElement },
                  ]}
                >
                  <AppButton
                    accessibilityLabel="Change destination"
                    onPress={handleChangeDestination}
                    style={[styles.selectedRouteInput, styles.selectedRouteFields, { borderRadius: Rounded.round }]}
                    variant="ghost"
                  >
                    <Text
                      ellipsizeMode="tail"
                      numberOfLines={1}
                      style={[
                        styles.selectedDestinationText,
                        { color: theme.text },
                      ]}
                    >
                      {selectedDestination.title}
                    </Text>
                  </AppButton>
                </View>
              ) : (
                <View
                  style={[styles.searchBar, { backgroundColor: theme.backgroundElement }]}
                >
                  <AppButton
                    accessibilityLabel="Search destination"
                    onPress={() => router.push('/home/search')}
                    style={styles.searchButton}
                    variant="ghost"
                  >
                    <Image
                      accessibilityLabel="App logo"
                      contentFit="cover"
                      source={require('@/assets/images/app-logo.svg')}
                      style={styles.appLogo}
                    />
                    <Text numberOfLines={1} style={[styles.searchText, { color: theme.placeholder }]}>
                      Search here...
                    </Text>
                  </AppButton>
                  <AppButton
                    accessibilityLabel="Add credits. Current balance: 24"
                    onPress={() => router.push('/credits/top-up')}
                    pressedOpacity={0.68}
                    style={[styles.creditContainer, { backgroundColor: theme.backgroundSelected }]}
                    variant="ghost"
                  >
                    <Text style={[styles.creditText, { color: theme.text }]}>24</Text>
                    <View style={[styles.addCreditIcon, { backgroundColor: theme.primary }]}>
                      <Text style={[styles.addCreditGlyph, { color: theme.onPrimary }]}>+</Text>
                    </View>
                  </AppButton>
                </View>
              )}
            </View>
            {!selectedDestination ? (
              <View style={styles.mapActions}>
                <AppButton
                  accessibilityLabel={
                    isLocating
                      ? "Getting current location"
                      : "Use current location"
                  }
                  disabled={isLocating}
                  onPress={handleCurrentLocation}
                  style={[
                    styles.mapActionButton,
                    styles.locationActionButton,
                    {
                      backgroundColor: theme.backgroundElement,
                      borderColor: theme.primary,
                    },
                  ]}
                  variant="surface"
                >
                  <SymbolView
                    name={{
                      android: "my_location",
                      ios: "location.fill",
                      web: "my_location",
                    }}
                    size={22}
                    tintColor={theme.primary}
                  />
                </AppButton>
                <AppButton
                  accessibilityLabel="Search destination"
                  onPress={() => router.push("/home/search")}
                  style={styles.mapActionButton}
                >
                  <SymbolView
                    name={{
                      android: "search",
                      ios: "magnifyingglass",
                      web: "search",
                    }}
                    size={22}
                    tintColor={theme.onPrimary}
                  />
                </AppButton>
              </View>
            ) : null}
          </SafeAreaView>
        ) : null}
      </View>

      {selectedDestination ? (
        <Animated.View
          style={[
            styles.destinationSheet,
            styles.routeDestinationSheet,
            { height: sheetHeight },
            { backgroundColor: theme.backgroundElement },
          ]}
        >
          <View
            accessible
            accessibilityRole="button"
            accessibilityLabel={isSheetExpanded ? 'Collapse route details' : 'Expand route details'}
            accessibilityHint="Drag up to expand or down to collapse. Tap to toggle."
            accessibilityState={{ expanded: isSheetExpanded }}
            accessibilityActions={[{ name: 'activate' }]}
            onAccessibilityAction={() => animateRouteSheet(!sheetExpandedRef.current)}
            style={styles.destinationSheetHandleArea}
            {...sheetPanResponder.panHandlers}
          >
            <View style={styles.destinationSheetHandle} />
          </View>
          <Text
            numberOfLines={1}
            style={[
              styles.destinationTitle,
              !routeStart ? styles.selectedPlaceTitle : undefined,
              { color: theme.text },
            ]}
          >
            {selectedDestination.title}
          </Text>
          {!routeStart && selectedDestination.subtitle ? (
            <Text style={[styles.selectedPlaceDescription, { color: theme.textSecondary }]}>
              {selectedDestination.subtitle}
            </Text>
          ) : null}
          {navigationError ? (
            <Text accessibilityRole="alert" style={styles.navigationError}>
              {navigationError}
            </Text>
          ) : null}
          {routeStart ? (
            <View style={styles.directionsSection}>
              {vehicleModes.length > 1 ? (
                <View style={styles.vehicleModes}>
                  {vehicleModes.map((mode) => (
                    <AppButton
                      key={mode.id}
                      label={mode.label}
                      onPress={() => setVehicleMode(mode.id)}
                      variant={vehicleMode === mode.id ? "primary" : "surface"}
                    />
                  ))}
                </View>
              ) : null}
              {routeDuration !== undefined && routeDistance !== undefined ? (
                <Text style={[styles.routeSummary, { color: theme.text }]}>
                  ETA {formatRouteDuration(routeDuration)} (
                  {formatRouteDistanceInKilometers(routeDistance)})
                </Text>
              ) : (
                <Text
                  style={[styles.routeSummary, { color: theme.textSecondary }]}
                >
                  Calculating ETA...
                </Text>
              )}
              <Text style={[styles.directionsHeading, { color: theme.text }]}>
                Sections:
              </Text>
              {routeSteps ? (
                routeSteps.length > 0 ? (
                  <ScrollView
                    ref={directionsScrollRef}
                    contentContainerStyle={styles.directionsList}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator
                    style={styles.directionsScroll}
                  >
                    {routeSteps.map((step, index) => {
                      const isActiveStep = isNavigating && activeManeuver?.stepIndex === index;
                      return (
                        <View
                          key={`${index}-${step.maneuver.type}-${step.name}`}
                          onLayout={(e) => {
                            stepLayoutOffsets.current[index] = e.nativeEvent.layout.y;
                          }}
                          style={[
                            styles.directionRow,
                            isActiveStep && styles.directionRowActive,
                            isActiveStep && { backgroundColor: theme.backgroundSelected },
                          ]}
                        >
                          <Text
                            style={[
                              styles.directionNumber,
                              { color: isActiveStep ? theme.primary : theme.textSecondary },
                            ]}
                          >
                            {index + 1}
                          </Text>
                          <View style={styles.directionCopy}>
                            <Text
                              style={[
                                styles.directionInstruction,
                                { color: theme.text },
                                isActiveStep && styles.directionInstructionActive,
                              ]}
                            >
                              {formatRouteInstruction(step)}
                            </Text>
                            <Text
                              style={[
                                styles.directionDistance,
                                { color: theme.textSecondary },
                              ]}
                            >
                              {formatRouteDistance(step.distance)}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </ScrollView>
                ) : (
                  <Text
                    style={[
                      styles.directionsStatus,
                      { color: theme.textSecondary },
                    ]}
                  >
                    No turn-by-turn directions are available for this route.
                  </Text>
                )
              ) : (
                <Text
                  style={[
                    styles.directionsStatus,
                    { color: theme.textSecondary },
                  ]}
                >
                  Loading directions...
                </Text>
              )}
            </View>
          ) : null}
          <View style={styles.destinationActions}>
            <AppButton
              accessibilityLabel={
                isNavigating
                  ? "Navigation active"
                  : routeStart
                    ? "Begin navigation"
                    : "Start route"
              }
              disabled={isNavigating || isStartingNavigation}
              label={
                isNavigating
                  ? "Navigating..."
                  : isStartingNavigation
                    ? "Starting..."
                    : "Go"
              }
              onPress={routeStart ? handleBeginNavigation : handleGo}
              style={[styles.goButton, !routeStart ? styles.destinationActionButton : undefined]}
            />
            {!routeStart ? (
              <AppButton
                accessibilityLabel={`Share ${selectedDestination.title}`}
                label="Share"
                onPress={async () => {
                  try {
                    const [longitude, latitude] = selectedDestination.coordinate;
                    await Share.share({
                      title: selectedDestination.title,
                      message: `${selectedDestination.title}\nhttps://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
                    });
                  } catch {
                    setLocationToast((current) => ({
                      id: (current?.id ?? 0) + 1,
                      message: 'Unable to share this destination right now.',
                    }));
                  }
                }}
                style={[styles.destinationActionButton, {
                  backgroundColor: theme.backgroundSelected, borderColor: 'transparent',
                }]}
                textStyle={{ color: theme.textSecondary }}
                variant="surface"
              />
            ) : null}
          </View>
        </Animated.View>
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

function formatRouteInstruction(step: NavigationStep) {
  return step.instruction;
}

function getManeuverSymbol(step: NavigationStep) {
  if (step.maneuver.type === "arrive") return "●";
  if (step.maneuver.type === "roundabout" || step.maneuver.type === "rotary")
    return "↻";

  const instruction = step.instruction.toLowerCase();
  if (instruction.includes("left")) return "↖";
  if (instruction.includes("right")) return "↗";
  if (instruction.includes("u-turn")) return "↶";

  return "↑";
}

function formatManeuverDistance(distanceInMeters: number) {
  if (distanceInMeters < 20) return "Now";
  if (distanceInMeters < 1000)
    return `${Math.max(10, Math.round(distanceInMeters / 10) * 10)} m`;

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
  selectedRouteRow: {
    flexDirection: 'row',
    borderRadius: Rounded.lg,
    paddingHorizontal: Spacing.two,
    shadowColor: '#09233C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedRouteBackButton: {
    width: 36,
    minHeight: 48,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  selectedRouteFields: {
    flex: 1,
    minWidth: 0,
  },
  selectedRouteInput: {
    minHeight: 48,
    borderRadius: 0,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: Spacing.two,
    paddingHorizontal: 0,
    paddingVertical: Spacing.one,
    paddingLeft: Spacing.two
  },
  routeOriginCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    marginHorizontal: 2.5,
  },
  routeFieldDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 17 + Spacing.two,
    marginRight: 36,
  },
  destinationWithSwap: { paddingRight: 40 },
  routeSwapButton: {
    position: 'absolute',
    right: Spacing.half,
    bottom: 0,
    width: 44,
    minHeight: 48,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  selectedRouteConnector: {
    position: 'absolute',
    left: 0,
    top: 39,
    width: 16,
    height: 18,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 2,
  },
  selectedRouteDot: {
    width: 2,
    height: 2,
    borderRadius: Rounded.round,
  },
  selectedStartText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 18,
    fontWeight: 500,
  },
  selectedDestinationText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 18,
    fontWeight: 500,
  },
  destinationSheetHandleArea: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  destinationActions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: 'auto',
  },
  destinationActionButton: {
    flex: 1,
    minWidth: 0,
    borderRadius: Rounded.round,
  },
  selectedPlaceDescription: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 20,
    marginBottom: Spacing.three,
  },
  selectedPlaceTitle: {
    fontFamily: Fonts.body,
    fontSize: 22,
    fontWeight: 900,
    lineHeight: 29,
  },
  screen: {
    flex: 1,
  },
  map: {
    flex: 1,
    overflow: "hidden",
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
    position: "absolute",
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
    shadowColor: "#09233C",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
  },
  locationActionButton: {
    borderWidth: 1,
  },
  routeInputGroup: {
    gap: Spacing.one,
  },
  inlineBackButton: {
    width: 44,
    height: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  backIcon: {
    fontSize: 18,
    fontWeight: 700,
  },
  selectedDestinationInput: {
    minHeight: 44,
    borderRadius: Rounded.md,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: Spacing.three,
    shadowColor: "#09233C",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
    paddingLeft: Spacing.four,
  },
  destinationNameButton: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: Spacing.two,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  destinationNameText: {
    flexShrink: 1,
    fontFamily: Fonts.body,
    fontSize: 18,
    fontWeight: 600,
  },
  appLogo: {
    width: 26,
    height: 26,
  },
  searchBar: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Rounded.round,
    paddingLeft: Spacing.half,
    shadowColor: '#09233C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  searchButton: {
    flex: 1,
    minWidth: 0,
    minHeight: 40,
    borderRadius: Rounded.round,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: 0,
  },
  creditContainer: {
    alignSelf: 'stretch',
    flexShrink: 0,
    minHeight: 48,
    borderRadius: Rounded.round,
    flexDirection: 'row',
    gap: Spacing.half,
    paddingLeft: Spacing.two,
    paddingRight: Spacing.half,
    paddingVertical: 0,
    marginLeft: Spacing.half,
  },
  creditText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: 800,
  },
  addCreditIcon: {
    width: 26,
    height: 26,
    borderRadius: Rounded.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCreditGlyph: {
    width: 26,
    height: 26,
    fontFamily: Fonts.body,
    fontSize: 21,
    fontWeight: 700,
    lineHeight: 25,
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  searchText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 14,
  },
  routeInput: {
    minHeight: 44,
    borderRadius: Rounded.md,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#09233C",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
  },
  routeInputBackButton: {
    width: 44,
    height: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  routeInputContentButton: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: Spacing.two,
    paddingHorizontal: 0,
    paddingRight: Spacing.three,
    paddingVertical: 0,
  },
  routeInputIcon: {
    fontFamily: Fonts.body,
    fontSize: 15,
    fontWeight: 900,
  },
  routeInputText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 16,
    fontWeight: 600,
  },
  destinationSheet: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    borderTopLeftRadius: Rounded.xlg,
    borderTopRightRadius: Rounded.xlg,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.one,
    paddingBottom: Spacing.three,
    shadowColor: '#09233C',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  routeDestinationSheet: {
    overflow: 'hidden',
  },
  destinationSheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    backgroundColor: "#D8DDE6",
  },
  destinationTitle: {
    fontFamily: Fonts.body,
    fontSize: 16,
    fontWeight: 900,
    marginBottom: Spacing.three,
  },
  navigationError: {
    color: "#B42318",
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
  vehicleModes: {
    flexDirection: "row",
    gap: Spacing.one,
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
    flexDirection: "row",
    gap: Spacing.two,
    alignItems: "flex-start",
  },
  directionRowActive: {
    borderRadius: Rounded.sm,
    paddingHorizontal: Spacing.one,
    paddingVertical: Spacing.half,
    marginHorizontal: -Spacing.one,
  },
  directionInstructionActive: {
    fontWeight: 900,
  },
  directionNumber: {
    width: 22,
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: 900,
    textAlign: "center",
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
    flex: 1,
    alignSelf: "stretch",
    borderRadius: Rounded.round,
  },
  creditPill: {
    alignSelf: "flex-end",
    borderRadius: Rounded.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    shadowColor: "#09233C",
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
