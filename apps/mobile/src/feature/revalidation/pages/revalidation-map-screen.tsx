import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
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

type FreshnessFilter = 'ALL' | 'NEEDS_REVALIDATION' | 'MODERATE' | 'FRESH';

const FILTER_PANEL_WIDTH = 200;

const ZOOM_THRESHOLDS = [
  { id: 'detail', label: '17.5x', name: 'Chi tiết', zoom: 17.5, icon: 'magnify-plus-outline', desc: 'Cột & biển báo' },
  { id: 'street', label: '16.5x', name: 'Đường phố', zoom: 16.5, icon: 'road-variant', desc: 'Cấp đường phố' },
  { id: 'area', label: '14.5x', name: 'Khu vực', zoom: 14.5, icon: 'home-city-outline', desc: 'Khu dân cư' },
  { id: 'city', label: '12.0x', name: 'Toàn cảnh', zoom: 12.0, icon: 'city-variant-outline', desc: 'Toàn thành phố' },
] as const;

type ZoomThresholdId = (typeof ZOOM_THRESHOLDS)[number]['id'];

type RevalidationMapParams = {
  selectedSignId?: string;
  snapLon?: string;
  snapLat?: string;
  snapRequestId?: string;
  autoSelectFirst?: string;
  signJson?: string;
  filter?: FreshnessFilter;
};

export function RevalidationMapScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<RevalidationMapParams>();

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

  const [focusCoordinate, setFocusCoordinate] = useState<MapCoordinate | undefined>(initialFocusCoord);
  const [focusRequestId, setFocusRequestId] = useState(initialFocusCoord ? 1 : 0);
  const [activeFilter, setActiveFilter] = useState<FreshnessFilter>(() => {
    if (params.filter) return params.filter;
    if (initialSign) {
      const info = getFreshnessInfo(initialSign);
      if (info.isFresh) return 'FRESH';
      if (info.isModerate) return 'MODERATE';
      return 'NEEDS_REVALIDATION';
    }
    return 'ALL';
  });

  // Zoom control state
  const [zoomLevel, setZoomLevel] = useState<number>(initialFocusCoord ? 17.5 : 16.5);
  const [zoomRequestId, setZoomRequestId] = useState(0);
  const [activeZoomId, setActiveZoomId] = useState<ZoomThresholdId>(initialFocusCoord ? 'detail' : 'street');
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

  const toggleFilter = useCallback((forceState?: boolean) => {
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
  }, [filterSlideAnim]);

  const filterTranslateX = filterSlideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-FILTER_PANEL_WIDTH, 0],
  });

  // Dynamic positioning for floating buttons above sign details or sign list
  const [detailsCardHeight, setDetailsCardHeight] = useState(0);
  const [signListHeight, setSignListHeight] = useState(0);
  const [buttonsTranslateY] = useState(() => new Animated.Value(0));

  // Fetch all revalidation tasks from backend (global, independent of viewport)
  const { data: allRevalTasks = [], isLoading: isLoadingAllTasks } = useGetAllRevalidationTasks(true);

  // Fetch verified signs within current map bounds
  const { data: boundsSigns = [] } = useGetSignsInBounds(bounds, true);

  const taskBounds = useMemo<FindTasksInBoundsParams | undefined>(() => {
    if (!bounds) return undefined;
    return {
      minLat: bounds.minLat,
      minLon: bounds.minLon,
      maxLat: bounds.maxLat,
      maxLon: bounds.maxLon,
    };
  }, [bounds]);

  // Fetch revalidation tasks within current map bounds
  const { data: revalTasks = [] } = useGetRevalidationTasksInBounds(taskBounds, true);

  // Unified list of signs: verified map signs + converted revalidation tasks
  const rawSigns = useMemo(() => {
    const signMap = new Map<string, RouteSign>();

    for (const sign of boundsSigns) {
      signMap.set(sign.id, sign);
    }

    for (const task of allRevalTasks) {
      const converted = revalidationTaskToRouteSign(task);
      const existing = signMap.get(converted.id);
      signMap.set(converted.id, {
        ...(existing ?? {}),
        ...converted,
      });
    }

    for (const task of revalTasks) {
      const converted = revalidationTaskToRouteSign(task);
      const existing = signMap.get(converted.id);
      signMap.set(converted.id, {
        ...(existing ?? {}),
        ...converted,
      });
    }

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

  // Derive selectedSign dynamically: user override > initialSign > selectedSignId > autoSelectFirst
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
    if (params.autoSelectFirst === 'true' && rawSigns.length > 0) {
      const firstStale = rawSigns.find((s) => getFreshnessInfo(s).isStale);
      return firstStale || rawSigns[0] || null;
    }
    return null;
  }, [overrideSign, initialSign, params.selectedSignId, params.autoSelectFirst, rawSigns]);

  // Initial user location fetch (guarded so it doesn't overwrite snap coords from inspect return or work card)
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

  const handleSignPress = useCallback((sign: RouteSign) => {
    lastSignPressTimeRef.current = Date.now();
    setOverrideSign((prev) => {
      const current = prev !== undefined ? prev : selectedSign;
      return current?.id === sign.id ? null : sign;
    });
    setFocusCoordinate(sign.coordinate);
    setFocusRequestId((prev) => prev + 1);
    setIsZoomMenuOpen(false);
  }, [selectedSign]);

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
    const resolvedTaskId = sign.taskId || matchedTask?.id || '';

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
            onPress={() => router.back()}
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
                          <View style={[styles.dropdownItemIcon, { backgroundColor: 'rgba(6, 113, 235, 0.1)' }]}>
                            <MaterialCommunityIcons color={theme.primary} name="sign-caution" size={18} />
                          </View>
                          <View style={styles.dropdownItemTextCol}>
                            <Text numberOfLines={1} style={[styles.dropdownItemTitle, { color: theme.text }]}>
                              {sign.signCode ? `${sign.signCode} - ${sign.name || ''}` : sign.name || 'Biển báo'}
                            </Text>
                            {sign.roadName ? (
                              <Text numberOfLines={1} style={[styles.dropdownItemSubtitle, { color: theme.placeholder }]}>
                                {sign.roadName}
                              </Text>
                            ) : null}
                          </View>
                          <MaterialCommunityIcons color={theme.placeholder} name="chevron-right" size={16} />
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
                          <View style={[styles.dropdownItemIcon, { backgroundColor: `${theme.grey}15` }]}>
                            <MaterialCommunityIcons color={theme.primary} name="map-marker-outline" size={18} />
                          </View>
                          <View style={styles.dropdownItemTextCol}>
                            <Text numberOfLines={1} style={[styles.dropdownItemTitle, { color: theme.text }]}>
                              {place.title}
                            </Text>
                            {place.address ? (
                              <Text numberOfLines={1} style={[styles.dropdownItemSubtitle, { color: theme.placeholder }]}>
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
                      <MaterialCommunityIcons color={theme.placeholder} name="map-marker-off-outline" size={20} />
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
                activeFilter === 'ALL' && [styles.filterOptionItemActive, { backgroundColor: `${theme.primary}16`, borderColor: theme.primary }],
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
                <Text style={[styles.filterOptionBadgeText, { color: activeFilter === 'ALL' ? theme.primary : theme.text }]}>
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
                activeFilter === 'NEEDS_REVALIDATION' && [styles.filterOptionItemActive, { backgroundColor: 'rgba(225, 29, 72, 0.12)', borderColor: '#E11D48' }],
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
              <View style={[styles.filterOptionBadge, { backgroundColor: 'rgba(225, 29, 72, 0.14)' }]}>
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
                activeFilter === 'MODERATE' && [styles.filterOptionItemActive, { backgroundColor: 'rgba(245, 158, 11, 0.12)', borderColor: '#F59E0B' }],
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
              <View style={[styles.filterOptionBadge, { backgroundColor: 'rgba(245, 158, 11, 0.14)' }]}>
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
                activeFilter === 'FRESH' && [styles.filterOptionItemActive, { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderColor: '#10B981' }],
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
              <View style={[styles.filterOptionBadge, { backgroundColor: 'rgba(16, 185, 129, 0.14)' }]}>
                <Text style={[styles.filterOptionBadgeText, { color: '#059669' }]}>
                  {freshCount}
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Protruding Handle on the Right of the Filter Drawer */}
        <Pressable
          accessibilityLabel={isFilterExpanded ? 'Ẩn bộ lọc mức độ khẩn cấp' : 'Hiển thị bộ lọc mức độ khẩn cấp'}
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
                    isSelected && [styles.zoomMenuItemActive, { backgroundColor: `${theme.primary}14` }],
                  ]}
                >
                  <MaterialCommunityIcons
                    color={isSelected ? theme.primary : theme.text}
                    name={item.icon as any}
                    size={18}
                  />
                  <View style={styles.zoomMenuItemText}>
                    <Text style={[styles.zoomItemName, { color: isSelected ? theme.primary : theme.text }]}>
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
            isSignListOpen && { borderColor: '#E11D48', backgroundColor: 'rgba(225, 29, 72, 0.08)' },
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
            isZoomMenuOpen && { borderColor: theme.primary, backgroundColor: theme.backgroundSelected },
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
              <View style={[styles.signListHeaderIcon, { backgroundColor: 'rgba(239, 68, 68, 0.10)' }]}>
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
                        <Image
                          resizeMode="contain"
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
                        <Text numberOfLines={1} style={[styles.signListRowName, { color: theme.text }]}>
                          {item.signCode || 'Biển báo'}
                        </Text>
                        {info.scorePercent !== undefined ? (
                          <View style={[styles.signListScoreBadge, { backgroundColor: 'rgba(239, 68, 68, 0.10)' }]}>
                            <Text style={styles.signListScoreText}>{info.scorePercent}%</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text numberOfLines={1} style={[styles.signListRowLabel, { color: theme.text }]}>
                        {item.name || item.signCode || 'Biển báo chưa xác định'}
                      </Text>
                      {item.roadName ? (
                        <Text numberOfLines={1} style={[styles.signListRowRoad, { color: theme.placeholder }]}>
                          {item.roadName}
                        </Text>
                      ) : null}
                    </View>

                    {/* Chevron */}
                    <MaterialCommunityIcons color={theme.placeholder} name="chevron-right" size={18} />
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
            revalTasks.find(
              (t) => t.verifiedSignId === selectedSign.id || t.id === selectedSign.id,
            )?.id
          }
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.one,
  },
  searchHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  backCircleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#09233C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  searchBarWrapper: {
    flex: 1,
    position: 'relative',
    zIndex: 100,
  },
  searchBarContainer: {
    width: '100%',
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
    shadowColor: '#09233C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '500',
    paddingVertical: 0,
  },
  searchDropdownCard: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    borderRadius: 16,
    borderWidth: 1,
    maxHeight: 300,
    overflow: 'hidden',
    shadowColor: '#09233C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
  },
  searchDropdownScroll: {
    flexGrow: 0,
  },
  dropdownSection: {
    paddingVertical: 4,
  },
  dropdownSectionHeader: {
    fontSize: 10,
    fontFamily: Fonts.sans,
    fontWeight: '800',
    letterSpacing: 0.6,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 4,
  },
  dropdownItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 10,
  },
  dropdownItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownItemTextCol: {
    flex: 1,
    gap: 2,
  },
  dropdownItemTitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '700',
  },
  dropdownItemSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 11,
  },
  dropdownEmptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  dropdownEmptyText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '500',
  },

  /* ── Filter Drawer on Left Edge ─────────────────────── */
  filterDrawerContainer: {
    position: 'absolute',
    left: 0,
    zIndex: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterPanelCard: {
    width: FILTER_PANEL_WIDTH,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 0,
    padding: 12,
    gap: 8,
    shadowColor: '#09233C',
    shadowOffset: { width: 3, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  filterPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterPanelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterPanelTitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  filterPanelCloseBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPanelDivider: {
    height: 1,
  },
  filterOptionsCol: {
    gap: 4,
  },
  filterOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterOptionItemActive: {
    borderWidth: 1,
  },
  filterOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
  },
  filterOptionDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  filterOptionLabel: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '500',
  },
  filterOptionLabelActive: {
    fontWeight: '700',
  },
  filterOptionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
  },
  filterOptionBadgeText: {
    fontFamily: Fonts.sans,
    fontSize: 10,
    fontWeight: '800',
  },
  filterHandleButton: {
    width: 32,
    height: 44,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#09233C',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 5,
    elevation: 5,
  },
  filterHandleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  floatingControlsGroup: {
    position: 'absolute',
    right: 16,
    zIndex: 30,
    alignItems: 'flex-end',
    gap: 10,
  },
  floatingCircleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 4,
  },
  zoomIndicatorBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    elevation: 3,
  },
  zoomIndicatorText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  zoomPopoverMenu: {
    width: 215,
    borderRadius: 16,
    borderWidth: 1.2,
    padding: 10,
    gap: 4,
    marginBottom: 4,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 8,
  },
  zoomMenuTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
    paddingHorizontal: 6,
  },
  zoomMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 8,
  },
  zoomMenuItemActive: {
    backgroundColor: 'rgba(6, 113, 235, 0.1)',
  },
  zoomMenuItemText: {
    flex: 1,
  },
  zoomItemName: {
    fontSize: 13,
    fontWeight: '700',
  },
  zoomItemDesc: {
    fontSize: 10,
  },
  zoomLevelPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  zoomLevelPillText: {
    fontSize: 10,
    fontWeight: '800',
  },

  /* ── Sign List Panel ──────────────────────────────────── */
  signListPanel: {
    position: 'absolute',
    left: 16,
    right: 16,
    maxHeight: 380,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 25,
    overflow: 'hidden',
  },
  signListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
  },
  signListHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  signListHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signListTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  signListSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  signListCloseBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  signListDivider: {
    height: 1,
    marginHorizontal: 14,
  },
  signListScroll: {
    flexGrow: 0,
  },
  signListEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  signListEmptyText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  signListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  signListRowImage: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  signListRowImg: {
    width: 26,
    height: 26,
  },
  signListRowInfo: {
    flex: 1,
    gap: 1,
  },
  signListRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  signListRowName: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  signListRowLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  signListRowRoad: {
    fontSize: 11,
  },
  signListScoreBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  signListScoreText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E11D48',
  },
});
