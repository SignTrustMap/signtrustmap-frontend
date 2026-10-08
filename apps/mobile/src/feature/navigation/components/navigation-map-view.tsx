import type { CameraRef, MapRef, StyleSpecification } from '@maplibre/maplibre-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, Rounded, Spacing } from '@/constants/theme';
import {
  type MapCoordinate,
  type PreviousLocation,
} from '@/types/navigationType';
import type { RouteSign } from '@/api/navigation/navigation';
import type { FindSignsInBoundsParams } from '@/types/signMapType';
import { useTheme } from '@/hooks/use-theme';
import { getMapLibre, type MapLibreModule } from '@/services/maplibre';
import { getRouteForwardBearing } from '../utils/geo';
import { useGetSignEvidences, useGetTaskEvidences } from '@/feature/revalidation/hooks/use-revalidation';
import { resolveImageUrl } from '../utils/signs';
import { formatDate } from '@/utils/format-date';

type NavigationMapViewProps = {
  onBoundsChange?: (bounds: FindSignsInBoundsParams) => void;
  destination?: PreviousLocation;
  focusCoordinate?: MapCoordinate;
  focusRequestId?: number;
  navigationActive?: boolean;
  routeCoordinates?: MapCoordinate[];
  routeStart?: MapCoordinate;
  routeSigns?: RouteSign[];
  showCurrentLocation?: boolean;
  isNavigatingFeature?: boolean;
  userCoordinate?: MapCoordinate;
  hasLiveLocation?: boolean;
  isCustomStart?: boolean;
};

const mapTileUrl = process.env.EXPO_PUBLIC_MAP_TILE_URL?.trim()
  || 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';

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
  if (status?.toUpperCase() === 'RETIRED') {
    return {
      scorePercent: 0,
      color: '#EF4444',
      label: '0%',
    };
  }

  const num =
    freshnessScore !== undefined && freshnessScore !== null && freshnessScore !== ''
      ? Number(freshnessScore)
      : undefined;
  const rawScore = num !== undefined && !Number.isNaN(num) ? num : undefined;
  const scorePercent =
    rawScore !== undefined
      ? rawScore <= 1
        ? Math.round(rawScore * 100)
        : Math.round(rawScore)
      : undefined;

  const displayScore = scorePercent ?? 55;

  let color = '#EF4444'; // Red (< 50%)
  if (displayScore >= 80) {
    color = '#10B981'; // Green (>= 80%)
  } else if (displayScore >= 50) {
    color = '#EAB308'; // Yellow (50% - 79%)
  }

  return {
    scorePercent: displayScore,
    isDefined: scorePercent !== undefined,
    color,
    label: `${displayScore}%`,
  };
}

type SignCalloutProps = {
  sign: RouteSign;
  freshness: ReturnType<typeof getSignFreshness>;
};

function SignCalloutImage({ imageUrl, title }: { imageUrl?: string; title: string }) {
  const [hasError, setHasError] = useState(false);
  if (!imageUrl || hasError) return null;

  return (
    <Image
      accessibilityLabel={title}
      source={{ uri: imageUrl }}
      onError={() => setHasError(true)}
      resizeMode="contain"
      style={styles.calloutImage}
    />
  );
}

function SignMarkerIcon({ imageUrl, name, signCode }: { imageUrl?: string; name?: string; signCode?: string }) {
  const [hasError, setHasError] = useState(false);
  if (!imageUrl || hasError) return null;

  return (
    <Image
      accessibilityLabel={name || signCode}
      source={{ uri: imageUrl }}
      onError={() => setHasError(true)}
      resizeMode="contain"
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
            <Text style={[styles.calloutFreshnessScore, { color: freshness.color }]}>
              {freshness.scorePercent}% Độ tươi mới
            </Text>
          </View>
        </View>
        {sign.actualCropUrl && sign.actualCropUrl !== sign.imageUrl ? (
          <Image
            accessibilityLabel="Ảnh thực địa camera"
            source={{ uri: sign.actualCropUrl }}
            style={styles.calloutActualCrop}
            resizeMode="cover"
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
      : (signName || signCode || 'Biển báo giao thông');

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
  }, [sign.frameUrl, sign.actualCropUrl, sign.imageUrl, sign.createdAt, sign.lastVerifiedAt, evidences]);

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
        <View style={[styles.sheetSignIconContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
          {sign.imageUrl ? (
            <ExpoImage
              accessibilityLabel={signTitle}
              contentFit="contain"
              source={{ uri: sign.imageUrl }}
              style={styles.sheetSignIcon}
            />
          ) : (
            <MaterialCommunityIcons color={theme.primary} name="traffic-light" size={26} />
          )}
        </View>

        <View style={styles.sheetHeaderInfo}>
          <Text numberOfLines={2} style={[styles.sheetSignTitle, { color: theme.text }]}>
            {signTitle}
          </Text>
          <View style={styles.sheetFreshnessRow}>
            <View style={[styles.sheetFreshnessDot, { backgroundColor: freshness.color }]} />
            <Text style={[styles.sheetFreshnessText, { color: freshness.color }]}>
              {freshness.scorePercent}% Độ tươi mới
            </Text>
            {sign.roadName ? (
              <>
                <Text style={[styles.sheetDotSeparator, { color: theme.textSecondary }]}>•</Text>
                <Text numberOfLines={1} style={[styles.sheetRoadName, { color: theme.textSecondary }]}>
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
          style={[styles.sheetCloseBtn, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
        >
          <MaterialCommunityIcons color={theme.text} name="close" size={18} />
        </Pressable>
      </View>

      {/* 2. Text(Verified sign images) */}
      <View style={styles.sheetSectionHeader}>
        <MaterialCommunityIcons color="#10B981" name="check-decagram" size={16} />
        <Text style={[styles.sheetSectionTitle, { color: theme.text }]}>
          Ảnh biển báo đã xác thực (Verified sign images)
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
              style={[styles.carouselCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
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
                  <MaterialCommunityIcons color="#FFFFFF" name="calendar-clock-outline" size={14} style={{ marginRight: 6 }} />
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
  showCurrentLocation = true,
  isNavigatingFeature = false,
  userCoordinate,
  hasLiveLocation = false,
  isCustomStart = false,
}: NavigationMapViewProps) {
  const theme = useTheme();
  const mapRef = useRef<MapRef>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedSignId, setSelectedSignId] = useState<string | null>(null);
  // Tracks whether the navigation Camera's native view is ready to receive setStop commands.
  // When navigationActive flips on the Camera key changes, causing a remount — calling
  // setStop before the native view is attached causes the 'reactTag null' crash.
  const cameraReadyRef = useRef(false);

  // Auto-dismiss the callout after 4 seconds ONLY when a destination is selected
  useEffect(() => {
    if (!selectedSignId || !destination) return;

    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = setTimeout(() => {
      setSelectedSignId(null);
    }, 4000);

    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [selectedSignId, destination]);

  const handleSignPress = (sign: RouteSign) => {
    setSelectedSignId((prev) => (prev === sign.id ? null : sign.id));
  };

  const sortedRouteSigns = useMemo(() => {
    // 1. Deduplicate signs at identical coordinates with the same sign type/code,
    // prioritizing the selected sign, then the one with the highest freshness score.
    const dedup: Record<string, RouteSign> = {};
    for (const sign of routeSigns) {
      if (!Array.isArray(sign.coordinate) || sign.coordinate.length < 2) continue;
      const key = `${sign.coordinate[0].toFixed(5)},${sign.coordinate[1].toFixed(5)}_${sign.signCode || sign.name || ''}`;
      const existing = dedup[key];
      if (!existing) {
        dedup[key] = sign;
      } else {
        if (sign.id === selectedSignId) {
          dedup[key] = sign;
        } else if (existing.id !== selectedSignId) {
          const existingScore = existing.freshnessScore ?? 0;
          const currentScore = sign.freshnessScore ?? 0;
          if (currentScore > existingScore) {
            dedup[key] = sign;
          }
        }
      }
    }

    // 2. Sort so lower freshness signs are drawn first, higher freshness signs
    // are drawn on top, and any currently selected sign is drawn last (topmost).
    return Object.values(dedup).sort((a: RouteSign, b: RouteSign) => {
      if (a.id === selectedSignId) return 1;
      if (b.id === selectedSignId) return -1;
      return (a.freshnessScore ?? 0) - (b.freshnessScore ?? 0);
    });
  }, [routeSigns, selectedSignId]);

  const selectedSign = useMemo(
    () => (selectedSignId ? sortedRouteSigns.find((s) => s.id === selectedSignId) ?? null : null),
    [sortedRouteSigns, selectedSignId],
  );

  const reportBounds = ([minLon, minLat, maxLon, maxLat]: [number, number, number, number]) => {
    onBoundsChange?.({ minLon, minLat, maxLon, maxLat });
  };
  const mapLibre = loadMapLibre();
  // The camera only targets destination when available; if neither destination
  // nor focusCoordinate is set, no Camera is mounted (avoids snapping to the
  // hardcoded mock coordinate).
  const cameraCenter = destination?.coordinate;
  const routeBounds = destination && routeStart ? getRouteBounds(routeStart, destination.coordinate) : null;
  const routeGeoJson = routeCoordinates?.length
    ? ({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: routeCoordinates,
      },
    } as GeoJSON.Feature<GeoJSON.LineString>)
    : null;

  // Calculate forward bearing aligned with the route ahead for Google Maps-style navigation
  const forwardBearing = useMemo(() => {
    const origin = userCoordinate ?? routeStart;
    return getRouteForwardBearing(origin, routeCoordinates);
  }, [userCoordinate, routeStart, routeCoordinates]);

  const cameraRef = useRef<CameraRef>(null);
  const navParamsRef = useRef({ cameraCenter, routeCoordinates, routeStart, userCoordinate });
  useEffect(() => {
    navParamsRef.current = { cameraCenter, routeCoordinates, routeStart, userCoordinate };
  }, [cameraCenter, routeCoordinates, routeStart, userCoordinate]);

  // Imperatively command the camera into Google Maps 3D navigation perspective.
  // We defer all setStop calls until cameraReadyRef is true (native view mounted).
  useEffect(() => {
    if (!navigationActive) {
      // Reset readiness when leaving navigation so the next entry re-waits.
      cameraReadyRef.current = false;
      return;
    }

    // Prioritize userCoordinate so the camera flies to the user's actual position.
    // For custom route starts, fall back to routeStart if userCoordinate is not yet available.
    const {
      cameraCenter: curCameraCenter,
      routeCoordinates: curRouteCoordinates,
      routeStart: curRouteStart,
      userCoordinate: curUserCoordinate,
    } = navParamsRef.current;
    const origin = curUserCoordinate ?? curRouteStart ?? curCameraCenter;
    const bearing = getRouteForwardBearing(origin, curRouteCoordinates);

    const triggerFly = () => {
      if (!cameraReadyRef.current) return;
      cameraRef.current?.setStop({
        center: origin,
        zoom: 18,
        pitch: 55,
        bearing,
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

    // Give the native Camera node time to mount before issuing commands.
    const t0 = setTimeout(() => { cameraReadyRef.current = true; triggerFly(); }, 300);
    const t1 = setTimeout(triggerFly, 600);
    const t2 = setTimeout(triggerFly, 1000);

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [navigationActive, focusRequestId]);

  // Smoothly track user movement and update forward bearing during active navigation
  useEffect(() => {
    if (!navigationActive || !userCoordinate || !cameraReadyRef.current) return;

    const bearing = getRouteForwardBearing(userCoordinate, routeCoordinates);

    cameraRef.current?.setStop({
      center: userCoordinate,
      zoom: 18,
      pitch: 55,
      bearing,
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
          <Text style={[styles.fallbackTitle, { color: theme.text }]}>Map build required</Text>
          <Text style={[styles.fallbackCopy, { color: theme.textSecondary }]}>
            MapLibre is installed, but this app binary does not include its native module yet.
            Rebuild the Expo development client to enable the interactive map.
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
        onPress={() => setSelectedSignId(null)}
        onRegionDidChange={(event: { nativeEvent: { bounds: [number, number, number, number] } }) => reportBounds(event.nativeEvent.bounds)}
        onDidFinishLoadingMap={() => {
          void mapRef.current?.getBounds().then(reportBounds).catch(() => {
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
                  bearing: forwardBearing,
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
        ) : routeBounds ? (
          <Camera
            bounds={routeBounds}
            duration={900}
            easing="fly"
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
          <GeoJSONSource data={routeGeoJson} id="selected-route-source">
            <Layer
              id="selected-route-line"
              type="line"
              style={{
                lineCap: 'round',
                lineColor: theme.primary,
                lineJoin: 'round',
                lineWidth: 5,
              }}
            />
          </GeoJSONSource>
        ) : null}

        {sortedRouteSigns.map((sign) => {
          const freshness = getSignFreshness(sign.freshnessScore, sign.status);
          const isSelected = selectedSignId === sign.id;
          return (
            <Marker
              anchor="bottom"
              id={`route-sign-${sign.id}-${freshness.color}-${isSelected ? 'sel' : 'unsel'}`}
              key={`route-sign-${sign.id}-${freshness.color}-${isSelected ? 'sel' : 'unsel'}`}
              lngLat={sign.coordinate}
              onPress={() => handleSignPress(sign)}
            >
              <View style={[styles.signMarkerRoot, isSelected && { zIndex: 999 }]}>
                {isSelected && destination ? (
                  <SignCallout freshness={freshness} sign={sign} />
                ) : null}
                <View
                  accessibilityLabel={`Xem chi tiết cho ${sign.name || sign.signCode || 'biển báo'}`}
                  accessibilityRole="button"
                  style={styles.stopSignMarker}
                >
                  <SignMarkerIcon
                    imageUrl={sign.imageUrl}
                    name={sign.name}
                    signCode={sign.signCode}
                  />
                  {/* Small circle on the bottom right indicating its freshness */}
                  <View
                    key={`dot-${freshness.color}`}
                    style={[styles.markerFreshnessDot, { backgroundColor: freshness.color }]}
                  />
                </View>
              </View>
            </Marker>
          );
        })}

        {navigationActive ? (
          <>
            {hasLiveLocation ? (
              <UserLocation
                accuracy
                animated
                heading
                minDisplacement={0}
              />
            ) : null}
          </>
        ) : showCurrentLocation && userCoordinate ? (
          <Marker
            anchor="center"
            id="current-location"
            lngLat={userCoordinate}
          >
            <>
              <View style={styles.currentLocationHalo}>
                <View style={[styles.currentLocationDot, { backgroundColor: theme.primary }]} />
              </View>
            </>
          </Marker>
        ) : null}

        {/* Show the start marker only when the user explicitly selected a custom start point */}
        {isCustomStart && routeStart && (!navigationActive || (navigationActive && !hasLiveLocation)) ? (
          <Marker anchor="center" id="route-start-location" lngLat={routeStart}>
            <View style={styles.startMarker}>
              <Text style={styles.startMarkerText}>S</Text>
            </View>
          </Marker>
        ) : null}

        {destination ? (
          <Marker anchor="bottom" id="destination-location" lngLat={destination.coordinate}>
            <View style={styles.destinationMarker}>
              <Text style={styles.destinationMarkerText}>D</Text>
            </View>
          </Marker>
        ) : null}
      </Map>

      {!destination && selectedSign ? (
        <SignDetailsBottomSheet
          onClose={() => setSelectedSignId(null)}
          sign={selectedSign}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  fallbackPanel: {
    gap: Spacing.one,
    borderRadius: Rounded.lg,
    padding: Spacing.four,
  },
  fallbackTitle: {
    fontFamily: Fonts.body,
    fontSize: 16,
    fontWeight: 900,
  },
  fallbackCopy: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 19,
  },
  // ── Sign marker ─────────────────────────────────────────────────────────────
  signMarkerRoot: {
    alignItems: 'center',
  },
  stopSignMarker: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#09233C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.24,
    shadowRadius: 3,
    elevation: 4,
  },
  stopSignImage: {
    width: 36,
    height: 36,
  },
  markerFreshnessDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1.5,
    elevation: 3,
  },
  // ── Callout tooltip ──────────────────────────────────────────────────────────
  calloutWrapper: {
    alignItems: 'center',
    marginBottom: 4,
  },
  calloutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Rounded.md,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one + 2,
    minWidth: 230,
    maxWidth: 270,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  calloutImageContainer: {
    position: 'relative',
    width: 32,
    height: 32,
    flexShrink: 0,
  },
  calloutImage: {
    width: 32,
    height: 32,
    flexShrink: 0,
  },
  calloutImageFreshnessDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  calloutText: {
    flex: 1,
    minWidth: 0,
  },
  calloutTitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 16,
  },
  calloutCode: {
    fontFamily: Fonts.body,
    fontSize: 10,
    fontWeight: 600,
    lineHeight: 14,
    marginTop: 1,
  },
  calloutFreshnessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  calloutFreshnessMiniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  calloutFreshnessScore: {
    fontFamily: Fonts.body,
    fontSize: 10,
    fontWeight: 700,
    lineHeight: 14,
  },
  // Downward-pointing CSS triangle
  calloutArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderLeftColor: 'transparent',
    borderRightWidth: 7,
    borderRightColor: 'transparent',
    borderTopWidth: 7,
    // borderTopColor is set inline from theme
  },
  // ── Location markers ─────────────────────────────────────────────────────────
  navLocationHalo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(26, 115, 232, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLocationDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#1A73E8',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 4,
  },
  currentLocationHalo: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(0, 123, 139, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentLocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  destinationMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#148594',
    alignItems: 'center',
    justifyContent: 'center',
  },
  destinationMarkerText: {
    color: '#FFFFFF',
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: 900,
  },
  startMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#1767D2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startMarkerText: {
    color: '#FFFFFF',
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: 900,
  },
  calloutActualCrop: {
    width: 32,
    height: 32,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  // ── Bottom Sheet (Browsing mode, no destination) ───────────────────────────
  bottomSheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: Rounded.xlg,
    borderTopRightRadius: Rounded.xlg,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    shadowColor: '#09233C',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 16,
    zIndex: 1000,
  },
  sheetHandleBar: {
    alignItems: 'center',
    paddingVertical: 4,
    marginBottom: 4,
  },
  sheetHandlePill: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  sheetSignIconContainer: {
    width: 44,
    height: 44,
    borderRadius: Rounded.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
    flexShrink: 0,
  },
  sheetSignIcon: {
    width: 40,
    height: 40,
  },
  sheetHeaderInfo: {
    flex: 1,
    minWidth: 0,
  },
  sheetSignTitle: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: 700,
    lineHeight: 18,
  },
  sheetFreshnessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  sheetFreshnessDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  sheetFreshnessText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: 700,
  },
  sheetDotSeparator: {
    fontSize: 11,
  },
  sheetRoadName: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: 500,
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sheetSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.two,
  },
  sheetSectionTitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  carouselContainer: {
    gap: Spacing.two,
    paddingBottom: Spacing.one,
  },
  carouselCard: {
    width: 130,
    height: 96,
    borderRadius: Rounded.md,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  carouselLabelBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingVertical: 3,
    paddingHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselLabelText: {
    color: '#FFFFFF',
    fontFamily: Fonts.body,
    fontSize: 10,
    fontWeight: 600,
  },
  carouselEmptyBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Rounded.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    gap: Spacing.one,
  },
  carouselEmptyText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: 500,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.three,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImage: {
    width: '100%',
    height: '75%',
  },
  modalDateBadge: {
    marginTop: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    borderRadius: Rounded.md,
  },
  modalDateText: {
    color: '#FFFFFF',
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 600,
  },
});
