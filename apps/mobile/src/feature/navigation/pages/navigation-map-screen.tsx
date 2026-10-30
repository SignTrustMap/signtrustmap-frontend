import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Camera } from "expo-camera";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SymbolView } from "expo-symbols";
import { AppButton } from "@/components/button";
import { AppToast } from "@/components/toast";
import { NavigationManeuverBanner } from "@/components/navigation-maneuver-banner";
import {
  NavigationSignVerifyCard,
  type SignVerifyResult,
} from "@/components/navigation-sign-verify-card";
import { Spacing } from "@/constants/theme";
import type { MapCoordinate, VehicleMode } from "@/types/navigationType";
import { useTheme } from "@/hooks/use-theme";
import { useOptionalSession } from "@/context/session-provider";
import { useNavigationActive } from "@/context/navigation-active-provider";
import { useSignFilter, type SignFilterPreset } from "@/context/sign-filter-provider";
import {
  useGetSavedRoute,
  useGetSavedRouteSigns,
} from "@/feature/saved-routes/hooks/use-saved-routes";
import { NavigationMapView } from "../components/navigation-map-view";
import {
  getNavigationRoute,
  type NavigationStep,
  type RouteSign,
} from "@/api/navigation/navigation";
import { resolveLocation, formatResolvedLocationTitle } from "@/api/spatial/spatial";
import { useGetNavigationRoute } from "../hooks/use-navigation";
import { useGetSignsAlongRoute, useGetSignsInBounds } from "../hooks/use-signs";
import { confirmSignPresence } from "@/api/sign-map/sign-map";
import { useSignProximityAlert } from "../hooks/use-sign-proximity-alert";
import { speechService } from "@/services/speech";
import { getStorageItemAsync, setStorageItemAsync } from "@/hooks/use-storage";
import type { FindSignsInBoundsParams } from "@/types/signMapType";
import { getRouteProgressMeters } from "../utils/route-progress";
import { resolveImageUrl, TARGET_SIGN_IMAGE_URL } from "../utils/signs";
import { applyDemoRouteSigns } from "../utils/demo-route-signs";
import { getMapLibre } from "@/services/maplibre";
import { useGetWallet } from "@/feature/credits/hooks/use-wallet";
import { useGetUnreadNotificationCount } from "@/feature/notifications/hooks/use-notifications";
import {
  ensureLocationPermission,
  fetchFreshGpsPosition,
} from "../utils/gps";
import {
  ALLOW_LOCATION_ACCESS_MESSAGE,
  GPS_NATIVE_BUILD_REQUIRED_MESSAGE,
  GPS_UNAVAILABLE_MESSAGE,
  LOCATION_PERMISSION_REQUIRED_NAVIGATION_MESSAGE,
  ROUTE_LOADING_MESSAGE,
  UNABLE_TO_GET_CURRENT_LOCATION_MESSAGE,
  UNABLE_TO_LOAD_SIGNS_FOR_ROUTE_MESSAGE,
  UNABLE_TO_LOAD_SIGNS_MESSAGE,
} from "@/constants/message";
import {
  SIGN_CATEGORIES,
  type SignCategory,
  getSignCategory,
} from "@/constants/sign-categories";

import {
  formatManeuverDistance,
  formatRouteInstruction,
  getManeuverSymbol,
} from "../utils/navigation-formatters";
import { styles } from "../styles/navigation-map-screen.styles";
import { BookmarkRouteModal } from "../components/bookmark-route-modal";
import { NavigationUpcomingSigns, type UpcomingSignItem } from "../components/navigation-upcoming-signs";
import { HomeSignFilterCard } from "../components/home-sign-filter-card";
import { NavigationTopControls } from "../components/navigation-top-controls";
import { NavigationBottomSheet } from "../components/navigation-bottom-sheet";
import { useNativeGps } from "../hooks/use-native-gps";
import { useAutoReroute } from "../hooks/use-auto-reroute";
import { useNavigationSheetGesture } from "../hooks/use-navigation-sheet-gesture";

export { SIGN_CATEGORIES, type SignCategory, getSignCategory };

export function NavigationMapScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(Spacing.two, insets.bottom - Spacing.two);

  const { setNavigationActive } = useNavigationActive();
  const {
    destinationId,
    destinationLat,
    destinationLng,
    destinationSubtitle,
    destinationTitle,
    savedRouteId: paramSavedRouteId,
    startId,
    startLat,
    startLng,
    startTitle,
    vehicleMode: paramVehicleMode,
  } = useLocalSearchParams<{
    destinationId?: string;
    destinationLat?: string;
    destinationLng?: string;
    destinationSubtitle?: string;
    destinationTitle?: string;
    savedRouteId?: string;
    startId?: string;
    startLat?: string;
    startLng?: string;
    startTitle?: string;
    vehicleMode?: string;
  }>();

  const [activeSavedRouteId, setActiveSavedRouteId] = useState<string | undefined>(
    paramSavedRouteId,
  );

  useEffect(() => {
    if (paramSavedRouteId) {
      setActiveSavedRouteId(paramSavedRouteId);
    }
  }, [paramSavedRouteId]);

  const { data: savedRouteData } = useGetSavedRoute(activeSavedRouteId);
  const { data: savedRouteSignsData } = useGetSavedRouteSigns(activeSavedRouteId);
  const { data: walletData } = useGetWallet();
  const { data: unreadNotificationCount = 0 } = useGetUnreadNotificationCount();

  const selectedDestination = useMemo(() => {
    if (destinationLat && destinationLng) {
      return {
        category: "recent" as const,
        coordinate: [Number(destinationLng), Number(destinationLat)] as MapCoordinate,
        id: destinationId || "destination",
        subtitle: destinationSubtitle ?? "",
        title: destinationTitle ?? "Điểm đến",
      };
    }
    if (savedRouteData) {
      return {
        category: "saved" as const,
        coordinate: [
          savedRouteData.destinationLongitude,
          savedRouteData.destinationLatitude,
        ] as MapCoordinate,
        id: savedRouteData.id,
        subtitle: savedRouteData.destinationName,
        title: savedRouteData.title || savedRouteData.destinationName,
      };
    }
    return undefined;
  }, [
    destinationId,
    destinationLat,
    destinationLng,
    destinationSubtitle,
    destinationTitle,
    savedRouteData,
  ]);

  const isCustomStart = false;
  const customStartCoordinate = undefined;
  const fallbackCurrentLocation = useMemo(
    () =>
      startLng && startLat
        ? ([Number(startLng), Number(startLat)] as MapCoordinate)
        : undefined,
    [startLat, startLng],
  );

  const { userCoordinate, setUserCoordinate, startGpsListening } =
    useNativeGps(fallbackCurrentLocation);

  const [initialGpsOrigin, setInitialGpsOrigin] = useState<MapCoordinate | undefined>(
    fallbackCurrentLocation,
  );

  useEffect(() => {
    if (fallbackCurrentLocation) {
      setInitialGpsOrigin(fallbackCurrentLocation);
    }
    if (selectedDestination) {
      setMapFocus(undefined);
    }
  }, [
    destinationId,
    destinationLat,
    destinationLng,
    fallbackCurrentLocation,
    selectedDestination,
  ]);

  const hasCenteredInitialMapRef = useRef(false);
  useEffect(() => {
    if (selectedDestination || hasCenteredInitialMapRef.current) return;
    if (userCoordinate) {
      hasCenteredInitialMapRef.current = true;
      setMapFocus({
        coordinate: userCoordinate,
        requestId: Date.now(),
      });
    }
  }, [selectedDestination, userCoordinate]);

  const [resolvedOriginTitle, setResolvedOriginTitle] = useState<string>();

  const plannedRouteOrigin =
    savedRouteData && !fallbackCurrentLocation
      ? ([savedRouteData.originLongitude, savedRouteData.originLatitude] as MapCoordinate)
      : (fallbackCurrentLocation ?? initialGpsOrigin);

  const routeStartTitle =
    startTitle ||
    (savedRouteData && !fallbackCurrentLocation
      ? savedRouteData.originName
      : (resolvedOriginTitle ?? "Vị trí của bạn"));


  const [vehicleMode, setVehicleMode] = useState<VehicleMode["id"]>(() => {
    if (paramVehicleMode) {
      const mode = paramVehicleMode.toUpperCase();
      if (mode === "CAR" || mode === "DRIVING") return "DRIVING";
      if (mode === "CYCLING" || mode === "BICYCLE") return "CYCLING";
      if (mode === "WALKING" || mode === "PEDESTRIAN") return "WALKING";
      if (mode === "BIKE" || mode === "MOTORCYCLE") return "BIKE";
    }
    return "DRIVING";
  });

  useEffect(() => {
    if (paramVehicleMode) {
      const mode = paramVehicleMode.toUpperCase();
      if (mode === "CAR" || mode === "DRIVING") setVehicleMode("DRIVING");
      else if (mode === "CYCLING" || mode === "BICYCLE") setVehicleMode("CYCLING");
      else if (mode === "WALKING" || mode === "PEDESTRIAN") setVehicleMode("WALKING");
      else if (mode === "BIKE" || mode === "MOTORCYCLE") setVehicleMode("BIKE");
    }
  }, [paramVehicleMode]);
  const isMotorcycleMode = vehicleMode === "MOTORCYCLE" || vehicleMode === "BIKE";
  const session = useOptionalSession()?.session;

  useEffect(() => {
    if (isCustomStart || startTitle || savedRouteData || !plannedRouteOrigin) {
      return;
    }

    let isMounted = true;
    const [lon, lat] = plannedRouteOrigin;

    void (async () => {
      try {
        const resolved = await resolveLocation(lat, lon, session?.accessToken);
        const title = formatResolvedLocationTitle(resolved);
        if (isMounted && title) {
          setResolvedOriginTitle(title);
        }
      } catch {
        // keep fallback
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isCustomStart, startTitle, savedRouteData, plannedRouteOrigin, session?.accessToken]);

  const [navigationSession, setNavigationSession] = useState<{
    hasLiveLocation: boolean;
    destinationId: string;
    vehicleMode: string;
  }>();

  const isNavigating = Boolean(
    navigationSession &&
      selectedDestination &&
      navigationSession.destinationId === selectedDestination.id,
  );

  useEffect(() => {
    if (
      initialGpsOrigin &&
      !isNavigating &&
      !isCustomStart &&
      !fallbackCurrentLocation &&
      userCoordinate
    ) {
      setInitialGpsOrigin(userCoordinate);
    }
  }, [
    initialGpsOrigin,
    isNavigating,
    isCustomStart,
    fallbackCurrentLocation,
    userCoordinate,
  ]);

  const routeKey =
    selectedDestination && plannedRouteOrigin
      ? `${plannedRouteOrigin[0]},${plannedRouteOrigin[1]}:${selectedDestination.coordinate[0]},${selectedDestination.coordinate[1]}:${vehicleMode}`
      : undefined;

  const {
    sheetSnapIndex,
    snapTo,
    cycleSnap,
    sheetHeightAnim,
    sheetPanResponder,
    expandableContentOpacity,
  } = useNavigationSheetGesture({
    hasPlannedRouteOrigin: Boolean(plannedRouteOrigin),
    isNavigating,
    destinationId: selectedDestination?.id,
    windowHeight,
    bottomInset,
  });

  const [isStartingNavigation, setIsStartingNavigation] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationToast, setLocationToast] = useState<{
    id: number;
    message: string;
  }>();
  const handleDismissToast = useCallback(() => {
    setLocationToast(undefined);
  }, []);

  const [mapFocus, setMapFocus] = useState<{
    coordinate: MapCoordinate;
    requestId: number;
  }>();
  const [navigationActionError, setNavigationError] = useState<string>();

  const [isHomeSignFilterOpen, setIsHomeSignFilterOpen] = useState(false);
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getStorageItemAsync("signtrust_tts_enabled")
      .then((val) => {
        if (isMounted && val !== null) {
          const enabled = val === "true";
          setIsTtsEnabled(enabled);
          speechService.setEnabled(enabled);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleTts = useCallback(() => {
    setIsTtsEnabled((prev) => {
      const next = !prev;
      speechService.setEnabled(next);
      void setStorageItemAsync("signtrust_tts_enabled", String(next)).catch(() => {});
      setLocationToast({
        id: Date.now(),
        message: next ? "Đã bật thông báo giọng nói" : "Đã tắt thông báo giọng nói",
      });
      return next;
    });
  }, []);

  const [selectedMapSign, setSelectedMapSign] = useState<RouteSign | null>(null);

  // Quad query: Fetch Car, Motorcycle, Bicycle, and Walking directions in parallel
  const [rerouteOrigin, setRerouteOrigin] = useState<MapCoordinate>();
  const activeRouteOrigin = rerouteOrigin ?? plannedRouteOrigin;

  const {
    data: carRouteResult,
    isLoading: isCarRouteLoading,
    error: carRouteError,
  } = useGetNavigationRoute(
    activeRouteOrigin,
    selectedDestination?.coordinate,
    "DRIVING",
  );

  const {
    data: motorcycleRouteResult,
    isLoading: isMotorcycleRouteLoading,
    error: motorcycleRouteError,
  } = useGetNavigationRoute(
    activeRouteOrigin,
    selectedDestination?.coordinate,
    "BIKE",
  );

  const {
    data: cyclingRouteResult,
    isLoading: isCyclingRouteLoading,
    error: cyclingRouteError,
  } = useGetNavigationRoute(
    activeRouteOrigin,
    selectedDestination?.coordinate,
    "CYCLING",
  );

  const {
    data: walkingRouteResult,
    isLoading: isWalkingRouteLoading,
    error: walkingRouteError,
  } = useGetNavigationRoute(
    activeRouteOrigin,
    selectedDestination?.coordinate,
    "WALKING",
  );

  const carDuration = carRouteResult?.duration;
  const motorcycleDuration = motorcycleRouteResult?.duration;
  const cyclingDuration = cyclingRouteResult?.duration;
  const walkingDuration = walkingRouteResult?.duration;

  const activeRouteResult =
    vehicleMode === "CYCLING"
      ? cyclingRouteResult
      : vehicleMode === "WALKING"
        ? walkingRouteResult
        : isMotorcycleMode
          ? motorcycleRouteResult
          : carRouteResult;

  const activeRouteError =
    vehicleMode === "CYCLING"
      ? cyclingRouteError
      : vehicleMode === "WALKING"
        ? walkingRouteError
        : isMotorcycleMode
          ? motorcycleRouteError
          : carRouteError;

  const [mapBounds, setMapBounds] = useState<FindSignsInBoundsParams>();
  const hasSelectedRoute = Boolean(plannedRouteOrigin && selectedDestination);
  const { data: mapSigns = [], error: boundsSignsError } = useGetSignsInBounds(
    mapBounds,
    !hasSelectedRoute,
  );
  const { data: plannedSigns = [], error: routeSignsError } = useGetSignsAlongRoute(
    activeRouteOrigin,
    selectedDestination?.coordinate,
    activeRouteResult?.geometry,
    vehicleMode,
  );

  const navigationError =
    activeRouteError?.message ??
    navigationActionError ??
    (routeSignsError ? UNABLE_TO_LOAD_SIGNS_FOR_ROUTE_MESSAGE : undefined);

  const routeCoordinates = activeRouteResult?.coordinates;

  const { resetReroute } = useAutoReroute({
    isNavigating,
    isCustomStart,
    hasLiveLocation: Boolean(isNavigating && navigationSession?.hasLiveLocation),
    userCoordinate,
    routeCoordinates,
    destinationId: selectedDestination?.id,
    onRerouteTriggered: (newOrigin) => {
      setRerouteOrigin(newOrigin);
    },
    onRerouteApplied: (newOrigin) => {
      setRerouteOrigin(undefined);
      setInitialGpsOrigin(newOrigin);
    },
    onClearNavigationError: () => setNavigationError(undefined),
  });

  const routeDistance = activeRouteResult?.distance;
  const routeDuration = activeRouteResult?.duration;
  const routeSteps = activeRouteResult?.steps;
  const activeDuration = routeDuration ?? 0;

  useEffect(() => {
    if (activeRouteResult?.coordinates?.length) {
      setNavigationError(undefined);
    }
  }, [activeRouteResult?.coordinates]);

  useEffect(() => {
    setNavigationActive(isNavigating);
    return () => setNavigationActive(false);
  }, [isNavigating, setNavigationActive]);

  useEffect(() => {
    if (isNavigating) {
      setFilterViewMode("categories");
      snapTo(0);
    }
  }, [isNavigating, snapTo]);

  useEffect(() => {
    if (selectedDestination) {
      setSelectedMapSign(null);
    }
  }, [selectedDestination]);

  const hasLiveLocation = Boolean(isNavigating && navigationSession?.hasLiveLocation);

  const visibleSigns = useMemo(() => {
    const corridorSigns = savedRouteSignsData?.signs;
    const rawSigns =
      corridorSigns && corridorSigns.length > 0
        ? corridorSigns
        : hasSelectedRoute
          ? plannedSigns
          : mapSigns;
    const resolvedSigns = rawSigns.map((sign) => ({
      ...sign,
      imageUrl:
        sign.imageUrl && !sign.imageUrl.includes("mock/")
          ? resolveImageUrl(sign.imageUrl)
          : TARGET_SIGN_IMAGE_URL,
    }));
    return applyDemoRouteSigns(
      resolvedSigns,
      activeRouteOrigin,
      selectedDestination?.coordinate,
      vehicleMode,
    );
  }, [
    hasSelectedRoute,
    mapSigns,
    plannedSigns,
    savedRouteSignsData?.signs,
    activeRouteOrigin,
    selectedDestination?.coordinate,
    vehicleMode,
  ]);

  const {
    activeCategories,
    activePreset,
    activePresetId,
    presets,
    refetchPresets,
    setActivePresetId,
  } = useSignFilter();

  useEffect(() => {
    if (savedRouteData && !isNavigating) {
      const modeUpper = savedRouteData.vehicleMode?.toUpperCase();
      if (modeUpper === "CYCLING" || modeUpper === "BICYCLE") {
        setVehicleMode("CYCLING");
      } else if (modeUpper === "WALKING" || modeUpper === "PEDESTRIAN") {
        setVehicleMode("WALKING");
      } else if (modeUpper === "MOTORCYCLE" || modeUpper === "BIKE") {
        setVehicleMode("MOTORCYCLE");
      } else {
        setVehicleMode("DRIVING");
      }
      void setActivePresetId(savedRouteData.id);
      snapTo(1);
    }
  }, [savedRouteData, isNavigating, setActivePresetId, snapTo]);

  const [filterViewMode, setFilterViewMode] = useState<"lists" | "categories">("lists");
  const [manualCategories, setManualCategories] = useState<Set<SignCategory>>(
    () => new Set(["WARNING", "MANDATORY", "PROHIBITORY", "INFORMATION", "TEMPORARY"]),
  );

  const handleToggleFilterViewMode = useCallback(() => {
    setFilterViewMode((current) => {
      const next = current === "lists" ? "categories" : "lists";
      if (next === "categories") {
        if (activeCategories && activeCategories.size > 0) {
          setManualCategories(new Set(activeCategories));
        } else {
          setManualCategories(new Set(SIGN_CATEGORIES.map((c) => c.id)));
        }
      }
      return next;
    });
  }, [activeCategories]);

  const handleToggleManualCategory = useCallback((category: SignCategory) => {
    setManualCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const handleSelectPreset = useCallback(
    (id: string | null) => {
      setFilterViewMode("lists");
      void setActivePresetId(id);
      if (id) {
        const found = presets.find((p) => p.id === id);
        if (found?.savedRoute) {
          setActiveSavedRouteId(found.savedRoute.id);
        }
      } else {
        setActiveSavedRouteId(undefined);
      }
    },
    [presets, setActivePresetId],
  );

  const isPresetMatchingCurrentRoute = useCallback(
    (preset: SignFilterPreset): boolean => {
      if (!plannedRouteOrigin || !selectedDestination) return false;

      if (
        activeSavedRouteId &&
        (preset.id === activeSavedRouteId || preset.savedRoute?.id === activeSavedRouteId)
      ) {
        return true;
      }
      if (
        savedRouteData?.id &&
        (preset.id === savedRouteData.id || preset.savedRoute?.id === savedRouteData.id)
      ) {
        return true;
      }

      const sr = preset.savedRoute;
      if (!sr) return false;

      const [currOriginLng, currOriginLat] = plannedRouteOrigin;
      const [currDestLng, currDestLat] = selectedDestination.coordinate;

      const originDiff =
        Math.abs(sr.originLatitude - currOriginLat) +
        Math.abs(sr.originLongitude - currOriginLng);
      const destDiff =
        Math.abs(sr.destinationLatitude - currDestLat) +
        Math.abs(sr.destinationLongitude - currDestLng);

      if (originDiff < 0.003 && destDiff < 0.003) {
        return true;
      }

      const norm = (s?: string) =>
        (s || "")
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[,\-–—.]/g, " ")
          .replace(/\s+/g, " ");

      const srOrigin = norm(sr.originName);
      const srDest = norm(sr.destinationName);
      const currOrigin = norm(routeStartTitle);
      const currDest = norm(selectedDestination.title);

      if (
        srOrigin.length > 2 &&
        srDest.length > 2 &&
        currOrigin.length > 2 &&
        currDest.length > 2 &&
        (srOrigin === currOrigin ||
          currOrigin.includes(srOrigin) ||
          srOrigin.includes(currOrigin)) &&
        (srDest === currDest || currDest.includes(srDest) || srDest.includes(currDest))
      ) {
        return true;
      }

      return false;
    },
    [
      plannedRouteOrigin,
      selectedDestination,
      activeSavedRouteId,
      savedRouteData,
      routeStartTitle,
    ],
  );

  const routeMatchingPresets = useMemo(() => {
    return presets.filter(isPresetMatchingCurrentRoute);
  }, [presets, isPresetMatchingCurrentRoute]);

  useEffect(() => {
    if (activePresetId && plannedRouteOrigin && selectedDestination) {
      const isMatching = routeMatchingPresets.some((p) => p.id === activePresetId);
      if (!isMatching) {
        void setActivePresetId(null);
      }
    }
  }, [
    activePresetId,
    plannedRouteOrigin,
    selectedDestination,
    routeMatchingPresets,
    setActivePresetId,
  ]);

  const handleLivestreamPress = useCallback(async () => {
    const cameraResult = await Camera.requestCameraPermissionsAsync();
    if (!cameraResult.granted) return;
    const micResult = await Camera.requestMicrophonePermissionsAsync();
    if (!micResult.granted) return;
    router.push("/(authenticated)/(tabs)/livestream");
  }, [router]);

  const filteredSigns = useMemo(() => {
    const isCategoriesActive =
      isNavigating ||
      filterViewMode === "categories" ||
      routeMatchingPresets.length === 0;

    if (isCategoriesActive) {
      if (manualCategories.size === SIGN_CATEGORIES.length) {
        return visibleSigns;
      }
      return visibleSigns.filter((sign) => {
        const cat = getSignCategory(sign);
        return manualCategories.has(cat);
      });
    }

    if (!activeCategories || activePresetId === null) {
      return visibleSigns;
    }
    return visibleSigns.filter((sign) => {
      const cat = getSignCategory(sign);
      return activeCategories.has(cat);
    });
  }, [
    isNavigating,
    filterViewMode,
    routeMatchingPresets.length,
    manualCategories,
    visibleSigns,
    activeCategories,
    activePresetId,
  ]);

  const isRouteBookmarked = Boolean(
    activeSavedRouteId ||
      (activePreset?.savedRoute &&
        selectedDestination &&
        activePreset.savedRoute.destinationLatitude === selectedDestination.coordinate[1] &&
        activePreset.savedRoute.destinationLongitude === selectedDestination.coordinate[0]),
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
    const navigationCoordinate = userCoordinate ?? plannedRouteOrigin;

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
    plannedRouteOrigin,
    routeSteps,
    userCoordinate,
  ]);

  const currentRouteProgress = useMemo(() => {
    const navigationCoordinate = userCoordinate ?? plannedRouteOrigin;
    if (!isNavigating || !navigationCoordinate || !routeCoordinates?.length) {
      return 0;
    }
    return getRouteProgressMeters(navigationCoordinate, routeCoordinates);
  }, [isNavigating, userCoordinate, plannedRouteOrigin, routeCoordinates]);

  const remainingNavDistance = useMemo(() => {
    if (routeDistance === undefined) return undefined;
    if (!isNavigating) return routeDistance;
    return Math.max(0, routeDistance - currentRouteProgress);
  }, [routeDistance, isNavigating, currentRouteProgress]);

  const remainingNavDuration = useMemo(() => {
    if (activeDuration === undefined || routeDistance === undefined) return activeDuration;
    if (!isNavigating || routeDistance === 0) return activeDuration;
    const fraction = Math.max(0, (remainingNavDistance ?? routeDistance) / routeDistance);
    return Math.max(0, Math.round(activeDuration * fraction));
  }, [activeDuration, routeDistance, isNavigating, remainingNavDistance]);

  const { activeAlert: activeSignAlert } = useSignProximityAlert({
    alertDistanceMeters: 50,
    isNavigating,
    signs: filteredSigns,
    userCoordinate: userCoordinate ?? plannedRouteOrigin,
    speechLanguage: "vi-VN",
    ttsEnabled: isTtsEnabled,
  });

  const upcomingSignsOnRoute: UpcomingSignItem[] = useMemo(() => {
    if (!isNavigating || !routeCoordinates || filteredSigns.length === 0) return [];
    const navigationCoordinate = userCoordinate ?? plannedRouteOrigin;
    if (!navigationCoordinate) return [];
    const userProgress = getRouteProgressMeters(navigationCoordinate, routeCoordinates);
    const signsAhead = filteredSigns
      .filter((sign) => sign.coordinate)
      .map((sign) => {
        const signProgress = getRouteProgressMeters(
          sign.coordinate as [number, number],
          routeCoordinates,
        );
        const distanceMeters = Math.max(0, signProgress - userProgress);
        return { ...sign, distanceMeters };
      })
      .filter((sign) => sign.distanceMeters > 5)
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, 3)
      .reverse();
    return signsAhead;
  }, [isNavigating, routeCoordinates, filteredSigns, userCoordinate, plannedRouteOrigin]);

  const verifiedSignIdsRef = useRef<Set<string>>(new Set());
  const [dismissedVerifySignId, setDismissedVerifySignId] = useState<string>();

  const handleSwitchVehicleMode = useCallback(
    (newMode: VehicleMode["id"]) => {
      setVehicleMode(newMode);
      setNavigationSession((prev) =>
        prev ? { ...prev, vehicleMode: newMode } : undefined,
      );
    },
    [],
  );

  const handleBeginNavigation = async () => {
    if (
      Platform.OS === "web" ||
      !selectedDestination ||
      !plannedRouteOrigin ||
      !routeKey
    )
      return;

    let coords = routeCoordinates;
    if (!coords?.length) {
      try {
        const fetched = await getNavigationRoute(
          plannedRouteOrigin,
          selectedDestination.coordinate,
          vehicleMode,
        );
        coords = fetched?.coordinates;
      } catch {
        // Handled below
      }
    }

    if (!coords?.length) {
      setNavigationError(ROUTE_LOADING_MESSAGE);
      return;
    }

    setIsStartingNavigation(true);
    setNavigationError(undefined);

    try {
      const hasPermission = await ensureLocationPermission();
      if (!hasPermission) {
        setLocationToast({
          id: Date.now(),
          message: LOCATION_PERMISSION_REQUIRED_NAVIGATION_MESSAGE,
        });
        setNavigationError(LOCATION_PERMISSION_REQUIRED_NAVIGATION_MESSAGE);
        return;
      }

      await startGpsListening();

      if (!isCustomStart) {
        let currentCoord: MapCoordinate | null | undefined = userCoordinate;
        if (!currentCoord) {
          currentCoord = await fetchFreshGpsPosition(3500);
        }

        if (currentCoord) {
          setUserCoordinate(currentCoord);
          setInitialGpsOrigin(currentCoord);
        }
      }

      setNavigationSession({
        hasLiveLocation: true,
        destinationId: selectedDestination.id,
        vehicleMode,
      });
      setFilterViewMode("categories");
      if (activeCategories && activeCategories.size > 0 && activePresetId !== null) {
        setManualCategories(new Set(activeCategories));
      }
    } catch (error) {
      console.error("[GPS] Failed to begin navigation:", error);
      setNavigationError(GPS_UNAVAILABLE_MESSAGE);
    } finally {
      setIsStartingNavigation(false);
    }
  };

  const handleCurrentLocation = async () => {
    if (isLocating) return;
    setIsLocating(true);

    try {
      const mapLibre = getMapLibre();
      if (!mapLibre) {
        throw new Error(GPS_NATIVE_BUILD_REQUIRED_MESSAGE);
      }
      const hasPermission = await ensureLocationPermission();
      if (!hasPermission) {
        throw new Error(ALLOW_LOCATION_ACCESS_MESSAGE);
      }

      await startGpsListening();

      let coordinate: MapCoordinate | null | undefined = userCoordinate;
      if (!coordinate) {
        coordinate = await fetchFreshGpsPosition(3500);
      }

      if (!coordinate) {
        throw new Error(GPS_UNAVAILABLE_MESSAGE);
      }

      setUserCoordinate(coordinate);
      setMapFocus({
        coordinate,
        requestId: Date.now(),
      });
    } catch (error) {
      console.error("[GPS] handleCurrentLocation error:", error);
      setLocationToast((current) => ({
        id: (current?.id ?? 0) + 1,
        message:
          error instanceof Error
            ? error.message
            : UNABLE_TO_GET_CURRENT_LOCATION_MESSAGE,
      }));
    } finally {
      setIsLocating(false);
    }
  };

  const handleCloseRoute = () => {
    setNavigationSession(undefined);
    setActiveSavedRouteId(undefined);
    resetReroute();
    router.replace("/home");
  };

  const handleChangeDestination = () => {
    router.push("/home/search");
  };

  const handleGo = async () => {
    if (!selectedDestination) return;

    if (Platform.OS !== "web") {
      setIsStartingNavigation(true);
      try {
        const hasPermission = await ensureLocationPermission();
        if (!hasPermission) {
          setLocationToast({
            id: Date.now(),
            message: LOCATION_PERMISSION_REQUIRED_NAVIGATION_MESSAGE,
          });
          setNavigationError(LOCATION_PERMISSION_REQUIRED_NAVIGATION_MESSAGE);
          return;
        }

        await startGpsListening();

        let currentPos: MapCoordinate | null | undefined = userCoordinate;
        if (!currentPos) {
          currentPos = await fetchFreshGpsPosition(3500);
        }

        if (currentPos) {
          setUserCoordinate(currentPos);
          setInitialGpsOrigin(currentPos);
          return;
        }

        setLocationToast({
          id: Date.now(),
          message: GPS_UNAVAILABLE_MESSAGE,
        });
        setNavigationError(GPS_UNAVAILABLE_MESSAGE);
      } catch (error) {
        console.error("[GPS] handleGo error:", error);
        setLocationToast({
          id: Date.now(),
          message: GPS_UNAVAILABLE_MESSAGE,
        });
        setNavigationError(GPS_UNAVAILABLE_MESSAGE);
      } finally {
        setIsStartingNavigation(false);
      }
      return;
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={styles.map}>
        <NavigationMapView
          onBoundsChange={setMapBounds}
          destination={selectedDestination}
          focusCoordinate={mapFocus?.coordinate}
          focusRequestId={mapFocus?.requestId}
          navigationActive={Platform.OS !== "web" && isNavigating}
          isNavigatingFeature={isNavigating}
          userCoordinate={userCoordinate}
          hasLiveLocation={hasLiveLocation}
          isCustomStart={isCustomStart}
          routeCoordinates={routeCoordinates}
          routeStart={plannedRouteOrigin}
          routeSigns={filteredSigns}
          signs={filteredSigns}
          showCurrentLocation={!isNavigating}
          onSignSelect={setSelectedMapSign}
          vehicleMode={vehicleMode}
        />

        {!hasSelectedRoute && boundsSignsError ? (
          <AppToast message={UNABLE_TO_LOAD_SIGNS_MESSAGE} />
        ) : null}

        {isNavigating && activeManeuver ? (
          <NavigationManeuverBanner
            distance={formatManeuverDistance(activeManeuver.distance)}
            instruction={formatRouteInstruction(activeManeuver.step)}
            symbol={getManeuverSymbol(activeManeuver.step)}
          />
        ) : null}

        {isNavigating &&
        activeSignAlert &&
        !verifiedSignIdsRef.current.has(activeSignAlert.sign.id) &&
        activeSignAlert.sign.id !== dismissedVerifySignId ? (
          <NavigationSignVerifyCard
            distanceMeters={activeSignAlert.distanceMeters}
            sign={activeSignAlert.sign}
            onVerify={async (sign, result: SignVerifyResult) => {
              verifiedSignIdsRef.current.add(sign.id);
              const isPresent = result === "present";
              try {
                const lat = userCoordinate ? userCoordinate[1] : sign.coordinate[1];
                const lon = userCoordinate ? userCoordinate[0] : sign.coordinate[0];
                await confirmSignPresence(
                  sign.id,
                  {
                    isPresent,
                    latitude: lat,
                    longitude: lon,
                    note: isPresent
                      ? "Tài xế xác nhận biển báo còn tồn tại"
                      : "Tài xế báo cáo biển báo không còn tại hiện trường",
                  },
                  session?.accessToken || "",
                );
                setLocationToast({
                  id: Date.now(),
                  message: isPresent
                    ? "Đã ghi nhận xác nhận biển báo thành công!"
                    : "Đã ghi nhận báo cáo không thấy biển báo!",
                });
              } catch (e: any) {
                console.warn("[Navigation] Confirm sign error:", e?.message);
                setLocationToast({
                  id: Date.now(),
                  message: isPresent
                    ? "Đã ghi nhận xác nhận biển báo thành công!"
                    : "Đã ghi nhận báo cáo không thấy biển báo!",
                });
              }
            }}
            onDismiss={() => {
              setDismissedVerifySignId(activeSignAlert.sign.id);
            }}
          />
        ) : null}

        <NavigationUpcomingSigns signs={upcomingSignsOnRoute} />

        {/* Floating Re-center button during navigation */}
        {isNavigating ? (
          <Pressable
            accessibilityLabel="Căn giữa"
            accessibilityRole="button"
            testID="btn-recenter-map"
            onPress={() => {
              const coord = userCoordinate ?? plannedRouteOrigin;
              if (!coord) return;
              setMapFocus((current) => ({
                coordinate: coord,
                requestId: (current?.requestId ?? 0) + 1,
              }));
            }}
            style={({ pressed }) => [
              styles.navRecenterButton,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
                bottom: 108 + bottomInset,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="navigation-variant"
              size={16}
              color={theme.primary}
            />
            <Text style={[styles.navRecenterText, { color: theme.primary }]}>
              Căn giữa
            </Text>
          </Pressable>
        ) : null}

        {/* Floating Sign Filter button during navigation */}
        {isNavigating ? (
          <Pressable
            accessibilityLabel="Bộ lọc biển báo"
            accessibilityRole="button"
            onPress={() => {
              setFilterViewMode("categories");
              const nextSnap = sheetSnapIndex === 0 ? 1 : 0;
              snapTo(nextSnap);
            }}
            style={({ pressed }) => [
              styles.navFilterButton,
              {
                backgroundColor:
                  manualCategories.size < SIGN_CATEGORIES.length
                    ? theme.backgroundSelected
                    : theme.backgroundElement,
                borderColor:
                  manualCategories.size < SIGN_CATEGORIES.length
                    ? theme.primary
                    : theme.border,
                bottom: 108 + bottomInset,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="filter-variant"
              size={16}
              color={
                manualCategories.size < SIGN_CATEGORIES.length
                  ? theme.primary
                  : theme.text
              }
            />
            <Text
              style={[
                styles.navRecenterText,
                {
                  color:
                    manualCategories.size < SIGN_CATEGORIES.length
                      ? theme.primary
                      : theme.text,
                },
              ]}
            >
              Bộ lọc
            </Text>
            {manualCategories.size < SIGN_CATEGORIES.length ? (
              <View
                style={[
                  styles.filterActiveBadge,
                  {
                    backgroundColor: theme.primary,
                    position: "absolute",
                    top: 6,
                    right: 6,
                  },
                ]}
              />
            ) : null}
          </Pressable>
        ) : null}

        {/* Non-navigating Overlay: Top controls, Home filter, and floating map action buttons */}
        {!isNavigating ? (
          <SafeAreaView pointerEvents="box-none" style={styles.overlay}>
            <NavigationTopControls
              selectedDestination={selectedDestination}
              plannedRouteOrigin={plannedRouteOrigin}
              routeStartTitle={routeStartTitle}
              walletBalance={walletData?.wallet?.balance}
              unreadNotificationCount={unreadNotificationCount}
              onSearchPress={() => router.push("/home/search")}
              onTopUpPress={() => router.push("/credits/top-up")}
              onNotificationsPress={() => router.push("/notifications")}
              onLivestreamPress={handleLivestreamPress}
              onChangeDestinationPress={handleChangeDestination}
            />

            <HomeSignFilterCard
              isOpen={isHomeSignFilterOpen && !selectedDestination}
              onClose={() => setIsHomeSignFilterOpen(false)}
              filterViewMode={filterViewMode}
              onToggleFilterViewMode={handleToggleFilterViewMode}
              activePresetId={activePresetId}
              onSelectPreset={handleSelectPreset}
              presets={presets}
              manualCategories={manualCategories}
              onToggleManualCategory={handleToggleManualCategory}
              onNavigateToProfileFilter={() => {
                setIsHomeSignFilterOpen(false);
                router.push({
                  pathname: "/(authenticated)/(tabs)/profile",
                  params: { scrollTo: "signFilter", t: Date.now().toString() },
                });
              }}
            />

            {!selectedDestination && !selectedMapSign ? (
              <View style={styles.mapActions}>
                <AppButton
                  accessibilityLabel={
                    isTtsEnabled
                      ? "Tắt thông báo giọng nói"
                      : "Bật thông báo giọng nói"
                  }
                  onPress={handleToggleTts}
                  style={[
                    styles.mapActionButton,
                    styles.locationActionButton,
                    styles.ttsActionButton,
                  ]}
                  variant="surface"
                >
                  <MaterialCommunityIcons
                    name={isTtsEnabled ? "volume-high" : "volume-off"}
                    size={22}
                    color="#000000"
                  />
                </AppButton>

                <AppButton
                  accessibilityLabel={
                    isHomeSignFilterOpen
                      ? "Đóng danh sách lọc biển báo"
                      : "Mở danh sách lọc biển báo"
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
                  {activePresetId !== null ||
                  (filterViewMode === "categories" &&
                    manualCategories.size < SIGN_CATEGORIES.length) ? (
                    <View
                      style={[
                        styles.filterActiveBadge,
                        { backgroundColor: theme.primary },
                      ]}
                    />
                  ) : null}
                </AppButton>

                <AppButton
                  accessibilityLabel={
                    isLocating
                      ? "Đang xác định vị trí"
                      : "Về vị trí hiện tại"
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

      <NavigationBottomSheet
        sheetHeightAnim={sheetHeightAnim}
        sheetSnapIndex={sheetSnapIndex}
        bottomInset={bottomInset}
        panHandlers={sheetPanResponder.panHandlers}
        onCycleSnap={cycleSnap}
        onSnapTo={snapTo}
        plannedRouteOrigin={plannedRouteOrigin}
        selectedDestination={selectedDestination}
        isNavigating={isNavigating}
        vehicleMode={vehicleMode}
        isMotorcycleMode={isMotorcycleMode}
        onSwitchVehicleMode={handleSwitchVehicleMode}
        carDuration={carDuration}
        isCarRouteLoading={isCarRouteLoading}
        motorcycleDuration={motorcycleDuration}
        isMotorcycleRouteLoading={isMotorcycleRouteLoading}
        cyclingDuration={cyclingDuration}
        isCyclingRouteLoading={isCyclingRouteLoading}
        walkingDuration={walkingDuration}
        isWalkingRouteLoading={isWalkingRouteLoading}
        routeDuration={routeDuration}
        routeDistance={routeDistance}
        activeDuration={activeDuration}
        remainingNavDuration={remainingNavDuration}
        remainingNavDistance={remainingNavDistance}
        navigationError={navigationError}
        expandableContentOpacity={expandableContentOpacity}
        filteredSignsCount={filteredSigns.length}
        visibleSignsCount={visibleSigns.length}
        routeMatchingPresets={routeMatchingPresets}
        filterViewMode={filterViewMode}
        onToggleFilterViewMode={handleToggleFilterViewMode}
        manualCategories={manualCategories}
        onToggleManualCategory={handleToggleManualCategory}
        onSelectAllManualCategories={(selectAll) => {
          if (selectAll) {
            setManualCategories(new Set(SIGN_CATEGORIES.map((c) => c.id)));
          } else {
            setManualCategories(new Set());
          }
        }}
        activePresetId={activePresetId}
        onSelectPreset={handleSelectPreset}
        visibleSigns={visibleSigns}
        isStartingNavigation={isStartingNavigation}
        isRouteBookmarked={isRouteBookmarked}
        onBeginNavigation={handleBeginNavigation}
        onOpenBookmarkModal={() => setIsBookmarkModalOpen(true)}
        onCloseRoute={handleCloseRoute}
        onGo={handleGo}
      />

      <BookmarkRouteModal
        visible={isBookmarkModalOpen}
        onClose={() => setIsBookmarkModalOpen(false)}
        onSaved={(id) => setActiveSavedRouteId(id)}
        isRouteBookmarked={isRouteBookmarked}
        plannedRouteOrigin={plannedRouteOrigin}
        selectedDestination={selectedDestination}
        routeStartTitle={routeStartTitle}
        vehicleMode={vehicleMode}
        isMotorcycleMode={isMotorcycleMode}
        routeCoordinates={routeCoordinates}
        routeDistance={routeDistance}
        routeDuration={routeDuration}
        activeSavedRouteId={activeSavedRouteId}
        savedRouteData={savedRouteData}
        activeCategories={activeCategories}
        sessionAccessToken={session?.accessToken}
        onShowToast={(msg) => setLocationToast({ id: Date.now(), message: msg })}
        refetchPresets={refetchPresets}
        setActivePresetId={setActivePresetId}
      />

      {locationToast ? (
        <AppToast
          key={locationToast.id}
          duration={3000}
          message={locationToast.message}
          onDismiss={handleDismissToast}
        />
      ) : null}
    </View>
  );
}
