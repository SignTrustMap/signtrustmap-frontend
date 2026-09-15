import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AntDesign from "@expo/vector-icons/AntDesign";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Animated, BackHandler, PanResponder, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Camera } from "expo-camera";
import { Image } from "expo-image";
import { AppButton } from "@/components/ui/button";
import { AppToast } from "@/components/ui/toast";
import { NavigationManeuverBanner } from "@/components/navigation-maneuver-banner";
import { NavigationSignAlertBanner } from "@/components/navigation-sign-alert-banner";
import { NavigationSignVerifyCard } from "@/components/navigation-sign-verify-card";
import type { SignVerifyResult } from "@/components/navigation-sign-verify-card";
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
import { useGetNavigationRoute } from '../hooks/use-navigation';
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

export type SignCategory = 'WARNING' | 'MANDATORY' | 'PROHIBITORY' | 'INFORMATION' | 'TEMPORARY';

export const SIGN_CATEGORIES: {
  id: SignCategory;
  label: string;
  sublabel: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  bgColor: string;
}[] = [
    {
      id: 'PROHIBITORY',
      label: 'Prohibitory',
      sublabel: 'No entry, turns, speed limits',
      icon: 'cancel',
      color: '#EF4444',
      bgColor: 'rgba(239, 68, 68, 0.14)',
    },
    {
      id: 'WARNING',
      label: 'Warning',
      sublabel: 'Curves, hazards, crossings',
      icon: 'alert',
      color: '#F59E0B',
      bgColor: 'rgba(245, 158, 11, 0.14)',
    },
    {
      id: 'MANDATORY',
      label: 'Mandatory',
      sublabel: 'Required direction, min speed',
      icon: 'arrow-right-circle',
      color: '#3B82F6',
      bgColor: 'rgba(59, 130, 246, 0.14)',
    },
    {
      id: 'INFORMATION',
      label: 'Information',
      sublabel: 'Priority road, one-way, facilities',
      icon: 'information-outline',
      color: '#10B981',
      bgColor: 'rgba(16, 185, 129, 0.14)',
    },
    {
      id: 'TEMPORARY',
      label: 'Temporary',
      sublabel: 'Roadworks, detours, repairs',
      icon: 'traffic-cone',
      color: '#F97316',
      bgColor: 'rgba(249, 115, 22, 0.14)',
    },
  ];

export function getSignCategory(sign: { signCode?: string; name?: string }): SignCategory {
  const code = (sign.signCode ?? '').toUpperCase().trim();
  const name = (sign.name ?? '').toUpperCase().trim();

  if (
    code.startsWith('T.') ||
    code.startsWith('T-') ||
    code.startsWith('TEMP') ||
    name.includes('TEMP') ||
    name.includes('ROADWORK') ||
    name.includes('CONSTRUCTION') ||
    name.includes('TẠM THỜI')
  ) {
    return 'TEMPORARY';
  }

  if (
    code.startsWith('P.') ||
    code.startsWith('P-') ||
    code === 'STOP' ||
    code.startsWith('PROHIB') ||
    name.includes('STOP') ||
    name.includes('NO ENTRY') ||
    name.includes('PROHIB') ||
    name.includes('SPEED LIMIT') ||
    name.includes('CẤM')
  ) {
    return 'PROHIBITORY';
  }

  if (
    code.startsWith('W.') ||
    code.startsWith('W-') ||
    code.startsWith('WARN') ||
    name.includes('WARN') ||
    name.includes('DANGER') ||
    name.includes('HAZARD') ||
    name.includes('CURVE') ||
    name.includes('CROSSING') ||
    name.includes('INTERSECTION') ||
    name.includes('NGUY HIỂM') ||
    name.includes('CẢNH BÁO')
  ) {
    return 'WARNING';
  }

  if (
    code.startsWith('R.') ||
    code.startsWith('R-') ||
    code.startsWith('MAND') ||
    name.includes('MAND') ||
    name.includes('COMPULSORY') ||
    name.includes('ROUNDABOUT') ||
    name.includes('HIỆU LỆNH')
  ) {
    return 'MANDATORY';
  }

  if (
    code.startsWith('I.') ||
    code.startsWith('I-') ||
    code.startsWith('G.') ||
    code.startsWith('G-') ||
    code.startsWith('INFO') ||
    name.includes('INFO') ||
    name.includes('GUIDE') ||
    name.includes('PARKING') ||
    name.includes('PRIORITY') ||
    name.includes('ONE WAY') ||
    name.includes('CHỈ DẪN')
  ) {
    return 'INFORMATION';
  }

  if (code.startsWith('W')) return 'WARNING';
  if (code.startsWith('P')) return 'PROHIBITORY';
  if (code.startsWith('R')) return 'MANDATORY';
  if (code.startsWith('I') || code.startsWith('G')) return 'INFORMATION';
  if (code.startsWith('T')) return 'TEMPORARY';

  return 'WARNING';
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
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(Spacing.two, insets.bottom);
  const [sheetSnapIndex, setSheetSnapIndex] = useState<0 | 1 | 2>(1);
  const snapIndexRef = useRef<0 | 1 | 2>(1);
  const directionsScrollRef = useRef<ScrollView>(null);
  const stepLayoutOffsets = useRef<number[]>([]);

  // 3 collapse ranges:
  // 0: Peek range (displays vehicle mode, ETA, distance, close button, vehicle mode tabs, and Start button)
  // 1: Mid range (standard preview with vehicle tabs, filters preview, and Start button)
  // 2: Full range (expanded view showing the full sign filter list and Start button)
  const peekSheetHeight = routeStart
    ? 188 + bottomInset
    : Math.min(180, windowHeight * 0.22);
  const midSheetHeight = routeStart
    ? Math.min(420, windowHeight * 0.52)
    : Math.min(280, windowHeight * 0.36);
  const maxSheetHeight = Math.max(
    midSheetHeight,
    Math.min(640, windowHeight * 0.82),
  );

  const sheetHeightAnim = useRef(new Animated.Value(midSheetHeight)).current;
  const currentHeightRef = useRef(midSheetHeight);

  const snapTo = useCallback(
    (index: 0 | 1 | 2) => {
      snapIndexRef.current = index;
      setSheetSnapIndex(index);
      const targetHeight =
        index === 0
          ? peekSheetHeight
          : index === 1
            ? midSheetHeight
            : maxSheetHeight;
      currentHeightRef.current = targetHeight;
      Animated.spring(sheetHeightAnim, {
        toValue: targetHeight,
        damping: 24,
        mass: 0.8,
        stiffness: 240,
        useNativeDriver: false,
      }).start();
    },
    [peekSheetHeight, midSheetHeight, maxSheetHeight, sheetHeightAnim],
  );

  // Keep animated height in sync if window size or routeStart changes
  useEffect(() => {
    const targetHeight =
      snapIndexRef.current === 0
        ? peekSheetHeight
        : snapIndexRef.current === 1
          ? midSheetHeight
          : maxSheetHeight;
    currentHeightRef.current = targetHeight;
    Animated.spring(sheetHeightAnim, {
      toValue: targetHeight,
      damping: 24,
      mass: 0.8,
      stiffness: 240,
      useNativeDriver: false,
    }).start();
  }, [peekSheetHeight, midSheetHeight, maxSheetHeight, sheetHeightAnim]);

  useEffect(() => {
    if (selectedDestination) {
      snapTo(1);
    }
  }, [selectedDestination, snapTo]);

  const expandableContentOpacity = sheetHeightAnim.interpolate({
    inputRange: [peekSheetHeight, peekSheetHeight + 50],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const sheetPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dy) > 3 || Math.abs(gesture.dx) > 3,
        onPanResponderGrant: () => {
          sheetHeightAnim.stopAnimation((value) => {
            currentHeightRef.current = value;
          });
        },
        onPanResponderMove: (_, gesture) => {
          const newHeight = currentHeightRef.current - gesture.dy;
          const clamped = Math.max(
            peekSheetHeight - 10,
            Math.min(maxSheetHeight + 15, newHeight),
          );
          sheetHeightAnim.setValue(clamped);
        },
        onPanResponderRelease: (_, gesture) => {
          // Tap handling: cycle snapIndex up, if it reaches 2, wrap back to 0
          if (Math.abs(gesture.dx) < 6 && Math.abs(gesture.dy) < 6) {
            const current = snapIndexRef.current;
            const nextIndex = ((current + 1) % 3) as 0 | 1 | 2;
            snapTo(nextIndex);
            return;
          }

          // Velocity flick gestures
          const vy = gesture.vy;
          if (vy < -0.45) {
            if (snapIndexRef.current === 0) {
              snapTo(1);
            } else {
              snapTo(2);
            }
            return;
          } else if (vy > 0.45) {
            if (snapIndexRef.current === 2) {
              snapTo(1);
            } else {
              snapTo(0);
            }
            return;
          }

          // Distance-based snapping to nearest tier
          const finalHeight = currentHeightRef.current - gesture.dy;
          const thresholdPeekToMid = (peekSheetHeight + midSheetHeight) / 2;
          const thresholdMidToMax = (midSheetHeight + maxSheetHeight) / 2;

          if (finalHeight < thresholdPeekToMid) {
            snapTo(0);
          } else if (finalHeight < thresholdMidToMax) {
            snapTo(1);
          } else {
            snapTo(2);
          }
        },
        onPanResponderTerminate: () => {
          snapTo(snapIndexRef.current);
        },
      }),
    [
      peekSheetHeight,
      midSheetHeight,
      maxSheetHeight,
      sheetHeightAnim,
      snapTo,
    ],
  );

  useEffect(() => {
    if (Platform.OS !== 'android' || !destinationId || sheetSnapIndex < 2) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      snapTo(1);
      return true;
    });
    return () => subscription.remove();
  }, [destinationId, sheetSnapIndex, snapTo]);

  useEffect(() => () => sheetHeightAnim.stopAnimation(), [sheetHeightAnim]);
  const routeKey =
    selectedDestination && routeStart
      ? `${routeStart[0]},${routeStart[1]}:${selectedDestination.coordinate[0]},${selectedDestination.coordinate[1]}:${vehicleMode}`
      : undefined;

  const [navigationSession, setNavigationSession] = useState<{
    hasLiveLocation: boolean;
    routeKey: string;
  }>();
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
  // Tracks sign IDs the user has already responded to — local only, no API call.
  const verifiedSignIdsRef = useRef<Set<string>>(new Set());
  const [dismissedVerifySignId, setDismissedVerifySignId] = useState<string>();
  const [isHomeSignFilterOpen, setIsHomeSignFilterOpen] = useState(false);
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
  const navigationError = routeError?.message ?? navigationActionError
    ?? (routeSignsError ? 'Unable to load traffic signs for this route.' : undefined);
  const routeCoordinates = routeResult?.coordinates;
  const routeDistance = routeResult?.distance;
  const routeDuration = routeResult?.duration;
  const routeSteps = routeResult?.steps;
  const baseDuration = routeDuration ?? 0;
  const carDuration = vehicleMode === "DRIVING" ? baseDuration : Math.round(baseDuration * 1.18);
  const bikeDuration = vehicleMode === "BIKE" ? baseDuration : Math.max(60, Math.round(baseDuration * 0.85));
  const activeDuration = vehicleMode === "DRIVING" ? carDuration : bikeDuration;
  const isNavigating = Boolean(
    routeKey && navigationSession?.routeKey === routeKey,
  );

  // Automatically reduce the bottom sheet to peek range (vehicle mode, ETA & distance) when navigating
  useEffect(() => {
    if (isNavigating) {
      snapTo(0);
    }
  }, [isNavigating, snapTo]);

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

  const [selectedSignCategories, setSelectedSignCategories] = useState<Set<SignCategory>>(
    () => new Set(['WARNING', 'MANDATORY', 'PROHIBITORY', 'INFORMATION', 'TEMPORARY'])
  );

  const handleToggleCategory = (category: SignCategory) => {
    setSelectedSignCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleToggleAllCategories = () => {
    setSelectedSignCategories((prev) => {
      if (prev.size === SIGN_CATEGORIES.length) {
        return new Set();
      }
      return new Set(SIGN_CATEGORIES.map((c) => c.id));
    });
  };

  const handleLivestreamPress = useCallback(async () => {
    // Request camera permission
    const cameraResult = await Camera.requestCameraPermissionsAsync();
    if (!cameraResult.granted) return;
    // Request microphone permission
    const micResult = await Camera.requestMicrophonePermissionsAsync();
    if (!micResult.granted) return;
    // Navigate to the dedicated livestream screen
    router.push('/(authenticated)/(tabs)/livestream');
  }, [router]);

  const signCategoryCounts = useMemo(() => {
    const counts: Record<SignCategory, number> = {
      WARNING: 0,
      MANDATORY: 0,
      PROHIBITORY: 0,
      INFORMATION: 0,
      TEMPORARY: 0,
    };
    for (const sign of signsWithSamples) {
      const cat = getSignCategory(sign);
      counts[cat] = (counts[cat] ?? 0) + 1;
    }
    return counts;
  }, [signsWithSamples]);

  const filteredSigns = useMemo(() => {
    return signsWithSamples.filter((sign) => {
      const cat = getSignCategory(sign);
      return selectedSignCategories.has(cat);
    });
  }, [signsWithSamples, selectedSignCategories]);
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
    signs: filteredSigns,
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

  const handleCloseRoute = () => {
    setNavigationSession(undefined);
    router.replace('/home');
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

    // If the user has already chosen an explicit start point, go straight to
    // navigation with that start — do NOT overwrite it with GPS.
    if (routeStart) {
      router.replace({
        pathname: "/home",
        params: {
          destinationId: selectedDestination.id,
          destinationLat: String(selectedDestination.coordinate[1]),
          destinationLng: String(selectedDestination.coordinate[0]),
          destinationSubtitle: selectedDestination.subtitle,
          destinationTitle: selectedDestination.title,
          startLat: String(routeStart[1]),
          startLng: String(routeStart[0]),
          ...(startTitle ? { startTitle } : {}),
          ...(startId ? { startId } : {}),
        },
      });
      return;
    }

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
            startTitle: "Current Location",
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
          routeSigns={filteredSigns}
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

        {isNavigating && activeSignAlert &&
          !verifiedSignIdsRef.current.has(activeSignAlert.sign.id) &&
          activeSignAlert.sign.id !== dismissedVerifySignId ? (
          <NavigationSignVerifyCard
            distanceMeters={activeSignAlert.distanceMeters}
            sign={activeSignAlert.sign}
            onVerify={(sign, _result: SignVerifyResult) => {
              verifiedSignIdsRef.current.add(sign.id);
            }}
            onDismiss={() => {
              setDismissedVerifySignId(activeSignAlert.sign.id);
            }}
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
                <>
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
                  <>
                    <AppButton
                      accessibilityLabel="Live streaming"
                      variant="ghost"
                      onPress={handleLivestreamPress}
                      style={[
                        {
                          backgroundColor: theme.background,
                          boxShadow: '0px 4px 12px 1px #ccc',
                          marginLeft: 'auto',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginTop: Spacing.half,
                        }
                      ]}
                    >
                      <SymbolView
                        name={{
                          android: 'live_tv',
                          ios: 'dot.radiowaves.left.and.right'
                        }}
                        size={24}
                        tintColor='#ff0000'
                      />
                    </AppButton>
                  </>
                </>
              )}
            </View>
            {isHomeSignFilterOpen && !selectedDestination ? (
              <AppButton
                accessibilityLabel="Close sign filter menu"
                onPress={() => setIsHomeSignFilterOpen(false)}
                style={styles.homeFilterBackdrop}
                variant="ghost"
              />
            ) : null}

            {isHomeSignFilterOpen && !selectedDestination ? (
              <View
                style={[
                  styles.homeFilterCard,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={[styles.homeFilterHeader, { borderBottomColor: theme.border }]}>
                  <View style={styles.homeFilterTitleRow}>
                    <MaterialCommunityIcons name="filter-variant" size={16} color={theme.primary} />
                    <Text style={[styles.homeFilterTitle, { color: theme.text }]}>Sign Filters</Text>
                  </View>
                  <AppButton
                    accessibilityLabel="Toggle all sign categories"
                    onPress={handleToggleAllCategories}
                    style={styles.homeFilterToggleAllButton}
                    variant="ghost"
                  >
                    <Text style={[styles.homeFilterToggleAllText, { color: theme.primary }]}>
                      {selectedSignCategories.size === SIGN_CATEGORIES.length ? 'Clear all' : 'Select all'}
                    </Text>
                  </AppButton>
                </View>

                <View style={styles.homeFilterCategoryList}>
                  {SIGN_CATEGORIES.map((cat) => {
                    const isSelected = selectedSignCategories.has(cat.id);
                    const count = signCategoryCounts[cat.id] ?? 0;
                    return (
                      <Pressable
                        key={cat.id}
                        accessibilityLabel={`${cat.label} signs, ${count} on map, ${isSelected ? 'selected' : 'unselected'}`}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isSelected }}
                        onPress={() => handleToggleCategory(cat.id)}
                        style={({ pressed }) => [
                          styles.homeFilterRow,
                          {
                            backgroundColor: isSelected ? theme.backgroundSelected : 'transparent',
                            opacity: pressed ? 0.7 : 1,
                          },
                        ]}
                      >
                        <View style={[styles.homeFilterIconBadge, { backgroundColor: cat.bgColor }]}>
                          <MaterialCommunityIcons name={cat.icon} size={16} color={cat.color} />
                        </View>
                        <Text numberOfLines={1} style={[styles.homeFilterRowLabel, { color: theme.text }]}>
                          {cat.label}
                        </Text>
                        <View
                          style={[
                            styles.homeFilterCheckbox,
                            isSelected
                              ? { backgroundColor: cat.color, borderColor: cat.color }
                              : { backgroundColor: 'transparent', borderColor: theme.border },
                          ]}
                        >
                          {isSelected ? <AntDesign name="check" size={11} color="#FFFFFF" /> : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {!selectedDestination ? (
              <View style={styles.mapActions}>
                {/* 1. Filter signs button (replaced previous my_location button) */}
                <AppButton
                  accessibilityLabel={
                    isHomeSignFilterOpen
                      ? "Close sign filter list"
                      : "Open sign filter list"
                  }
                  onPress={() => setIsHomeSignFilterOpen((prev) => !prev)}
                  style={[
                    styles.mapActionButton,
                    styles.locationActionButton,
                    {
                      backgroundColor: isHomeSignFilterOpen
                        ? theme.backgroundSelected
                        : theme.backgroundElement,
                      borderColor: isHomeSignFilterOpen
                        ? theme.primary
                        : theme.border,
                    },
                  ]}
                  variant="surface"
                >
                  <MaterialCommunityIcons
                    name="filter-variant"
                    size={22}
                    color={isHomeSignFilterOpen ? theme.primary : theme.text}
                  />
                  {selectedSignCategories.size < SIGN_CATEGORIES.length ? (
                    <View
                      style={[
                        styles.filterActiveBadge,
                        { backgroundColor: theme.primary },
                      ]}
                    />
                  ) : null}
                </AppButton>

                {/* 2. Snap to current location button (replaced previous secondary search button) */}
                <AppButton
                  accessibilityLabel={
                    isLocating
                      ? "Getting current location"
                      : "Snap to current location"
                  }
                  disabled={isLocating}
                  onPress={handleCurrentLocation}
                  style={styles.mapActionButton}
                >
                  <SymbolView
                    name={{
                      android: "my_location",
                      ios: "location.fill",
                      web: "my_location",
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
            { height: sheetHeightAnim, paddingBottom: bottomInset },
            { backgroundColor: theme.backgroundElement },
          ]}
        >
          <View
            accessible
            accessibilityRole="button"
            accessibilityLabel={
              sheetSnapIndex === 0
                ? 'Expand route preview'
                : sheetSnapIndex === 1
                  ? 'Expand full sign filter list'
                  : 'Collapse route details'
            }
            accessibilityHint="Drag up or down to adjust bottom sheet height. Tap to toggle."
            accessibilityState={{ expanded: sheetSnapIndex > 0 }}
            accessibilityActions={[{ name: 'activate' }]}
            onAccessibilityAction={() => {
              const nextIndex = ((snapIndexRef.current + 1) % 3) as 0 | 1 | 2;
              snapTo(nextIndex);
            }}
            style={styles.destinationSheetHandleArea}
            {...sheetPanResponder.panHandlers}
          >
            <View style={styles.destinationSheetHandle} />
          </View>
          {routeStart ? (
            /* When starting point and destination have been selected: STRICTLY FOLLOW SCREENSHOT STRUCTURE */
            <View style={styles.routeSheetContainer}>
              {/* Row: Title + ETA + Distance on the left, ONLY the X button on the farmost right */}
              <View style={styles.routeHeaderRow}>
                <Pressable
                  accessibilityHint="Tap to change bottom sheet view"
                  accessibilityLabel="Vehicle mode, duration and distance"
                  accessibilityRole="button"
                  onPress={() => {
                    const nextIndex = ((snapIndexRef.current + 1) % 3) as 0 | 1 | 2;
                    snapTo(nextIndex);
                  }}
                  style={styles.routeHeaderInfo}
                >
                  <Text numberOfLines={1} style={[styles.routeHeaderTitle, { color: theme.text }]}>
                    {vehicleMode === 'BIKE' ? 'Bike' : 'Car'}
                  </Text>
                  {routeDuration !== undefined && routeDistance !== undefined ? (
                    <View style={styles.headerTimeDistanceGroup}>
                      <Text style={[styles.headerDurationText]}>
                        {formatRouteDuration(activeDuration)}
                      </Text>
                      <Text style={[styles.headerDistanceText, { color: theme.textSecondary }]}>
                        {`(${formatRouteDistanceInKilometers(routeDistance)})`}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
                <AppButton
                  accessibilityLabel="Close route preview"
                  onPress={handleCloseRoute}
                  style={[styles.sheetCloseButton, { backgroundColor: theme.backgroundSelected }]}
                  variant="ghost"
                >
                  <AntDesign name="close" size={18} color={theme.text} />
                </AppButton>
              </View>

              {/* Vehicle picker: display two types of vehicles which is car and bike only (also displayed at peek range) */}
              <View style={[styles.vehicleTabsRow, { borderBottomColor: theme.border }]}>
                <AppButton
                  accessibilityLabel="Car route"
                  onPress={() => setVehicleMode('DRIVING')}
                  style={[
                    styles.vehicleTabButton,
                    vehicleMode === 'DRIVING' && styles.vehicleTabButtonActive,
                  ]}
                  variant="ghost"
                >
                  <MaterialCommunityIcons
                    name="car"
                    size={24}
                    color={vehicleMode === 'DRIVING' ? theme.primary : theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.vehicleTabDurationText,
                      { color: vehicleMode === 'DRIVING' ? theme.primary : theme.textSecondary },
                    ]}
                  >
                    {routeDuration !== undefined ? formatRouteDuration(carDuration) : '--'}
                  </Text>
                  {vehicleMode === 'DRIVING' ? (
                    <View style={[styles.vehicleTabActiveLine, { backgroundColor: theme.primary }]} />
                  ) : null}
                </AppButton>

                <AppButton
                  accessibilityLabel="Bike route"
                  onPress={() => setVehicleMode('BIKE')}
                  style={[
                    styles.vehicleTabButton,
                    vehicleMode === 'BIKE' && styles.vehicleTabButtonActive,
                  ]}
                  variant="ghost"
                >
                  <MaterialCommunityIcons
                    name="motorbike"
                    size={24}
                    color={vehicleMode === 'BIKE' ? theme.primary : theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.vehicleTabDurationText,
                      { color: vehicleMode === 'BIKE' ? theme.primary : theme.textSecondary },
                    ]}
                  >
                    {routeDuration !== undefined ? formatRouteDuration(bikeDuration) : '--'}
                  </Text>
                  {vehicleMode === 'BIKE' ? (
                    <View style={[styles.vehicleTabActiveLine, { backgroundColor: theme.primary }]} />
                  ) : null}
                </AppButton>
              </View>

              {navigationError ? (
                <Text accessibilityRole="alert" style={styles.navigationError}>
                  {navigationError}
                </Text>
              ) : null}

              {/* Lower content: map sign filters and Go button are hidden in peek mode */}
              <Animated.View
                pointerEvents={sheetSnapIndex === 0 ? 'none' : 'auto'}
                style={[
                  styles.routeSheetExpandableContent,
                  { opacity: expandableContentOpacity },
                ]}
              >
                {/* Divider between vehicle tabs and sign filter */}
                <View style={[styles.sectionDivider, { backgroundColor: theme.border }]} />
                {/* Sign filter section: filter by WARNING, MANDATORY, PROHIBITORY, INFORMATION, TEMPORARY */}
                <View style={styles.signFilterHeader}>
                  <View style={styles.signFilterTitleGroup}>
                    <MaterialCommunityIcons name="filter-variant" size={18} color={theme.primary} />
                    <Text style={[styles.signFilterTitle, { color: theme.text }]}>
                      Filter
                    </Text>
                    <View style={[styles.signFilterTotalBadge, { backgroundColor: theme.backgroundSelected }]}>
                      <Text style={[styles.signFilterTotalText, { color: theme.primary }]}>
                        {filteredSigns.length}/{signsWithSamples.length}
                      </Text>
                    </View>
                  </View>
                  <AppButton
                    accessibilityLabel="Toggle all sign categories"
                    onPress={handleToggleAllCategories}
                    style={styles.toggleAllButton}
                    variant="ghost"
                  >
                    <Text style={[styles.toggleAllText, { color: theme.primary }]}>
                      {selectedSignCategories.size === SIGN_CATEGORIES.length ? 'Clear all' : 'Select all'}
                    </Text>
                  </AppButton>
                </View>

                <ScrollView
                  contentContainerStyle={styles.signFilterListContainer}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator
                  style={styles.signFilterScrollView}
                >
                  {SIGN_CATEGORIES.map((cat) => {
                    const isSelected = selectedSignCategories.has(cat.id);
                    const count = signCategoryCounts[cat.id] ?? 0;
                    return (
                      <Pressable
                        key={cat.id}
                        accessibilityLabel={`${cat.label} signs filter, ${count} signs on map, ${isSelected ? 'enabled' : 'disabled'}`}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isSelected }}
                        onPress={() => handleToggleCategory(cat.id)}
                        style={({ pressed }) => [
                          styles.signFilterCard,
                          {
                            backgroundColor: isSelected
                              ? theme.backgroundSelected
                              : theme.backgroundElement,
                            borderColor: isSelected ? cat.color : theme.border,
                            opacity: pressed ? 0.75 : 1,
                          },
                        ]}
                      >
                        <View style={[styles.signCatIconBadge, { backgroundColor: cat.bgColor }]}>
                          <MaterialCommunityIcons name={cat.icon} size={22} color={cat.color} />
                        </View>
                        <View style={styles.signCatInfo}>
                          <View style={styles.signCatTitleRow}>
                            <Text style={[styles.signCatLabel, { color: theme.text }]}>
                              {cat.label}
                            </Text>
                            <View
                              style={[
                                styles.signCountBadge,
                                { backgroundColor: isSelected ? cat.color : theme.border },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.signCountText,
                                  { color: isSelected ? '#FFFFFF' : theme.textSecondary },
                                ]}
                              >
                                {count}
                              </Text>
                            </View>
                          </View>
                          <Text numberOfLines={1} style={[styles.signCatSublabel, { color: theme.textSecondary }]}>
                            {cat.sublabel}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.signCatCheckbox,
                            isSelected
                              ? { backgroundColor: cat.color, borderColor: cat.color }
                              : { backgroundColor: 'transparent', borderColor: theme.border },
                          ]}
                        >
                          {isSelected ? (
                            <AntDesign name="check" size={14} color="#FFFFFF" />
                          ) : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </Animated.View>

              {/* Start button placed strictly at the bottom of the bottom sheet (visible in all snap ranges) */}
              <View style={styles.sheetBottomButtonRow}>
                <AppButton
                  accessibilityLabel={
                    isNavigating
                      ? "Navigation active"
                      : isStartingNavigation
                        ? "Starting navigation"
                        : "Begin navigation"
                  }
                  disabled={isNavigating || isStartingNavigation}
                  onPress={handleBeginNavigation}
                  style={styles.bottomGoButton}
                >
                  <Text style={[styles.goButtonLabel, { color: theme.onPrimary }]}>
                    {isNavigating
                      ? "Navigating..."
                      : isStartingNavigation
                        ? "Starting..."
                        : "Start"}
                  </Text>
                </AppButton>
              </View>
            </View>
          ) : (
            /* Destination selected, no start selected yet */
            <>
              <Text
                numberOfLines={1}
                style={[styles.destinationTitle, styles.selectedPlaceTitle, { color: theme.text }]}
              >
                {selectedDestination.title}
              </Text>
              {selectedDestination.subtitle ? (
                <Text style={[styles.selectedPlaceDescription, { color: theme.textSecondary }]}>
                  {selectedDestination.subtitle}
                </Text>
              ) : null}
              {navigationError ? (
                <Text accessibilityRole="alert" style={styles.navigationError}>
                  {navigationError}
                </Text>
              ) : null}
              <View style={styles.destinationActions}>
                <AppButton
                  accessibilityLabel="Start route"
                  disabled={isStartingNavigation}
                  label={isStartingNavigation ? "Starting..." : "Start route"}
                  onPress={handleGo}
                  style={[styles.goButton, styles.destinationActionButton]}
                />
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
              </View>
            </>
          )}
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
    minHeight: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingTop: 8,
    marginBottom: 4,
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
  filterActiveBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  homeFilterBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "transparent",
  },
  homeFilterCard: {
    position: "absolute",
    right: Spacing.four,
    bottom: 124,
    width: 260,
    borderRadius: Rounded.lg,
    borderWidth: 1,
    padding: Spacing.two,
    shadowColor: "#09233C",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
  homeFilterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: Spacing.one,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.one,
  },
  homeFilterTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.half,
  },
  homeFilterTitle: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: "800",
  },
  homeFilterToggleAllButton: {
    minHeight: 24,
    paddingHorizontal: Spacing.one,
    paddingVertical: 0,
  },
  homeFilterToggleAllText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: "700",
  },
  homeFilterCategoryList: {
    gap: 4,
  },
  homeFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: Rounded.md,
    gap: Spacing.one,
  },
  homeFilterIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  homeFilterRowLabel: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: "700",
  },
  homeFilterCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Rounded.round,
    minWidth: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  homeFilterCountText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: "800",
  },
  homeFilterCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
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
    paddingTop: 0,
    paddingBottom: Spacing.two,
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
    fontSize: 16,
    fontWeight: 700,
    lineHeight: 22,
  },
  directionDistance: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 18,
  },
  directionsStatus: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 20,
  },
  goButton: {
    flex: 1,
    alignSelf: "stretch",
    borderRadius: Rounded.round,
  },
  routeSheetContainer: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  routeSheetExpandableContent: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  routeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.half,
  },
  routeHeaderTitle: {
    fontFamily: Fonts.body,
    fontSize: 22,
    fontWeight: '800',
  },
  routeHeaderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.one,
    flexWrap: 'wrap',
  },
  headerTimeDistanceGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.half,
    marginLeft: Spacing.one,
  },
  headerDurationText: {
    fontFamily: Fonts.body,
    fontSize: 22,
    fontWeight: '900',
  },
  headerDistanceText: {
    fontFamily: Fonts.body,
    fontSize: 16,
    fontWeight: '700',
  },
  sheetCloseButton: {
    width: 36,
    height: 36,
    minHeight: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
    marginLeft: Spacing.two,
  },
  vehicleTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.two,
  },
  vehicleTabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.one,
    minHeight: 46,
    position: 'relative',
    borderRadius: 0,
  },
  vehicleTabButtonActive: {},
  vehicleTabDurationText: {
    fontFamily: Fonts.body,
    fontSize: 17,
    fontWeight: '700',
  },
  vehicleTabActiveLine: {
    position: 'absolute',
    bottom: -StyleSheet.hairlineWidth,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.two,
  },
  signFilterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.one,
  },
  signFilterTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  signFilterTitle: {
    fontFamily: Fonts.body,
    fontSize: 16,
    fontWeight: '800',
  },
  signFilterTotalBadge: {
    paddingHorizontal: Spacing.one,
    paddingVertical: 2,
    borderRadius: Rounded.round,
    marginLeft: Spacing.half,
  },
  signFilterTotalText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '800',
  },
  toggleAllButton: {
    minHeight: 32,
    paddingHorizontal: Spacing.one,
    paddingVertical: 2,
  },
  toggleAllText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '700',
  },
  signFilterScrollView: {
    flex: 1,
    minHeight: 0,
  },
  signFilterListContainer: {
    gap: Spacing.two,
    paddingVertical: Spacing.half,
    paddingRight: Spacing.half,
  },
  signFilterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Rounded.lg,
    borderWidth: 1.5,
    minHeight: 58,
    gap: Spacing.two,
  },
  signCatIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signCatInfo: {
    flex: 1,
    minWidth: 0,
  },
  signCatTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  signCatLabel: {
    fontFamily: Fonts.body,
    fontSize: 15,
    fontWeight: '800',
  },
  signCatSublabel: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '500',
  },
  signCountBadge: {
    paddingHorizontal: Spacing.one,
    paddingVertical: 1,
    borderRadius: Rounded.round,
    minWidth: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signCountText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '800',
  },
  signCatCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBottomButtonRow: {
    paddingTop: Spacing.two,
    marginTop: 'auto',
  },
  bottomGoButton: {
    alignSelf: 'stretch',
    minHeight: 52,
    borderRadius: Rounded.round,
  },
  goButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  goButtonLabel: {
    fontFamily: Fonts.body,
    fontSize: 18,
    fontWeight: '800',
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
