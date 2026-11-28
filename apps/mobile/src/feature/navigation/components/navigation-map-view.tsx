import type { CameraRef, MapRef, StyleSpecification } from '@maplibre/maplibre-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import {
  type MapCoordinate,
  type PreviousLocation,
  type VehicleMode,
  type InstalledOfflineMapPack,
} from '@/types/navigationType';
import type { RouteSign } from '@/api/navigation/navigation';
import type { FindSignsInBoundsParams } from '@/types/signMapType';
import { useTheme } from '@/hooks/use-theme';
import { getMapLibre, type MapLibreModule } from '@/services/maplibre';
import { offlineMapService } from '@/services/offline-map-service';
import { MAP_BUILD_REQUIRED_DESCRIPTION, MAP_BUILD_REQUIRED_TITLE } from '@/constants/message';
import {
  calculateDistanceMeters,
  getRemainingRouteCoordinates,
  getRouteForwardBearing,
  getSmallestAngleDiffDegrees,
  isValidCoordinate,
} from '../utils/geo';
import {
  useGetSignEvidences,
  useGetTaskEvidences,
} from '@/feature/revalidation/hooks/use-revalidation';
import { resolveImageUrl } from '../utils/signs';
import { formatDate } from '@/utils/format-date';
import { formatFreshnessScore } from '@/utils/freshness';
import { MapLocationPin, type MapLocationPinProps } from './map-location-pin';

export { MapLocationPin, type MapLocationPinProps };

type NavigationMapViewProps = {
  onBoundsChange?: (bounds: FindSignsInBoundsParams) => void;
  destination?: PreviousLocation;
  focusCoordinate?: MapCoordinate;
  focusRequestId?: number;
  navigationActive?: boolean;
  routeCoordinates?: MapCoordinate[];
  routeStart?: MapCoordinate;
  routeSigns?: RouteSign[];
  signs?: RouteSign[];
  showCurrentLocation?: boolean;
  isNavigatingFeature?: boolean;
  userCoordinate?: MapCoordinate;
  hasLiveLocation?: boolean;
  isCustomStart?: boolean;
  onSignSelect?: (sign: RouteSign | null) => void;
  vehicleMode?: VehicleMode['id'] | string;
  locationPin?: MapCoordinate;
  locationPinColor?: string;
  showFocusPin?: boolean;
};

import { env } from '@/config/env';
import { styles } from '@/feature/navigation/styles/navigation-map-view.styles';

const mapTileUrl = env.mapTileUrl;

function getRouteBounds(start: MapCoordinate, destination: MapCoordinate) {
  return [
    Math.min(start[0], destination[0]),
    Math.min(start[1], destination[1]),
    Math.max(start[0], destination[0]),
    Math.max(start[1], destination[1]),
  ] as [west: number, south: number, east: number, north: number];
}

function loadMapLibre(): MapLibreModule | null {
  return getMapLibre();
}

const openStreetMapStyle: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: [mapTileUrl],
      tileSize: 256,
      attribution: 'Esri, HERE, Garmin, USGS, OpenStreetMap contributors, GIS user community',
    },
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
    },
  ],
};

// ─── Sign callout tooltip & freshness ────────────────────────────────────────

export function getSignFreshness(freshnessScore?: number | string | null, status?: string) {
  return formatFreshnessScore(freshnessScore, status);
}

type SignCalloutProps = {
  sign: RouteSign;
  freshness: ReturnType<typeof getSignFreshness>;
};

function SignCalloutImage({ imageUrl, title }: { imageUrl?: string; title: string }) {
  const [hasError, setHasError] = useState(false);
  if (!imageUrl || hasError) return null;

  return (
    <ExpoImage
      accessibilityLabel={title}
      source={{ uri: imageUrl }}
      onError={() => setHasError(true)}
      contentFit="contain"
      style={styles.calloutImage}
    />
  );
}

function SignMarkerIcon({
  imageUrl,
  actualCropUrl,
  name,
  signCode,
}: {
  imageUrl?: string;
  actualCropUrl?: string;
  name?: string;
  signCode?: string;
}) {
  const [triedActualCrop, setTriedActualCrop] = useState(false);
  const [hasError, setHasError] = useState(false);

  const activeUrl =
    !triedActualCrop && imageUrl
      ? imageUrl
      : actualCropUrl && actualCropUrl !== imageUrl
        ? actualCropUrl
        : null;

  if (!activeUrl || hasError) {
    return (
      <View style={styles.fallbackSignBadge}>
        <MaterialCommunityIcons color="#023C69" name="traffic-light" size={20} />
      </View>
    );
  }

  return (
    <ExpoImage
      accessibilityLabel={name || signCode}
      key={activeUrl}
      source={{ uri: activeUrl }}
      onError={() => {
        if (!triedActualCrop && actualCropUrl && actualCropUrl !== imageUrl) {
          setTriedActualCrop(true);
        } else {
          setHasError(true);
        }
      }}
      contentFit="contain"
      style={styles.stopSignImage}
    />
  );
}

function SignCallout({ sign, freshness }: SignCalloutProps) {
  const theme = useTheme();
  const signTitle = sign.name || sign.signCode || 'Traffic Sign';

  return (
    <View style={styles.calloutWrapper}>
      <View
        style={[
          styles.calloutCard,
          {
            backgroundColor: theme.backgroundElement,
            shadowColor: '#09233C',
          },
        ]}
      >
        <View style={styles.calloutImageContainer}>
          <SignCalloutImage imageUrl={sign.imageUrl} title={signTitle} />
          <View style={[styles.calloutImageFreshnessDot, { backgroundColor: freshness.color }]} />
        </View>
        <View style={styles.calloutText}>
          <Text numberOfLines={2} style={[styles.calloutTitle, { color: theme.text }]}>
            {signTitle}
          </Text>

          <View style={styles.calloutFreshnessRow}>
            <View style={[styles.calloutFreshnessMiniDot, { backgroundColor: freshness.color }]} />
            <Text style={[styles.calloutFreshnessScore, { color: freshness.color }]}>
              {freshness.label}
            </Text>
          </View>
        </View>
        {sign.actualCropUrl && sign.actualCropUrl !== sign.imageUrl ? (
          <ExpoImage
            accessibilityLabel="Ảnh thực địa camera"
            source={{ uri: sign.actualCropUrl }}
            style={styles.calloutActualCrop}
            contentFit="cover"
          />
        ) : null}
      </View>
      <View style={[styles.calloutArrow, { borderTopColor: theme.backgroundElement }]} />
    </View>
  );
}

// ─── Non-modal Bottom Sheet (Browsing mode, no destination) ───────────────────

type SignDetailsBottomSheetProps = {
  sign: RouteSign;
  onClose: () => void;
};

function SignDetailsBottomSheet({ sign, onClose }: SignDetailsBottomSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null);

  const resolvedTaskId = sign.taskId || (sign.id.startsWith('reval-') ? sign.id : undefined);
  const { data: taskEvidences = [] } = useGetTaskEvidences(resolvedTaskId, Boolean(resolvedTaskId));
  const { data: signEvidences = [] } = useGetSignEvidences(sign.id, Boolean(sign.id));

  // Merge evidences from both sign and task, deduplicating by id or mediaUrl
  const evidences = useMemo(() => {
    const combined = [...signEvidences, ...taskEvidences];
    const seen = new Set<string>();
    return combined.filter((ev) => {
      const key = ev.id || ev.mediaUrl;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [signEvidences, taskEvidences]);

  const slideAnim = useRef(new Animated.Value(180)).current;

  useEffect(() => {
    slideAnim.setValue(180);
    Animated.spring(slideAnim, {
      toValue: 0,
      damping: 24,
      stiffness: 260,
      useNativeDriver: true,
    }).start();
  }, [sign.id, slideAnim]);

  const freshness = getSignFreshness(sign.freshnessScore, sign.status);

  const signCode = sign.signCode?.trim();
  const signName = (sign.nameVi || sign.name || sign.nameEn || '').trim();
  const signTitle =
    signCode && signName && !signName.toLowerCase().includes(signCode.toLowerCase())
      ? `${signName} - ${signCode}`
      : signName || signCode || 'Biển báo giao thông';

  const verifiedImages = useMemo(() => {
    const list: { id: string; uri: string; label: string; date?: string }[] = [];
    const seenUris = new Set<string>();

    // 1. Whole frame image (dashcam / camera full view)
    const wholeFrame = sign.frameUrl ? resolveImageUrl(sign.frameUrl) : '';
    if (wholeFrame && !seenUris.has(wholeFrame)) {
      seenUris.add(wholeFrame);
      const frameDate = formatDate(sign.createdAt || sign.lastVerifiedAt);
      list.push({
        id: 'whole-frame',
        uri: wholeFrame,
        date: frameDate,
        label: frameDate || 'Ảnh thực địa',
      });
    }

    // 2. Surveyor revalidation evidences (full camera photos from revalidation)
    for (const ev of evidences) {
      if (ev.mediaUrl && !seenUris.has(ev.mediaUrl)) {
        seenUris.add(ev.mediaUrl);
        const evDate = formatDate(ev.capturedAt || ev.submittedAt);
        list.push({
          id: ev.id,
          uri: ev.mediaUrl,
          date: evDate,
          label: evDate || 'Ảnh tái thẩm định',
        });
      }
    }

    // 3. Cropped sign image
    const actualCrop = sign.actualCropUrl ? resolveImageUrl(sign.actualCropUrl) : '';
    if (actualCrop && !seenUris.has(actualCrop)) {
      seenUris.add(actualCrop);
      const cropDate = formatDate(sign.createdAt || sign.lastVerifiedAt);
      list.push({
        id: 'actual-crop',
        uri: actualCrop,
        date: cropDate,
        label: cropDate || 'Ảnh thực địa',
      });
    }

    // 4. Fallback to official sign image if no camera crops exist
    if (list.length === 0 && sign.imageUrl) {
      list.push({
        id: 'official-sign',
        uri: sign.imageUrl,
        date: '',
        label: 'Biển báo chuẩn',
      });
    }

    return list;
  }, [
    sign.frameUrl,
    sign.actualCropUrl,
    sign.imageUrl,
    sign.createdAt,
    sign.lastVerifiedAt,
    evidences,
  ]);

  return (
    <Animated.View
      onStartShouldSetResponder={() => true}
      onTouchEnd={(e) => e.stopPropagation()}
      style={[
        styles.bottomSheetContainer,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
          paddingBottom: Math.max(16, insets.bottom + 8),
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Drag Indicator Bar */}
      <View style={styles.sheetHandleBar}>
        <View style={[styles.sheetHandlePill, { backgroundColor: theme.border }]} />
      </View>

      {/* 1. Header row: sign image, sign name - sign code, x button in far right corner */}
      <View style={styles.sheetHeaderRow}>
        <View
          style={[
            styles.sheetSignIconContainer,
            { backgroundColor: theme.background, borderColor: theme.border },
          ]}
        >
          <ExpoImage
            accessibilityLabel={signTitle}
            contentFit="contain"
            source={{ uri: sign.imageUrl ?? verifiedImages[0].uri }}
            style={styles.sheetSignIcon}
          />
        </View>

        <View style={styles.sheetHeaderInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.one }}>
            <Text numberOfLines={2} style={[styles.sheetSignTitle, { color: theme.text }]}>
              {signTitle}
            </Text>
          </View>
          <View style={styles.sheetFreshnessRow}>
            <Text style={[styles.sheetFreshnessText, { color: freshness.color }]}>
              {freshness.label}
            </Text>
            {sign.roadName ? (
              <>
                <Text style={[styles.sheetDotSeparator, { color: theme.textSecondary }]}>•</Text>
                <Text
                  numberOfLines={1}
                  style={[styles.sheetRoadName, { color: theme.textSecondary }]}
                >
                  {sign.roadName}
                </Text>
              </>
            ) : null}
          </View>
        </View>

        <Pressable
          accessibilityLabel="Đóng thông tin biển báo"
          accessibilityRole="button"
          hitSlop={12}
          onPress={onClose}
          style={[
            styles.sheetCloseBtn,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}
        >
          <MaterialCommunityIcons color={theme.text} name="close" size={18} />
        </Pressable>
      </View>

      {/* 2. Text(Verified sign images) */}
      <View style={styles.sheetSectionHeader}>
        <Text style={[styles.sheetSectionTitle, { color: theme.text }]}>
          Ảnh biển báo đã xác thực
        </Text>
      </View>

      {/* 3. Carousel of verified images about that sign */}
      {verifiedImages.length > 0 ? (
        <ScrollView
          contentContainerStyle={styles.carouselContainer}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {verifiedImages.map((item, index) => (
            <Pressable
              accessibilityLabel={`Xem ảnh ${item.label}`}
              accessibilityRole="button"
              key={item.id || `${item.uri}-${index}`}
              onPress={() => setSelectedPreviewImage(item.uri)}
              style={[
                styles.carouselCard,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}
            >
              <ExpoImage
                contentFit="cover"
                source={{ uri: item.uri }}
                style={styles.carouselImage}
                transition={200}
              />
              <View style={styles.carouselLabelBadge}>
                {item.date ? (
                  <MaterialCommunityIcons
                    color="#FFFFFF"
                    name="calendar-clock-outline"
                    size={11}
                    style={{ marginRight: 3 }}
                  />
                ) : null}
                <Text numberOfLines={1} style={styles.carouselLabelText}>
                  {item.label}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <View style={[styles.carouselEmptyBox, { borderColor: theme.border }]}>
          <MaterialCommunityIcons color={theme.textSecondary} name="image-off-outline" size={24} />
          <Text style={[styles.carouselEmptyText, { color: theme.textSecondary }]}>
            Chưa có ảnh thực địa được xác thực
          </Text>
        </View>
      )}

      {/* Fullscreen Image Preview Modal */}
      {selectedPreviewImage ? (
        <Modal
          animationType="fade"
          onRequestClose={() => setSelectedPreviewImage(null)}
          transparent
          visible={Boolean(selectedPreviewImage)}
        >
          <View style={styles.modalBackdrop}>
            <Pressable
              accessibilityLabel="Đóng xem ảnh"
              accessibilityRole="button"
              onPress={() => setSelectedPreviewImage(null)}
              style={styles.modalCloseBtn}
            >
              <MaterialCommunityIcons color="#FFFFFF" name="close" size={24} />
            </Pressable>
            <ExpoImage
              contentFit="contain"
              source={{ uri: selectedPreviewImage }}
              style={styles.modalImage}
            />
            {(() => {
              const previewItem = verifiedImages.find((img) => img.uri === selectedPreviewImage);
              return previewItem?.date ? (
                <View style={styles.modalDateBadge}>
                  <MaterialCommunityIcons
                    color="#FFFFFF"
                    name="calendar-clock-outline"
                    size={14}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.modalDateText}>Ngày ghi nhận: {previewItem.date}</Text>
                </View>
              ) : null;
            })()}
          </View>
        </Modal>
      ) : null}
    </Animated.View>
  );
}

// ─── Main map view ───────────────────────────────────────────────────────────

export function NavigationMapView({
  onBoundsChange,
  destination,
  focusCoordinate,
  focusRequestId = 0,
  navigationActive = false,
  routeCoordinates,
  routeStart,
  routeSigns = [],
  signs,
  showCurrentLocation = true,
  userCoordinate,
  hasLiveLocation = false,
  isCustomStart = false,
  onSignSelect,
  vehicleMode = 'DRIVING',
  locationPin,
  locationPinColor,
  showFocusPin = false,
}: NavigationMapViewProps) {
  const theme = useTheme();
  const effectiveLocationPin = locationPin ?? (showFocusPin ? focusCoordinate : undefined);
  const hasValidLocationPin = isValidCoordinate(effectiveLocationPin);
  const isMotorcycle = vehicleMode === 'MOTORCYCLE' || vehicleMode === 'BIKE';
  const isBicycle = vehicleMode === 'CYCLING';
  const isWalking = vehicleMode === 'WALKING';
  const routeLineColor = isWalking
    ? '#10B981'
    : isBicycle
      ? '#F59E0B'
      : isMotorcycle
        ? '#0D9488'
        : theme.primary;
  const routeCasingColor = isWalking
    ? '#064E3B'
    : isBicycle
      ? '#78350F'
      : isMotorcycle
        ? '#042F2E'
        : '#1E3A8A';
  const mapRef = useRef<MapRef>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSignPressTimeRef = useRef<number>(0);
  const lastSignPressIdRef = useRef<string | null>(null);
  const [selectedSignId, setSelectedSignId] = useState<string | null>(null);
  const [activeOfflinePack, setActiveOfflinePack] = useState<InstalledOfflineMapPack | null>(null);
  // Tracks whether the navigation Camera's native view is ready to receive setStop commands.
  // When navigationActive flips on the Camera key changes, causing a remount — calling
  // setStop before the native view is attached causes the 'reactTag null' crash.
  const cameraReadyRef = useRef(false);

  useEffect(() => {
    void offlineMapService.getActiveOfflinePack().then(setActiveOfflinePack);
    const unsub = offlineMapService.subscribeToMetadata((meta) => {
      const active = meta.activePackId ? meta.installedPacks[meta.activePackId] || null : null;
      setActiveOfflinePack(active);
    });
    return unsub;
  }, []);

  // Reset selected callout when route origin or destination changes (e.g. route swap)
  useEffect(() => {
    setSelectedSignId(null);
  }, [destination?.id, routeStart?.[0], routeStart?.[1]]);

  // Auto-dismiss the callout after 4 seconds ONLY when a destination is selected
  useEffect(() => {
    if (!selectedSignId || !destination) return;

    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = setTimeout(() => {
      setSelectedSignId(null);
      onSignSelect?.(null);
    }, 4000);

    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [selectedSignId, destination, onSignSelect]);

  const handleSignPress = useCallback(
    (sign: RouteSign) => {
      if (!sign || !sign.id) return;
      const now = Date.now();
      // Guard against duplicate synthetic press events (e.g. Marker and inner Pressable firing in same frame)
      if (lastSignPressIdRef.current === sign.id && now - lastSignPressTimeRef.current < 400) {
        return;
      }
      lastSignPressTimeRef.current = now;
      lastSignPressIdRef.current = sign.id;

      const nextId = selectedSignId === sign.id ? null : sign.id;
      setSelectedSignId(nextId);
      onSignSelect?.(nextId ? sign : null);
    },
    [selectedSignId, onSignSelect],
  );

  const sortedRouteSigns = useMemo(() => {
    const effectiveRouteSigns = routeSigns.length > 0 ? routeSigns : (signs ?? []);
    // 1. Deduplicate signs at identical coordinates with the same sign type/code,
    // prioritizing the one with the highest freshness score. Keep order stable across taps
    // so native Marker views never reorder or shift when selected.
    const dedup: Record<string, RouteSign> = {};
    for (const sign of effectiveRouteSigns) {
      if (!Array.isArray(sign.coordinate) || sign.coordinate.length < 2) continue;
      const key = `${sign.coordinate[0].toFixed(5)},${sign.coordinate[1].toFixed(5)}_${sign.signCode || sign.name || ''}`;
      const existing = dedup[key];
      if (!existing) {
        dedup[key] = sign;
      } else {
        const existingScore = existing.freshnessScore ?? 0;
        const currentScore = sign.freshnessScore ?? 0;
        if (currentScore > existingScore) {
          dedup[key] = sign;
        }
      }
    }

    // 2. Sort stably by freshness score so lower freshness signs are drawn first.
    return Object.values(dedup).sort((a: RouteSign, b: RouteSign) => {
      return (a.freshnessScore ?? 0) - (b.freshnessScore ?? 0);
    });
  }, [routeSigns, signs]);

  const selectedSign = useMemo(
    () => (selectedSignId ? (sortedRouteSigns.find((s) => s.id === selectedSignId) ?? null) : null),
    [sortedRouteSigns, selectedSignId],
  );

  const reportBounds = ([minLon, minLat, maxLon, maxLat]: [number, number, number, number]) => {
    onBoundsChange?.({ minLon, minLat, maxLon, maxLat });
  };

  const handleMapPress = async (event: any) => {
    // If a sign marker was tapped within the last 450ms, ignore map background tap
    if (Date.now() - lastSignPressTimeRef.current < 450) {
      return;
    }

    const clickLngLat: [number, number] | undefined = event?.nativeEvent?.lngLat ?? event?.lngLat;
    const clickPoint: [number, number] | undefined = event?.nativeEvent?.point ?? event?.point;

    if (sortedRouteSigns.length > 0) {
      // 1. Screen-pixel distance hit test (most accurate for touch interaction)
      if (
        clickPoint &&
        Array.isArray(clickPoint) &&
        clickPoint.length >= 2 &&
        mapRef.current?.project
      ) {
        try {
          let bestSign: RouteSign | null = null;
          let bestDist = Number.POSITIVE_INFINITY;

          for (const sign of sortedRouteSigns) {
            if (!Array.isArray(sign.coordinate) || sign.coordinate.length < 2) continue;
            const projected = await mapRef.current.project(sign.coordinate);
            if (projected && Array.isArray(projected) && projected.length >= 2) {
              const dx = projected[0] - clickPoint[0];
              // Marker anchor is 'bottom', height is 36dp. Icon center is ~18dp above coordinate.
              const dy = projected[1] - 18 - clickPoint[1];
              const dist = Math.hypot(dx, dy);
              if (dist < bestDist && dist <= 38) {
                bestDist = dist;
                bestSign = sign;
              }
            }
          }

          if (bestSign) {
            handleSignPress(bestSign);
            return;
          }
        } catch {
          // If project fails, fall through to geo distance
        }
      }

      // 2. Geographic distance fallback (within ~35 meters)
      if (clickLngLat && Array.isArray(clickLngLat) && clickLngLat.length >= 2) {
        let closestSign: RouteSign | null = null;
        let minDistance = Number.POSITIVE_INFINITY;

        for (const sign of sortedRouteSigns) {
          if (!Array.isArray(sign.coordinate) || sign.coordinate.length < 2) continue;
          const d = calculateDistanceMeters(clickLngLat, sign.coordinate);
          if (d < minDistance) {
            minDistance = d;
            closestSign = sign;
          }
        }

        if (closestSign && minDistance <= 35) {
          handleSignPress(closestSign);
          return;
        }
      }
    }

    setSelectedSignId(null);
    onSignSelect?.(null);
  };
  const mapLibre = loadMapLibre();
  // The camera only targets destination when available; if neither destination
  // nor focusCoordinate is set, no Camera is mounted (avoids snapping to the
  // hardcoded mock coordinate).
  const cameraCenter = destination?.coordinate;
  const routeBounds = useMemo(() => {
    if (routeCoordinates && routeCoordinates.length > 1) {
      let minLon = Number.POSITIVE_INFINITY;
      let minLat = Number.POSITIVE_INFINITY;
      let maxLon = Number.NEGATIVE_INFINITY;
      let maxLat = Number.NEGATIVE_INFINITY;
      for (const [lon, lat] of routeCoordinates) {
        if (lon < minLon) minLon = lon;
        if (lat < minLat) minLat = lat;
        if (lon > maxLon) maxLon = lon;
        if (lat > maxLat) maxLat = lat;
      }
      if (Number.isFinite(minLon) && Number.isFinite(minLat)) {
        const dLon = maxLon - minLon;
        const dLat = maxLat - minLat;
        const padLon = dLon < 0.001 ? 0.001 : 0;
        const padLat = dLat < 0.001 ? 0.001 : 0;
        return [minLon - padLon, minLat - padLat, maxLon + padLon, maxLat + padLat] as [
          number,
          number,
          number,
          number,
        ];
      }
    }
    return destination && routeStart ? getRouteBounds(routeStart, destination.coordinate) : null;
  }, [destination, routeCoordinates, routeStart]);
  const displayedRouteCoordinates = useMemo(() => {
    if (!routeCoordinates?.length) return undefined;
    if (!navigationActive || !userCoordinate) return routeCoordinates;
    return getRemainingRouteCoordinates(routeCoordinates, userCoordinate);
  }, [navigationActive, routeCoordinates, userCoordinate]);

  const routeGeoJson = useMemo(() => {
    if (!displayedRouteCoordinates || displayedRouteCoordinates.length < 2) return null;
    return {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: displayedRouteCoordinates,
      },
    };
  }, [displayedRouteCoordinates]);

  // Initial forward bearing aligned with the route ahead when navigation begins
  const initialForwardBearing = useMemo(() => {
    const origin = userCoordinate ?? routeStart;
    return getRouteForwardBearing(origin, routeCoordinates);
    // Keep initialViewState bearing anchored when navigation is already active
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigationActive, routeStart]);

  const cameraRef = useRef<CameraRef>(null);
  const lockedBearingRef = useRef<number | null>(null);
  const pendingTurnRef = useRef<{ bearing: number; count: number } | null>(null);
  const lastCameraCenterRef = useRef<MapCoordinate | null>(null);
  const lastRouteSignatureRef = useRef<string | null>(null);
  const navParamsRef = useRef({ cameraCenter, routeCoordinates, routeStart, userCoordinate });
  useEffect(() => {
    navParamsRef.current = { cameraCenter, routeCoordinates, routeStart, userCoordinate };
  }, [cameraCenter, routeCoordinates, routeStart, userCoordinate]);

  // Imperatively command the camera into Google Maps 3D navigation perspective.
  // Locks camera heading to user's initial route direction until an actual turn or re-center occurs.
  useEffect(() => {
    if (!navigationActive) {
      cameraReadyRef.current = false;
      lockedBearingRef.current = null;
      pendingTurnRef.current = null;
      lastCameraCenterRef.current = null;
      lastRouteSignatureRef.current = null;
      return;
    }

    const {
      cameraCenter: curCameraCenter,
      routeCoordinates: curRouteCoordinates,
      routeStart: curRouteStart,
      userCoordinate: curUserCoordinate,
    } = navParamsRef.current;
    const origin = curUserCoordinate ?? curRouteStart ?? curCameraCenter;
    const bearing = getRouteForwardBearing(origin, curRouteCoordinates);
    lockedBearingRef.current = bearing;
    pendingTurnRef.current = null;
    if (origin) {
      lastCameraCenterRef.current = origin;
    }
    if (curRouteCoordinates?.length) {
      const first = curRouteCoordinates[0];
      const last = curRouteCoordinates[curRouteCoordinates.length - 1];
      lastRouteSignatureRef.current = `${first?.[0]},${first?.[1]}:${last?.[0]},${last?.[1]}:${curRouteCoordinates.length}`;
    }

    const triggerFly = () => {
      if (!cameraReadyRef.current) return;
      cameraRef.current?.setStop({
        center: origin,
        zoom: 18,
        pitch: 55,
        bearing: lockedBearingRef.current ?? bearing,
        padding: {
          bottom: 220,
          left: 24,
          right: 24,
          top: 100,
        },
        duration: 1200,
        easing: 'fly',
      });
    };

    const t0 = setTimeout(() => {
      cameraReadyRef.current = true;
      triggerFly();
    }, 300);
    const t1 = setTimeout(triggerFly, 600);
    const t2 = setTimeout(triggerFly, 1000);

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [navigationActive, focusRequestId]);

  // Lock map heading along the user's travel axis and rotate only on genuine turns or route changes
  useEffect(() => {
    if (!navigationActive || !userCoordinate || !cameraReadyRef.current) return;

    const currentRouteSig = routeCoordinates?.length
      ? `${routeCoordinates[0]?.[0]},${routeCoordinates[0]?.[1]}:${routeCoordinates[routeCoordinates.length - 1]?.[0]},${routeCoordinates[routeCoordinates.length - 1]?.[1]}:${routeCoordinates.length}`
      : null;
    const didRouteChange =
      Boolean(currentRouteSig) && currentRouteSig !== lastRouteSignatureRef.current;
    if (didRouteChange) {
      lastRouteSignatureRef.current = currentRouteSig;
    }

    const movedMeters = lastCameraCenterRef.current
      ? calculateDistanceMeters(lastCameraCenterRef.current, userCoordinate)
      : Number.POSITIVE_INFINITY;

    // Ignore stationary GPS jitter (< 3m) unless a reroute produced a new route
    if (movedMeters < 3 && !didRouteChange) return;

    const candidateBearing = getRouteForwardBearing(userCoordinate, routeCoordinates);
    if (lockedBearingRef.current === null || didRouteChange) {
      lockedBearingRef.current = candidateBearing;
      pendingTurnRef.current = null;
    } else {
      const angleDiff = getSmallestAngleDiffDegrees(candidateBearing, lockedBearingRef.current);
      if (angleDiff >= 40) {
        lockedBearingRef.current = candidateBearing;
        pendingTurnRef.current = null;
      } else if (angleDiff >= 25) {
        if (
          pendingTurnRef.current &&
          getSmallestAngleDiffDegrees(candidateBearing, pendingTurnRef.current.bearing) < 20
        ) {
          pendingTurnRef.current.count += 1;
        } else {
          pendingTurnRef.current = { bearing: candidateBearing, count: 1 };
        }
        if (pendingTurnRef.current.count >= 2) {
          lockedBearingRef.current = candidateBearing;
          pendingTurnRef.current = null;
        }
      } else {
        // Keep current heading locked when moving straight (< 25 deg deviation)
        pendingTurnRef.current = null;
      }
    }

    lastCameraCenterRef.current = userCoordinate;
    cameraRef.current?.setStop({
      center: userCoordinate,
      zoom: 18,
      pitch: 55,
      bearing: lockedBearingRef.current,
      padding: {
        bottom: 220,
        left: 24,
        right: 24,
        top: 100,
      },
      duration: 600,
      easing: 'ease',
    });
  }, [navigationActive, userCoordinate, routeCoordinates]);

  if (!mapLibre) {
    return (
      <View style={[styles.fallback, { backgroundColor: theme.background }]}>
        <View style={[styles.fallbackPanel, { backgroundColor: theme.backgroundElement }]}>
          <Text style={[styles.fallbackTitle, { color: theme.text }]}>
            {MAP_BUILD_REQUIRED_TITLE}
          </Text>
          <Text style={[styles.fallbackCopy, { color: theme.textSecondary }]}>
            {MAP_BUILD_REQUIRED_DESCRIPTION}
          </Text>
        </View>
      </View>
    );
  }

  const { Camera, GeoJSONSource, Layer, Map, Marker, UserLocation } = mapLibre;

  return (
    <View style={styles.container}>
      <Map
        ref={mapRef}
        onPress={handleMapPress}
        onRegionDidChange={(event: { nativeEvent: { bounds: [number, number, number, number] } }) =>
          reportBounds(event.nativeEvent.bounds)
        }
        onDidFinishLoadingMap={() => {
          void mapRef.current
            ?.getBounds()
            .then(reportBounds)
            .catch(() => {
              // The next region change reports bounds if the map is not ready yet.
            });
        }}
        attribution
        attributionPosition={{ bottom: 8, right: 8 }}
        compass
        compassPosition={{ top: 112, right: 16 }}
        logo={false}
        mapStyle={openStreetMapStyle}
        style={styles.map}
        touchPitch={navigationActive}
        touchRotate={navigationActive}
      >
        {navigationActive ? (
          <Camera
            ref={cameraRef}
            initialViewState={
              (userCoordinate ?? routeStart)
                ? {
                    center: (userCoordinate ?? routeStart)!,
                    zoom: 18,
                    pitch: 55,
                    bearing: initialForwardBearing,
                    padding: {
                      bottom: 220,
                      left: 24,
                      right: 24,
                      top: 100,
                    },
                  }
                : undefined
            }
            key="navigation-active-camera"
            maxZoom={19}
            minZoom={11}
          />
        ) : focusCoordinate ? (
          <Camera
            center={focusCoordinate}
            duration={700}
            easing="fly"
            key={`focus-${focusRequestId}`}
            maxZoom={19}
            minZoom={11}
            zoom={16}
          />
        ) : hasValidLocationPin ? (
          <Camera
            center={effectiveLocationPin}
            duration={700}
            easing="fly"
            key={`location-pin-${focusRequestId}-${effectiveLocationPin[0]}-${effectiveLocationPin[1]}`}
            maxZoom={19}
            minZoom={11}
            zoom={16}
          />
        ) : routeBounds ? (
          <Camera
            bounds={routeBounds}
            duration={900}
            easing="fly"
            key={`route-bounds-${focusRequestId ?? 0}`}
            maxZoom={19}
            minZoom={11}
            padding={{ bottom: 160, left: 44, right: 44, top: 100 }}
          />
        ) : cameraCenter ? (
          <Camera
            center={cameraCenter}
            duration={900}
            easing="fly"
            key={`destination-${destination?.id ?? 'center'}-${cameraCenter[0]}-${cameraCenter[1]}`}
            maxZoom={19}
            minZoom={11}
            zoom={15}
          />
        ) : null}

        {routeGeoJson ? (
          <GeoJSONSource
            data={routeGeoJson}
            id={`selected-route-source-${String(vehicleMode || 'driving').toLowerCase()}`}
            key={`selected-route-source-${String(vehicleMode || 'driving').toLowerCase()}`}
          >
            <Layer
              id={`selected-route-casing-${String(vehicleMode || 'driving').toLowerCase()}`}
              key={`selected-route-casing-${String(vehicleMode || 'driving').toLowerCase()}`}
              type="line"
              style={{
                lineCap: 'round',
                lineColor: routeCasingColor,
                lineJoin: 'round',
                lineWidth: 7,
              }}
            />
            <Layer
              id={`selected-route-line-${String(vehicleMode || 'driving').toLowerCase()}`}
              key={`selected-route-line-${String(vehicleMode || 'driving').toLowerCase()}`}
              type="line"
              style={{
                lineCap: 'round',
                lineColor: routeLineColor,
                lineJoin: 'round',
                lineWidth: 5,
              }}
            />
          </GeoJSONSource>
        ) : null}

        {sortedRouteSigns.map((sign) => {
          const freshness = getSignFreshness(sign.freshnessScore, sign.status);
          return (
            <Marker
              anchor="bottom"
              id={`route-sign-${sign.id}`}
              key={`route-sign-${sign.id}`}
              lngLat={sign.coordinate}
              onPress={() => handleSignPress(sign)}
            >
              <View style={styles.signMarkerRoot}>
                <Pressable
                  accessibilityLabel={`Xem chi tiết cho ${sign.name || sign.signCode || 'biển báo'}`}
                  accessibilityRole="button"
                  hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                  onPress={() => handleSignPress(sign)}
                  style={styles.stopSignMarker}
                >
                  <SignMarkerIcon
                    actualCropUrl={sign.actualCropUrl}
                    imageUrl={sign.imageUrl}
                    name={sign.name}
                    signCode={sign.signCode}
                  />
                  {/* Small circle on the bottom right indicating its freshness */}
                  <View
                    key={`dot-${freshness.color}`}
                    style={[styles.markerFreshnessDot, { backgroundColor: freshness.color }]}
                  />
                </Pressable>
              </View>
            </Marker>
          );
        })}

        {selectedSign && destination ? (
          <Marker
            anchor="bottom"
            id={`route-sign-callout-${selectedSign.id}`}
            key={`route-sign-callout-${selectedSign.id}`}
            lngLat={selectedSign.coordinate}
          >
            <View pointerEvents="box-none" style={styles.selectedCalloutAnchorContainer}>
              <SignCallout
                freshness={getSignFreshness(selectedSign.freshnessScore, selectedSign.status)}
                sign={selectedSign}
              />
            </View>
          </Marker>
        ) : null}

        {navigationActive ? (
          <>
            {hasLiveLocation ? (
              <UserLocation accuracy animated heading minDisplacement={0} />
            ) : null}
          </>
        ) : showCurrentLocation && userCoordinate ? (
          <Marker anchor="center" id="current-location" lngLat={userCoordinate}>
            <>
              <View style={styles.currentLocationHalo}>
                <View style={[styles.currentLocationDot, { backgroundColor: theme.primary }]} />
              </View>
            </>
          </Marker>
        ) : null}

        {/* Show the start marker only when the user explicitly selected a custom start point */}
        {isCustomStart &&
        routeStart &&
        (!navigationActive || (navigationActive && !hasLiveLocation)) ? (
          <Marker anchor="center" id="route-start-location" lngLat={routeStart}>
            <View style={styles.startMarker}>
              <Text style={styles.startMarkerText}>S</Text>
            </View>
          </Marker>
        ) : null}

        {destination ? (
          <Marker anchor="bottom" id="destination-location" lngLat={destination.coordinate}>
            <MapLocationPin color="#EF4444" testID="map-destination-pin" />
          </Marker>
        ) : null}

        {hasValidLocationPin &&
        (!destination ||
          destination.coordinate[0] !== effectiveLocationPin[0] ||
          destination.coordinate[1] !== effectiveLocationPin[1]) ? (
          <Marker anchor="bottom" id="location-pin" lngLat={effectiveLocationPin}>
            <MapLocationPin color={locationPinColor || '#EF4444'} testID="map-location-pin" />
          </Marker>
        ) : null}
      </Map>

      {!destination && selectedSign ? (
        <SignDetailsBottomSheet
          onClose={() => {
            setSelectedSignId(null);
            onSignSelect?.(null);
          }}
          sign={selectedSign}
        />
      ) : null}

      {activeOfflinePack ? (
        <View style={styles.offlineIndicatorBadge}>
          <MaterialCommunityIcons color="#059669" name="map-check" size={14} />
          <Text style={styles.offlineIndicatorText} numberOfLines={1}>
            Offline: {activeOfflinePack.name}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
