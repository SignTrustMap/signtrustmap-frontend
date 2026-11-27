import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { useTheme } from '@/hooks/use-theme';
import { useBackButton } from '@/hooks/use-back-button';
import { useWorkRoute } from '@/hooks/use-work-route';
import { useDebounce } from '@/hooks/use-debounce';
import { SearchSuggestionSkeleton } from '@/components/skeleton';
import { searchPlaces, type ApiPlace } from '@/api/navigation/places';
import type { RouteSign } from '@/api/navigation/navigation';
import type { MapCoordinate } from '@/types/navigationType';
import type { FindSignsInBoundsParams } from '@/types/signMapType';
import type { FindTasksInBoundsParams } from '@/types/revalidationType';
import { useGetSignsInBounds } from '@/feature/navigation/hooks/use-signs';
import { fetchFreshGpsPosition } from '@/feature/navigation/utils/gps';
import { revalidationTaskToRouteSign } from '@/api/revalidation/revalidation';
import {
  useGetAllRevalidationTasks,
  useGetRevalidationTasksInBounds,
} from '../hooks/use-revalidation';

import { RevalidationMapView } from '../components/revalidation-map-view';
import { getFreshnessInfo } from '../components/revalidation-sign-marker';
import { RevalidationSignDetailsCard } from '../components/revalidation-sign-details-card';
import { FILTER_PANEL_WIDTH, styles } from '@/feature/revalidation/styles/revalidation-map-screen.styles';

type FreshnessFilter = 'ALL' | 'NEEDS_REVALIDATION' | 'MODERATE' | 'FRESH';

const ZOOM_THRESHOLDS = [
  {
    id: 'detail',
    label: '17.5x',
    name: 'Chi tiết',
    zoom: 17.5,
    icon: 'magnify-plus-outline',
    desc: 'Cột & biển báo',
  },
  {
    id: 'street',
    label: '16.5x',
    name: 'Đường phố',
    zoom: 16.5,
    icon: 'road-variant',
    desc: 'Cấp đường phố',
  },
  {
    id: 'area',
    label: '14.5x',
    name: 'Khu vực',
    zoom: 14.5,
    icon: 'home-city-outline',
    desc: 'Khu dân cư',
  },
  {
    id: 'city',
    label: '12.0x',
    name: 'Toàn cảnh',
    zoom: 12.0,
    icon: 'city-variant-outline',
    desc: 'Toàn thành phố',
  },
] as const;

type ZoomThresholdId = (typeof ZOOM_THRESHOLDS)[number]['id'];

type RevalidationMapParams = {
  selectedSignId?: string;
  snapLon?: string;
  snapLat?: string;
  snapRequestId?: string;
  signJson?: string;
  filter?: FreshnessFilter;
};

export function RevalidationMapScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<RevalidationMapParams>();
  const surveyorWorkRoute = useWorkRoute('/work', { currentRole: 'surveyor' });
  useBackButton(surveyorWorkRoute);

  // Pre-parse signJson if supplied for instant first-frame snapping & display
  const initialSign = useMemo<RouteSign | null>(() => {
    if (params.signJson) {
      try {
        return JSON.parse(params.signJson) as RouteSign;
      } catch (err) {
        console.warn('Failed to parse signJson parameter:', err);
      }
    }
    return null;
  }, [params.signJson]);

  const [bounds, setBounds] = useState<FindSignsInBoundsParams>();
  const [overrideSign, setOverrideSign] = useState<RouteSign | null | undefined>(undefined);
  const [userCoordinate, setUserCoordinate] = useState<MapCoordinate>();

  const initialFocusCoord = useMemo<MapCoordinate | undefined>(() => {
    if (params.snapLon && params.snapLat) {
      const lon = parseFloat(params.snapLon);
      const lat = parseFloat(params.snapLat);
      if (!Number.isNaN(lon) && !Number.isNaN(lat)) {
        return [lon, lat];
      }
    }
    if (initialSign) {
      return initialSign.coordinate;
    }
    return undefined;
  }, [params.snapLon, params.snapLat, initialSign]);

  const [focusCoordinate, setFocusCoordinate] = useState<MapCoordinate | undefined>(
    initialFocusCoord,
  );
  const [focusRequestId, setFocusRequestId] = useState(initialFocusCoord ? 1 : 0);
  const [activeFilter, setActiveFilter] = useState<FreshnessFilter>(() => {
    if (params.filter) return params.filter;
    return 'ALL';
  });

  // Zoom control state
  const [zoomLevel, setZoomLevel] = useState<number>(initialFocusCoord ? 17.5 : 14.5);
  const [zoomRequestId, setZoomRequestId] = useState(0);
  const [activeZoomId, setActiveZoomId] = useState<ZoomThresholdId>(
    initialFocusCoord ? 'detail' : 'area',
  );
  const [isZoomMenuOpen, setIsZoomMenuOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSignListOpen, setIsSignListOpen] = useState(false);

  // Search bar and place search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery.trim(), 350);

  const { data: searchResults = [], isFetching: isSearching } = useQuery({
    queryKey: ['revalidation-place-search', debouncedSearchQuery],
    queryFn: ({ signal }) => searchPlaces(debouncedSearchQuery, signal),
    enabled: debouncedSearchQuery.length >= 2,
    staleTime: 60_000,
  });

  const isSearchLoading =
    isSearching || (searchQuery.trim().length >= 2 && debouncedSearchQuery !== searchQuery.trim());

  // Urgency filter slide drawer on left edge
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const filterSlideAnim = useRef(new Animated.Value(0)).current; // 0 = collapsed/hidden, 1 = expanded

  const toggleFilter = useCallback(
    (forceState?: boolean) => {
      setIsFilterExpanded((current) => {
        const nextState = forceState !== undefined ? forceState : !current;
        Animated.spring(filterSlideAnim, {
          toValue: nextState ? 1 : 0,
          useNativeDriver: true,
          bounciness: 4,
          speed: 16,
        }).start();
        return nextState;
      });
    },
    [filterSlideAnim],
  );

  const filterTranslateX = filterSlideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-FILTER_PANEL_WIDTH, 0],
  });

  // Dynamic positioning for floating buttons above sign details or sign list
  const [detailsCardHeight, setDetailsCardHeight] = useState(0);
  const [signListHeight, setSignListHeight] = useState(0);
  const [buttonsTranslateY] = useState(() => new Animated.Value(0));

  // Fetch all revalidation tasks from backend (global, independent of viewport)
  const { data: allRevalTasks = [], isLoading: isLoadingAllTasks } =
    useGetAllRevalidationTasks(true);

  const effectiveBounds = useMemo<FindSignsInBoundsParams>(() => {
    if (bounds) return bounds;
    const center = focusCoordinate ?? userCoordinate ?? [106.6955, 10.7769];
    const delta = 0.025;
    return {
      minLon: center[0] - delta,
      minLat: center[1] - delta,
      maxLon: center[0] + delta,
      maxLat: center[1] + delta,
    };
  }, [bounds, focusCoordinate, userCoordinate]);

  // Fetch verified signs within current map bounds
  const { data: boundsSigns = [] } = useGetSignsInBounds(effectiveBounds, true);

  const taskBounds = useMemo<FindTasksInBoundsParams>(() => {
    return {
      minLat: effectiveBounds.minLat,
      minLon: effectiveBounds.minLon,
      maxLat: effectiveBounds.maxLat,
      maxLon: effectiveBounds.maxLon,
    };
  }, [effectiveBounds]);

  // Fetch revalidation tasks within current map bounds
  const { data: revalTasks = [] } = useGetRevalidationTasksInBounds(taskBounds, true);

  // Unified list of signs: verified map signs + converted revalidation tasks
  const rawSigns = useMemo(() => {
    const signMap = new Map<string, RouteSign>();

    for (const sign of boundsSigns) {
      signMap.set(sign.id, sign);
    }

    const mergeTask = (task: (typeof allRevalTasks)[number]) => {
      const converted = revalidationTaskToRouteSign(task);
      const existing = signMap.get(converted.id);
      signMap.set(converted.id, {
        ...(existing ?? {}),
        ...converted,
        imageUrl: converted.imageUrl || existing?.imageUrl || '',
        actualCropUrl: converted.actualCropUrl || existing?.actualCropUrl,
        name:
          converted.name && converted.name !== 'Traffic Sign'
            ? converted.name
            : existing?.name || converted.name,
        signCode:
          converted.signCode && converted.signCode !== 'Traffic Sign'
            ? converted.signCode
            : existing?.signCode || converted.signCode,
      });
    };

    for (const task of allRevalTasks) mergeTask(task);
    for (const task of revalTasks) mergeTask(task);

    if (initialSign) {
      const existing = signMap.get(initialSign.id);
      signMap.set(initialSign.id, {
        ...(existing ?? {}),
        ...initialSign,
        taskId: initialSign.taskId ?? existing?.taskId,
      });
    }

    return Array.from(signMap.values());
  }, [boundsSigns, allRevalTasks, revalTasks, initialSign]);

  // Derive selectedSign dynamically: user override > initialSign > selectedSignId
  const selectedSign = useMemo<RouteSign | null>(() => {
    if (overrideSign !== undefined) {
      return overrideSign;
    }
    if (initialSign) {
      return initialSign;
    }
    if (params.selectedSignId && rawSigns.length > 0) {
      const found = rawSigns.find((s) => s.id === params.selectedSignId);
      if (found) return found;
    }
    return null;
  }, [overrideSign, initialSign, params.selectedSignId, rawSigns]);

  // Initial user location fetch (guarded so it doesn't overwrite snap coords from inspect return)
  useEffect(() => {
    let isMounted = true;
    void fetchFreshGpsPosition().then((pos) => {
      if (isMounted && pos) {
        setUserCoordinate(pos);
        if (!params.snapLon && !params.snapLat && !initialSign) {
          setFocusCoordinate(pos);
          setFocusRequestId((prev) => prev + 1);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, [params.snapLon, params.snapLat, initialSign]);

  // Snap camera and restore selection when navigating with coordinates
  useEffect(() => {
    if (params.snapLon && params.snapLat) {
      const lon = parseFloat(params.snapLon);
      const lat = parseFloat(params.snapLat);
      if (!Number.isNaN(lon) && !Number.isNaN(lat)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFocusCoordinate([lon, lat]);
        setFocusRequestId((prev) => prev + 1);
        setZoomLevel(17.5);
        setActiveZoomId('detail');
      }
    }
  }, [params.snapLon, params.snapLat, params.snapRequestId]);

  // Automatically snap map camera when a sign is selected
  const lastSnappedSignIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (selectedSign && selectedSign.id !== lastSnappedSignIdRef.current) {
      lastSnappedSignIdRef.current = selectedSign.id;
      if (
        Array.isArray(selectedSign.coordinate) &&
        Number.isFinite(selectedSign.coordinate[0]) &&
        Number.isFinite(selectedSign.coordinate[1])
      ) {
        setFocusCoordinate(selectedSign.coordinate);
        setFocusRequestId((prev) => prev + 1);
        setZoomLevel(17.5);
        setActiveZoomId('detail');
      }
    }
  }, [selectedSign]);

  // Smoothly animate floating buttons up/down relative to sign details card or sign list panel
  useEffect(() => {
    let targetOffset = 0;
    if (isSignListOpen) {
      const effectiveListHeight = signListHeight > 0 ? signListHeight : 240;
      targetOffset = -(effectiveListHeight + 12);
    } else if (selectedSign) {
      const effectiveHeight = detailsCardHeight > 0 ? detailsCardHeight : 240;
      targetOffset = -(effectiveHeight + 12);
    }

    Animated.spring(buttonsTranslateY, {
      toValue: targetOffset,
      damping: 22,
      mass: 0.8,
      stiffness: 220,
      useNativeDriver: true,
    }).start();
  }, [isSignListOpen, signListHeight, selectedSign, detailsCardHeight, buttonsTranslateY]);

  // Snap to current location handler
  const handleSnapLocation = useCallback(() => {
    if (userCoordinate) {
      setFocusCoordinate(userCoordinate);
      setFocusRequestId((prev) => prev + 1);
    } else {
      setIsLocating(true);
      void fetchFreshGpsPosition().then((pos) => {
        setIsLocating(false);
        if (pos) {
          setUserCoordinate(pos);
          setFocusCoordinate(pos);
          setFocusRequestId((prev) => prev + 1);
        }
      });
    }
  }, [userCoordinate]);

  // Select Zoom Threshold Handler
  const handleSelectZoomThreshold = useCallback((id: ZoomThresholdId, zoom: number) => {
    setActiveZoomId(id);
    setZoomLevel(zoom);
    setZoomRequestId((prev) => prev + 1);
    setIsZoomMenuOpen(false);
  }, []);

  const lastSignPressTimeRef = useRef(0);

  const handleSignPress = useCallback(
    (sign: RouteSign) => {
      lastSignPressTimeRef.current = Date.now();
      setOverrideSign((prev) => {
        const current = prev !== undefined ? prev : selectedSign;
        return current?.id === sign.id ? null : sign;
      });
      setFocusCoordinate(sign.coordinate);
      setFocusRequestId((prev) => prev + 1);
      setIsZoomMenuOpen(false);
    },
    [selectedSign],
  );

  const handleMapPress = useCallback(() => {
    if (Date.now() - lastSignPressTimeRef.current < 300) {
      return;
    }
    setOverrideSign(null);
    setIsZoomMenuOpen(false);
    setIsSearchDropdownOpen(false);
    Keyboard.dismiss();
  }, []);

  const handleSelectPlace = useCallback((place: ApiPlace) => {
    if (place.latitude != null && place.longitude != null) {
      setSearchQuery(place.title);
      setIsSearchDropdownOpen(false);
      Keyboard.dismiss();
      setFocusCoordinate([place.longitude, place.latitude]);
      setFocusRequestId((prev) => prev + 1);
      setZoomLevel(17.5);
      setActiveZoomId('detail');
      setZoomRequestId((prev) => prev + 1);
    }
  }, []);

  const matchingSigns = useMemo(() => {
    if (!debouncedSearchQuery || debouncedSearchQuery.length < 2) return [];
    const q = debouncedSearchQuery.toLowerCase();
    return rawSigns
      .filter(
        (s) =>
          (s.signCode && s.signCode.toLowerCase().includes(q)) ||
          (s.name && s.name.toLowerCase().includes(q)) ||
          (s.roadName && s.roadName.toLowerCase().includes(q)),
      )
      .slice(0, 5);
  }, [debouncedSearchQuery, rawSigns]);

  // Filter signs based on active freshness tab
  const filteredSigns = useMemo(() => {
    return rawSigns.filter((sign) => {
      if (selectedSign && sign.id === selectedSign.id) return true;
      const { isStale, isModerate, isFresh } = getFreshnessInfo(sign);
      if (activeFilter === 'NEEDS_REVALIDATION') return isStale;
      if (activeFilter === 'MODERATE') return isModerate;
      if (activeFilter === 'FRESH') return isFresh;
      return true;
    });
  }, [rawSigns, activeFilter, selectedSign]);

  // Signs that need revalidation, sorted by freshness score ascending (worst first)
  const staleSigns = useMemo(() => {
    const staleMap = new Map<string, RouteSign>();

    // 1. Ensure all revalidation tasks from backend are present
    for (const task of allRevalTasks) {
      const sign = revalidationTaskToRouteSign(task);
      staleMap.set(sign.id, sign);
    }

    // 2. Also include any other stale signs in rawSigns (e.g. from viewport or initialSign)
    for (const sign of rawSigns) {
      if (getFreshnessInfo(sign).isStale) {
        const existing = staleMap.get(sign.id);
        staleMap.set(sign.id, {
          ...(existing ?? {}),
          ...sign,
          taskId: sign.taskId ?? existing?.taskId,
        });
      }
    }

    return Array.from(staleMap.values()).sort(
      (a, b) => (a.freshnessScore ?? 0) - (b.freshnessScore ?? 0),
    );
  }, [allRevalTasks, rawSigns]);

  // Statistics for header summary
  const staleCount = useMemo(() => {
    return staleSigns.length;
  }, [staleSigns]);

  const moderateCount = useMemo(() => {
    return rawSigns.filter((s) => getFreshnessInfo(s).isModerate).length;
  }, [rawSigns]);

  const freshCount = useMemo(() => {
    return rawSigns.filter((s) => getFreshnessInfo(s).isFresh).length;
  }, [rawSigns]);

  const displayListSigns = useMemo(() => {
    if (activeFilter === 'NEEDS_REVALIDATION') return staleSigns;
    return filteredSigns;
  }, [activeFilter, staleSigns, filteredSigns]);

  const handleSignListItemPress = useCallback((sign: RouteSign) => {
    setIsSignListOpen(false);
    setOverrideSign(sign);
    if (
      Array.isArray(sign.coordinate) &&
      Number.isFinite(sign.coordinate[0]) &&
      Number.isFinite(sign.coordinate[1])
    ) {
      setFocusCoordinate(sign.coordinate);
      setFocusRequestId((prev) => prev + 1);
      setZoomLevel(17.5);
      setActiveZoomId('detail');
    }
    setIsZoomMenuOpen(false);
  }, []);

  const handleRevalidateAction = (sign: RouteSign) => {
    const matchedTask = sign.taskId
      ? undefined
      : allRevalTasks.find((t) => t.verifiedSignId === sign.id || t.id === sign.id) ||
        revalTasks.find((t) => t.verifiedSignId === sign.id || t.id === sign.id);
    const resolvedTaskId = sign.taskId || matchedTask?.id || sign.id || '';

    router.replace({
      pathname: '/work/inspect-revalidate',
      params: {
        signId: sign.id,
        taskId: resolvedTaskId,
        signCode: sign.signCode,
        name: sign.name,
        nameVi: sign.nameVi || '',
        nameEn: sign.nameEn || '',
        latitude: String(sign.coordinate[1]),
        longitude: String(sign.coordinate[0]),
        imageUrl: sign.imageUrl || '',
        actualCropUrl: sign.actualCropUrl || '',
        freshnessScore: sign.freshnessScore !== undefined ? String(sign.freshnessScore) : '',
        status: sign.status || '',
        roadName: sign.roadName || '',
        displayAddress: sign.displayAddress || '',
        lastVerifiedAt: sign.lastVerifiedAt || '',
      },
    });
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      {/* Interactive Map (No destination search bar) */}
      <RevalidationMapView
        focusCoordinate={focusCoordinate}
        focusRequestId={focusRequestId}
        onBoundsChange={setBounds}
        onMapPress={handleMapPress}
        onSignPress={handleSignPress}
        selectedSignId={selectedSign?.id}
        signs={filteredSigns}
        userCoordinate={userCoordinate}
        zoomLevel={zoomLevel}
        zoomRequestId={zoomRequestId}
      />

      {/* Floating Top Search Bar Header (like Map Screen) */}
      <SafeAreaView edges={['top']} pointerEvents="box-none" style={styles.topOverlay}>
        <View style={styles.searchHeaderRow}>
          {/* Back button */}
          <Pressable
            accessibilityLabel="Quay lại Công việc"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => router.replace(surveyorWorkRoute)}
            style={[
              styles.backCircleButton,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}
          >
            <MaterialCommunityIcons color={theme.text} name="arrow-left" size={20} />
          </Pressable>

          {/* Search Input and Output Wrapper (constrained to exact same width on all phones) */}
          <View style={styles.searchBarWrapper}>
            <View
              style={[
                styles.searchBarContainer,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                },
              ]}
            >
              <MaterialCommunityIcons color={theme.placeholder} name="magnify" size={20} />
              <TextInput
                accessibilityLabel="Tìm kiếm vị trí trên bản đồ tái thẩm định"
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="never"
                onChangeText={(text) => {
                  setSearchQuery(text);
                  setIsSearchDropdownOpen(true);
                }}
                onFocus={() => {
                  if (searchQuery.trim().length >= 2) {
                    setIsSearchDropdownOpen(true);
                  }
                }}
                placeholder="Tìm vị trí, địa điểm kiểm tra..."
                placeholderTextColor={theme.placeholder}
                returnKeyType="search"
                style={[styles.searchInput, { color: theme.text }]}
                value={searchQuery}
              />
              {searchQuery.length > 0 ? (
                <Pressable
                  accessibilityLabel="Xóa tìm kiếm"
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => {
                    setSearchQuery('');
                    setIsSearchDropdownOpen(false);
                  }}
                >
                  <MaterialCommunityIcons color={theme.placeholder} name="close-circle" size={18} />
                </Pressable>
              ) : null}
            </View>

            {/* Search Suggestions Floating Dropdown */}
            {isSearchDropdownOpen && debouncedSearchQuery.length >= 2 ? (
              <View
                style={[
                  styles.searchDropdownCard,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.border,
                  },
                ]}
              >
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                  style={styles.searchDropdownScroll}
                >
                  {/* Skeleton loading when searching */}
                  {isSearchLoading ? (
                    <View style={styles.dropdownSection}>
                      <SearchSuggestionSkeleton count={3} />
                    </View>
                  ) : null}

                  {/* Matching Signs Section */}
                  {!isSearchLoading && matchingSigns.length > 0 ? (
                    <View style={styles.dropdownSection}>
                      <Text style={[styles.dropdownSectionHeader, { color: theme.placeholder }]}>
                        BIỂN BÁO GẦN ĐÂY
                      </Text>
                      {matchingSigns.map((sign) => (
                        <Pressable
                          key={`sign-${sign.id}`}
                          accessibilityLabel={`Đến vị trí biển ${sign.signCode || sign.name}`}
                          accessibilityRole="button"
                          onPress={() => {
                            setSearchQuery(sign.signCode || sign.name || '');
                            setIsSearchDropdownOpen(false);
                            Keyboard.dismiss();
                            handleSignListItemPress(sign);
                          }}
                          style={({ pressed }) => [
                            styles.dropdownItemRow,
                            pressed && { backgroundColor: theme.backgroundSelected },
                          ]}
                        >
                          <View
                            style={[
                              styles.dropdownItemIcon,
                              { backgroundColor: 'rgba(6, 113, 235, 0.1)' },
                            ]}
                          >
                            <MaterialCommunityIcons
                              color={theme.primary}
                              name="sign-caution"
                              size={18}
                            />
                          </View>
                          <View style={styles.dropdownItemTextCol}>
                            <Text
                              numberOfLines={1}
                              style={[styles.dropdownItemTitle, { color: theme.text }]}
                            >
                              {sign.signCode
                                ? `${sign.signCode} - ${sign.name || ''}`
                                : sign.name || 'Biển báo'}
                            </Text>
                            {sign.roadName ? (
                              <Text
                                numberOfLines={1}
                                style={[styles.dropdownItemSubtitle, { color: theme.placeholder }]}
                              >
                                {sign.roadName}
                              </Text>
                            ) : null}
                          </View>
                          <MaterialCommunityIcons
                            color={theme.placeholder}
                            name="chevron-right"
                            size={16}
                          />
                        </Pressable>
                      ))}
                    </View>
                  ) : null}

                  {/* Place Search Results Section */}
                  {!isSearchLoading && searchResults.length > 0 ? (
                    <View style={styles.dropdownSection}>
                      <Text style={[styles.dropdownSectionHeader, { color: theme.placeholder }]}>
                        ĐỊA ĐIỂM & ĐƯỜNG PHỐ
                      </Text>
                      {searchResults.map((place) => (
                        <Pressable
                          key={`place-${place.id}`}
                          accessibilityLabel={`Chọn địa điểm ${place.title}`}
                          accessibilityRole="button"
                          onPress={() => handleSelectPlace(place)}
                          style={({ pressed }) => [
                            styles.dropdownItemRow,
                            pressed && { backgroundColor: theme.backgroundSelected },
                          ]}
                        >
                          <View
                            style={[
                              styles.dropdownItemIcon,
                              { backgroundColor: `${theme.grey}15` },
                            ]}
                          >
                            <MaterialCommunityIcons
                              color={theme.primary}
                              name="map-marker-outline"
                              size={18}
                            />
                          </View>
                          <View style={styles.dropdownItemTextCol}>
                            <Text
                              numberOfLines={1}
                              style={[styles.dropdownItemTitle, { color: theme.text }]}
                            >
                              {place.title}
                            </Text>
                            {place.address ? (
                              <Text
                                numberOfLines={1}
                                style={[styles.dropdownItemSubtitle, { color: theme.placeholder }]}
                              >
                                {place.address}
                              </Text>
                            ) : null}
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}

                  {/* Empty State */}
                  {!isSearchLoading && searchResults.length === 0 && matchingSigns.length === 0 ? (
                    <View style={styles.dropdownEmptyRow}>
                      <MaterialCommunityIcons
                        color={theme.placeholder}
                        name="map-marker-off-outline"
                        size={20}
                      />
                      <Text style={[styles.dropdownEmptyText, { color: theme.placeholder }]}>
                        Không tìm thấy địa điểm nào
                      </Text>
                    </View>
                  ) : null}
                </ScrollView>
              </View>
            ) : null}
          </View>
        </View>
      </SafeAreaView>

      {/* Floating Urgency Filter on Left Edge with Slide Animation */}
      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.filterDrawerContainer,
          {
            top: Math.max(16, insets.top + 60),
            transform: [{ translateX: filterTranslateX }],
          },
        ]}
      >
        {/* Expanded Filter Panel */}
        <View
          style={[
            styles.filterPanelCard,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.filterPanelHeader}>
            <View style={styles.filterPanelTitleRow}>
              <MaterialCommunityIcons color={theme.primary} name="filter-variant" size={16} />
              <Text style={[styles.filterPanelTitle, { color: theme.text }]}>Mức độ khẩn cấp</Text>
            </View>
            <Pressable
              accessibilityLabel="Ẩn bộ lọc"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => toggleFilter(false)}
              style={[styles.filterPanelCloseBtn, { backgroundColor: theme.background }]}
            >
              <MaterialCommunityIcons color={theme.grey} name="chevron-left" size={16} />
            </Pressable>
          </View>

          <View style={[styles.filterPanelDivider, { backgroundColor: theme.border }]} />

          <View style={styles.filterOptionsCol}>
            {/* Tất cả */}
            <Pressable
              accessibilityLabel={`Lọc tất cả ${rawSigns.length} biển báo`}
              accessibilityRole="button"
              onPress={() => setActiveFilter('ALL')}
              style={[
                styles.filterOptionItem,
                activeFilter === 'ALL' && [
                  styles.filterOptionItemActive,
                  { backgroundColor: `${theme.primary}16`, borderColor: theme.primary },
                ],
              ]}
            >
              <View style={styles.filterOptionLeft}>
                <View style={[styles.filterOptionDot, { backgroundColor: theme.primary }]} />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.filterOptionLabel,
                    { color: activeFilter === 'ALL' ? theme.primary : theme.text },
                    activeFilter === 'ALL' && styles.filterOptionLabelActive,
                  ]}
                >
                  Tất cả
                </Text>
              </View>
              <View style={[styles.filterOptionBadge, { backgroundColor: `${theme.grey}20` }]}>
                <Text
                  style={[
                    styles.filterOptionBadgeText,
                    { color: activeFilter === 'ALL' ? theme.primary : theme.text },
                  ]}
                >
                  {rawSigns.length}
                </Text>
              </View>
            </Pressable>

            {/* Cần kiểm tra */}
            <Pressable
              accessibilityLabel={`Lọc ${staleCount} biển báo cần kiểm tra khẩn cấp`}
              accessibilityRole="button"
              onPress={() => setActiveFilter('NEEDS_REVALIDATION')}
              style={[
                styles.filterOptionItem,
                activeFilter === 'NEEDS_REVALIDATION' && [
                  styles.filterOptionItemActive,
                  { backgroundColor: 'rgba(225, 29, 72, 0.12)', borderColor: '#E11D48' },
                ],
              ]}
            >
              <View style={styles.filterOptionLeft}>
                <View style={[styles.filterOptionDot, { backgroundColor: '#E11D48' }]} />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.filterOptionLabel,
                    { color: activeFilter === 'NEEDS_REVALIDATION' ? '#E11D48' : theme.text },
                    activeFilter === 'NEEDS_REVALIDATION' && styles.filterOptionLabelActive,
                  ]}
                >
                  Cần kiểm tra
                </Text>
              </View>
              <View
                style={[styles.filterOptionBadge, { backgroundColor: 'rgba(225, 29, 72, 0.14)' }]}
              >
                <Text style={[styles.filterOptionBadgeText, { color: '#E11D48' }]}>
                  {staleCount}
                </Text>
              </View>
            </Pressable>

            {/* Trung bình */}
            <Pressable
              accessibilityLabel={`Lọc ${moderateCount} biển báo mức độ trung bình`}
              accessibilityRole="button"
              onPress={() => setActiveFilter('MODERATE')}
              style={[
                styles.filterOptionItem,
                activeFilter === 'MODERATE' && [
                  styles.filterOptionItemActive,
                  { backgroundColor: 'rgba(245, 158, 11, 0.12)', borderColor: '#F59E0B' },
                ],
              ]}
            >
              <View style={styles.filterOptionLeft}>
                <View style={[styles.filterOptionDot, { backgroundColor: '#F59E0B' }]} />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.filterOptionLabel,
                    { color: activeFilter === 'MODERATE' ? '#D97706' : theme.text },
                    activeFilter === 'MODERATE' && styles.filterOptionLabelActive,
                  ]}
                >
                  Trung bình
                </Text>
              </View>
              <View
                style={[styles.filterOptionBadge, { backgroundColor: 'rgba(245, 158, 11, 0.14)' }]}
              >
                <Text style={[styles.filterOptionBadgeText, { color: '#D97706' }]}>
                  {moderateCount}
                </Text>
              </View>
            </Pressable>

            {/* Tươi mới */}
            <Pressable
              accessibilityLabel={`Lọc ${freshCount} biển báo tươi mới`}
              accessibilityRole="button"
              onPress={() => setActiveFilter('FRESH')}
              style={[
                styles.filterOptionItem,
                activeFilter === 'FRESH' && [
                  styles.filterOptionItemActive,
                  { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderColor: '#10B981' },
                ],
              ]}
            >
              <View style={styles.filterOptionLeft}>
                <View style={[styles.filterOptionDot, { backgroundColor: '#10B981' }]} />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.filterOptionLabel,
                    { color: activeFilter === 'FRESH' ? '#059669' : theme.text },
                    activeFilter === 'FRESH' && styles.filterOptionLabelActive,
                  ]}
                >
                  Tươi mới
                </Text>
              </View>
              <View
                style={[styles.filterOptionBadge, { backgroundColor: 'rgba(16, 185, 129, 0.14)' }]}
              >
                <Text style={[styles.filterOptionBadgeText, { color: '#059669' }]}>
                  {freshCount}
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Protruding Handle on the Right of the Filter Drawer */}
        <Pressable
          accessibilityLabel={
            isFilterExpanded ? 'Ẩn bộ lọc mức độ khẩn cấp' : 'Hiển thị bộ lọc mức độ khẩn cấp'
          }
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => toggleFilter()}
          style={[
            styles.filterHandleButton,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
            },
          ]}
        >
          <MaterialCommunityIcons
            color={theme.primary}
            name={isFilterExpanded ? 'chevron-left' : 'chevron-right'}
            size={22}
          />
          {!isFilterExpanded && activeFilter !== 'ALL' ? (
            <View
              style={[
                styles.filterHandleDot,
                {
                  backgroundColor:
                    activeFilter === 'NEEDS_REVALIDATION'
                      ? '#E11D48'
                      : activeFilter === 'MODERATE'
                        ? '#F59E0B'
                        : '#10B981',
                },
              ]}
            />
          ) : null}
        </Pressable>
      </Animated.View>

      {/* Floating Action Controls on Bottom-Right */}
      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.floatingControlsGroup,
          {
            bottom: Math.max(20, insets.bottom + 16),
            transform: [{ translateY: buttonsTranslateY }],
          },
        ]}
      >
        {/* Selectable Zoom Threshold Popover Menu */}
        {isZoomMenuOpen ? (
          <View
            style={[
              styles.zoomPopoverMenu,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
                shadowColor: '#09233C',
              },
            ]}
          >
            <Text style={[styles.zoomMenuTitle, { color: theme.grey }]}>MỨC THU PHÓNG BẢN ĐỒ</Text>
            {ZOOM_THRESHOLDS.map((item) => {
              const isSelected = activeZoomId === item.id;
              return (
                <Pressable
                  accessibilityLabel={`Đặt mức thu phóng thành ${item.name} (${item.label})`}
                  accessibilityRole="button"
                  key={item.id}
                  onPress={() => handleSelectZoomThreshold(item.id, item.zoom)}
                  style={[
                    styles.zoomMenuItem,
                    isSelected && [
                      styles.zoomMenuItemActive,
                      { backgroundColor: `${theme.primary}14` },
                    ],
                  ]}
                >
                  <MaterialCommunityIcons
                    color={isSelected ? theme.primary : theme.text}
                    name={item.icon as any}
                    size={18}
                  />
                  <View style={styles.zoomMenuItemText}>
                    <Text
                      style={[
                        styles.zoomItemName,
                        { color: isSelected ? theme.primary : theme.text },
                      ]}
                    >
                      {item.name}
                    </Text>
                    <Text style={[styles.zoomItemDesc, { color: theme.placeholder }]}>
                      {item.desc}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.zoomLevelPill,
                      { backgroundColor: isSelected ? theme.primary : `${theme.grey}20` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.zoomLevelPillText,
                        { color: isSelected ? '#FFFFFF' : theme.text },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {/* Button 0: Toggle Sign List Panel */}
        <Pressable
          accessibilityLabel={`Hiển thị danh sách ${staleSigns.length} biển báo cần tái thẩm định`}
          accessibilityRole="button"
          onPress={() => {
            setIsSignListOpen((prev) => !prev);
            setIsZoomMenuOpen(false);
          }}
          style={[
            styles.floatingCircleButton,
            isSignListOpen && {
              borderColor: '#E11D48',
              backgroundColor: 'rgba(225, 29, 72, 0.08)',
            },
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
              shadowColor: '#09233C',
            },
          ]}
        >
          <MaterialCommunityIcons
            color={isSignListOpen ? '#E11D48' : theme.text}
            name={isSignListOpen ? 'close' : 'format-list-bulleted'}
            size={22}
          />
          {staleSigns.length > 0 && !isSignListOpen ? (
            <View style={[styles.zoomIndicatorBadge, { backgroundColor: '#E11D48' }]}>
              <Text style={styles.zoomIndicatorText}>{staleSigns.length}</Text>
            </View>
          ) : null}
        </Pressable>

        {/* Button 1: Modify Zoom Level by Selectable Threshold */}
        <Pressable
          accessibilityLabel="Thay đổi mức thu phóng bản đồ"
          accessibilityRole="button"
          onPress={() => {
            setIsZoomMenuOpen((prev) => !prev);
            setIsSignListOpen(false);
          }}
          style={[
            styles.floatingCircleButton,
            isZoomMenuOpen && {
              borderColor: theme.primary,
              backgroundColor: theme.backgroundSelected,
            },
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
              shadowColor: '#09233C',
            },
          ]}
        >
          <MaterialCommunityIcons
            color={isZoomMenuOpen ? theme.primary : theme.text}
            name="magnify-scan"
            size={22}
          />
          <View style={[styles.zoomIndicatorBadge, { backgroundColor: theme.primary }]}>
            <Text style={styles.zoomIndicatorText}>
              {ZOOM_THRESHOLDS.find((z) => z.id === activeZoomId)?.label ?? '16.5x'}
            </Text>
          </View>
        </Pressable>

        {/* Button 2: Snap to Current Location if Available */}
        <Pressable
          accessibilityLabel="Đến vị trí hiện tại"
          accessibilityRole="button"
          onPress={handleSnapLocation}
          style={[
            styles.floatingCircleButton,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
              shadowColor: '#09233C',
            },
          ]}
        >
          {isLocating ? (
            <ActivityIndicator color={theme.primary} size="small" />
          ) : (
            <MaterialCommunityIcons
              color={userCoordinate ? theme.primary : theme.grey}
              name="crosshairs-gps"
              size={22}
            />
          )}
        </Pressable>
      </Animated.View>

      {/* Sign List Panel */}
      {isSignListOpen ? (
        <View
          onLayout={(e) => setSignListHeight(e.nativeEvent.layout.height)}
          style={[
            styles.signListPanel,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
              bottom: Math.max(16, insets.bottom + 8),
            },
          ]}
        >
          {/* Panel Header */}
          <View style={styles.signListHeader}>
            <View style={styles.signListHeaderLeft}>
              <View
                style={[styles.signListHeaderIcon, { backgroundColor: 'rgba(239, 68, 68, 0.10)' }]}
              >
                <MaterialCommunityIcons color="#E11D48" name="alert-decagram-outline" size={18} />
              </View>
              <View>
                <Text style={[styles.signListTitle, { color: theme.text }]}>
                  {activeFilter === 'NEEDS_REVALIDATION'
                    ? 'Cần tái thẩm định'
                    : activeFilter === 'MODERATE'
                      ? 'Mức độ trung bình'
                      : activeFilter === 'FRESH'
                        ? 'Biển báo tươi mới'
                        : 'Tất cả biển báo'}
                </Text>
                <Text style={[styles.signListSubtitle, { color: theme.grey }]}>
                  {displayListSigns.length} biển báo theo bộ lọc
                </Text>
              </View>
            </View>
            <Pressable
              accessibilityLabel="Đóng danh sách biển báo"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => setIsSignListOpen(false)}
              style={[styles.signListCloseBtn, { backgroundColor: theme.background }]}
            >
              <MaterialCommunityIcons color={theme.grey} name="close" size={16} />
            </Pressable>
          </View>

          {/* Divider */}
          <View style={[styles.signListDivider, { backgroundColor: theme.border }]} />

          {/* Scrollable Sign List */}
          {isLoadingAllTasks && displayListSigns.length === 0 ? (
            <View style={styles.signListEmpty}>
              <ActivityIndicator color={theme.primary} size="small" />
              <Text style={[styles.signListEmptyText, { color: theme.grey }]}>
                Đang tải biển báo...
              </Text>
            </View>
          ) : displayListSigns.length === 0 ? (
            <View style={styles.signListEmpty}>
              <MaterialCommunityIcons color={theme.grey} name="check-circle-outline" size={32} />
              <Text style={[styles.signListEmptyText, { color: theme.grey }]}>
                Không có biển báo nào phù hợp
              </Text>
            </View>
          ) : (
            <FlatList
              data={displayListSigns}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const info = getFreshnessInfo(item);
                const isActive = selectedSign?.id === item.id;
                return (
                  <Pressable
                    accessibilityLabel={`Đến biển báo ${item.signCode || item.name}`}
                    accessibilityRole="button"
                    onPress={() => handleSignListItemPress(item)}
                    style={[
                      styles.signListRow,
                      isActive && { backgroundColor: 'rgba(6, 113, 235, 0.06)' },
                      { borderBottomColor: theme.border },
                    ]}
                  >
                    {/* Sign image or placeholder */}
                    <View style={[styles.signListRowImage, { borderColor: '#E11D48' }]}>
                      {item.imageUrl ? (
                        <ExpoImage
                          contentFit="contain"
                          source={{ uri: item.imageUrl }}
                          style={styles.signListRowImg}
                        />
                      ) : (
                        <MaterialCommunityIcons color="#94A3B8" name="sign-caution" size={18} />
                      )}
                    </View>

                    {/* Sign info */}
                    <View style={styles.signListRowInfo}>
                      <View style={styles.signListRowTop}>
                        <Text
                          numberOfLines={1}
                          style={[styles.signListRowName, { color: theme.text }]}
                        >
                          {item.signCode || 'Biển báo'}
                        </Text>
                        {info.scorePercent !== undefined ? (
                          <View
                            style={[
                              styles.signListScoreBadge,
                              { backgroundColor: 'rgba(239, 68, 68, 0.10)' },
                            ]}
                          >
                            <Text style={styles.signListScoreText}>{info.scorePercent}%</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text
                        numberOfLines={1}
                        style={[styles.signListRowLabel, { color: theme.text }]}
                      >
                        {item.name || item.signCode || 'Biển báo chưa xác định'}
                      </Text>
                      {item.roadName ? (
                        <Text
                          numberOfLines={1}
                          style={[styles.signListRowRoad, { color: theme.placeholder }]}
                        >
                          {item.roadName}
                        </Text>
                      ) : null}
                    </View>

                    {/* Chevron */}
                    <MaterialCommunityIcons
                      color={theme.placeholder}
                      name="chevron-right"
                      size={18}
                    />
                  </Pressable>
                );
              }}
              showsVerticalScrollIndicator={false}
              style={styles.signListScroll}
            />
          )}
        </View>
      ) : null}

      {/* Selected Sign Details Bottom Card */}
      {selectedSign && !isSignListOpen ? (
        <RevalidationSignDetailsCard
          onCardHeightChange={setDetailsCardHeight}
          onClose={() => setOverrideSign(null)}
          onRevalidate={handleRevalidateAction}
          sign={selectedSign}
          taskId={
            selectedSign.taskId ||
            allRevalTasks.find(
              (t) => t.verifiedSignId === selectedSign.id || t.id === selectedSign.id,
            )?.id ||
            revalTasks.find((t) => t.verifiedSignId === selectedSign.id || t.id === selectedSign.id)
              ?.id
          }
        />
      ) : null}
    </View>
  );
}
