import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppButton } from '@/components/ui/button';
import { Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { RouteSign } from '@/api/navigation/navigation';
import type { MapCoordinate } from '@/types/navigationType';
import type { FindSignsInBoundsParams } from '@/types/signMapType';
import { useGetSignsInBounds } from '@/feature/navigation/hooks/use-signs';
import { fetchFreshGpsPosition } from '@/feature/navigation/utils/gps';

import { RevalidationMapView } from '../components/revalidation-map-view';
import { getFreshnessInfo } from '../components/revalidation-sign-marker';
import { RevalidationSignDetailsCard } from '../components/revalidation-sign-details-card';

type FreshnessFilter = 'ALL' | 'NEEDS_REVALIDATION' | 'MODERATE' | 'FRESH';

const ZOOM_THRESHOLDS = [
  { id: 'detail', label: '18.5x', name: 'Detail', zoom: 18.5, icon: 'magnify-plus-outline', desc: 'Poles & signs' },
  { id: 'street', label: '16.5x', name: 'Street', zoom: 16.5, icon: 'road-variant', desc: 'Street level' },
  { id: 'area', label: '14.5x', name: 'Area', zoom: 14.5, icon: 'home-city-outline', desc: 'Neighborhood' },
  { id: 'city', label: '12.0x', name: 'City', zoom: 12.0, icon: 'city-variant-outline', desc: 'City overview' },
] as const;

type ZoomThresholdId = (typeof ZOOM_THRESHOLDS)[number]['id'];

export function RevalidationMapScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [bounds, setBounds] = useState<FindSignsInBoundsParams>();
  const [selectedSign, setSelectedSign] = useState<RouteSign | null>(null);
  const [userCoordinate, setUserCoordinate] = useState<MapCoordinate>();
  const [focusCoordinate, setFocusCoordinate] = useState<MapCoordinate>();
  const [focusRequestId, setFocusRequestId] = useState(0);
  const [activeFilter, setActiveFilter] = useState<FreshnessFilter>('ALL');

  // Zoom control state
  const [zoomLevel, setZoomLevel] = useState<number>(16.5);
  const [zoomRequestId, setZoomRequestId] = useState(0);
  const [activeZoomId, setActiveZoomId] = useState<ZoomThresholdId>('street');
  const [isZoomMenuOpen, setIsZoomMenuOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Dynamic positioning for floating buttons above sign details
  const [detailsCardHeight, setDetailsCardHeight] = useState(0);
  const buttonsTranslateY = useRef(new Animated.Value(0)).current;

  // Fetch verified signs within current map bounds
  const { data: rawSigns = [] } = useGetSignsInBounds(bounds, true);

  // Initial user location fetch
  useEffect(() => {
    let isMounted = true;
    void fetchFreshGpsPosition().then((pos) => {
      if (isMounted && pos) {
        setUserCoordinate(pos);
        setFocusCoordinate(pos);
        setFocusRequestId((prev) => prev + 1);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Smoothly animate floating buttons up/down relative to sign details card
  useEffect(() => {
    if (!selectedSign) {
      setDetailsCardHeight(0);
    }
  }, [selectedSign]);

  useEffect(() => {
    const targetOffset = selectedSign
      ? -((detailsCardHeight > 0 ? detailsCardHeight : 240) + 12)
      : 0;

    Animated.spring(buttonsTranslateY, {
      toValue: targetOffset,
      damping: 22,
      mass: 0.8,
      stiffness: 220,
      useNativeDriver: true,
    }).start();
  }, [selectedSign, detailsCardHeight, buttonsTranslateY]);

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
    setSelectedSign((prev) => (prev?.id === sign.id ? null : sign));
    setFocusCoordinate(sign.coordinate);
    setFocusRequestId((prev) => prev + 1);
    setIsZoomMenuOpen(false);
  }, []);

  const handleMapPress = useCallback(() => {
    if (Date.now() - lastSignPressTimeRef.current < 300) {
      return;
    }
    setSelectedSign(null);
    setIsZoomMenuOpen(false);
  }, []);

  // Filter signs based on active freshness tab
  const filteredSigns = useMemo(() => {
    return rawSigns.filter((sign) => {
      const { isStale, isModerate, isFresh } = getFreshnessInfo(sign);
      if (activeFilter === 'NEEDS_REVALIDATION') return isStale;
      if (activeFilter === 'MODERATE') return isModerate;
      if (activeFilter === 'FRESH') return isFresh;
      return true;
    });
  }, [rawSigns, activeFilter]);

  // Statistics for header summary
  const staleCount = useMemo(() => {
    return rawSigns.filter((s) => getFreshnessInfo(s).isStale).length;
  }, [rawSigns]);

  const moderateCount = useMemo(() => {
    return rawSigns.filter((s) => getFreshnessInfo(s).isModerate).length;
  }, [rawSigns]);

  const freshCount = useMemo(() => {
    return rawSigns.filter((s) => getFreshnessInfo(s).isFresh).length;
  }, [rawSigns]);

  const handleRevalidateAction = (sign: RouteSign) => {
    // =========================================================================
    // TODO: Implement action API call (submit revalidation evidence / trigger re-evaluation task)
    // once the backend APIs are provided.
    // Example: await submitRevalidationEvidence(sign.id, { latitude, longitude, image });
    // =========================================================================
    console.log('[Revalidation] Action triggered for sign:', sign.id, sign.signCode);
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

      {/* Compact Floating Header UI */}
      <SafeAreaView edges={['top']} pointerEvents="box-none" style={styles.topOverlay}>
        <View
          style={[
            styles.headerCard,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
            },
          ]}
        >
          {/* Top Row: Back button + Title & Nearby Count */}
          <View style={styles.headerTopRow}>
            <Pressable
              accessibilityLabel="Back to Work"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => router.back()}
              style={[styles.backButton, { backgroundColor: theme.background }]}
            >
              <MaterialCommunityIcons color={theme.text} name="arrow-left" size={18} />
            </Pressable>

            <View style={styles.titleContainer}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>Revalidation</Text>
              <Text style={[styles.headerSubtitle, { color: theme.grey }]}>
                {rawSigns.length} signs nearby
              </Text>
            </View>
          </View>

          {/* Compact Segmented Filter Pills */}
          <View style={styles.filterRow}>
            <Pressable
              accessibilityLabel={`Show all ${rawSigns.length} signs`}
              accessibilityRole="button"
              onPress={() => setActiveFilter('ALL')}
              style={[
                styles.filterChip,
                activeFilter === 'ALL' && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: activeFilter === 'ALL' ? '#FFFFFF' : theme.text },
                ]}
              >
                All {rawSigns.length}
              </Text>
            </Pressable>

            <Pressable
              accessibilityLabel={`Show ${staleCount} signs needing review`}
              accessibilityRole="button"
              onPress={() => setActiveFilter('NEEDS_REVALIDATION')}
              style={[
                styles.filterChip,
                activeFilter === 'NEEDS_REVALIDATION' && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color: activeFilter === 'NEEDS_REVALIDATION' ? '#FFFFFF' : '#EF4444',
                  },
                ]}
              >
                Needs review {staleCount}
              </Text>
            </Pressable>

            <Pressable
              accessibilityLabel={`Show ${moderateCount} moderate signs`}
              accessibilityRole="button"
              onPress={() => setActiveFilter('MODERATE')}
              style={[
                styles.filterChip,
                activeFilter === 'MODERATE' && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color: activeFilter === 'MODERATE' ? '#FFFFFF' : theme.text,
                  },
                ]}
              >
                Moderate {moderateCount}
              </Text>
            </Pressable>

            <Pressable
              accessibilityLabel={`Show ${freshCount} fresh signs`}
              accessibilityRole="button"
              onPress={() => setActiveFilter('FRESH')}
              style={[
                styles.filterChip,
                activeFilter === 'FRESH' && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color: activeFilter === 'FRESH' ? '#FFFFFF' : theme.text,
                  },
                ]}
              >
                Fresh {freshCount}
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

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
            <Text style={[styles.zoomMenuTitle, { color: theme.grey }]}>MAP ZOOM LEVEL</Text>
            {ZOOM_THRESHOLDS.map((item) => {
              const isSelected = activeZoomId === item.id;
              return (
                <Pressable
                  accessibilityLabel={`Set zoom level to ${item.name} (${item.label})`}
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

        {/* Button 1: Modify Zoom Level by Selectable Threshold */}
        <Pressable
          accessibilityLabel="Modify map zoom level by selectable threshold"
          accessibilityRole="button"
          onPress={() => setIsZoomMenuOpen((prev) => !prev)}
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
          accessibilityLabel="Snap to current location"
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

      {/* Selected Sign Details Bottom Card */}
      {selectedSign ? (
        <RevalidationSignDetailsCard
          onCardHeightChange={setDetailsCardHeight}
          onClose={() => setSelectedSign(null)}
          onRevalidate={handleRevalidateAction}
          sign={selectedSign}
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
    zIndex: 10,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.one,
  },
  headerCard: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    gap: 8,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  filterChipActive: {
    backgroundColor: '#0671EB',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
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
});
