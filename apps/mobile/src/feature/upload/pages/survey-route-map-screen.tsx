import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AntDesign from '@expo/vector-icons/AntDesign';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '@/hooks/use-theme';
import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { NavigationMapView } from '@/feature/navigation/components/navigation-map-view';
import type { MapCoordinate } from '@/types/navigationType';
import { extractGpxGpsData } from '@/feature/upload/utils/gpx';
import { calculateDistanceMeters, isValidCoordinate } from '@/feature/navigation/utils/geo';
import { useReverseGeocode } from '@/feature/upload/hooks/use-reverse-geocode';

function calculateTotalDistanceMeters(coords: MapCoordinate[]): number {
  if (coords.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    total += calculateDistanceMeters(coords[i], coords[i + 1]);
  }
  return total;
}

function formatDistance(meters: number): string {
  if (meters <= 0) return '0 m';
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins === 0) return `${secs}s`;
  return `${mins}p ${secs > 0 ? `${secs}s` : ''}`.trim();
}

export function SurveyRouteMapScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const {
    gpxUri,
    startLat,
    startLon,
    endLat,
    endLon,
    title,
    duration,
  } = useLocalSearchParams<{
    gpxUri?: string;
    startLat?: string;
    startLon?: string;
    endLat?: string;
    endLon?: string;
    title?: string;
    duration?: string;
  }>();

  const [isLoadingGpx, setIsLoadingGpx] = useState(Boolean(gpxUri));
  const [routeCoordinates, setRouteCoordinates] = useState<MapCoordinate[]>([]);
  const [startCoord, setStartCoord] = useState<MapCoordinate | undefined>(() => {
    const lat = startLat ? Number(startLat) : undefined;
    const lon = startLon ? Number(startLon) : undefined;
    return lat != null && lon != null && isValidCoordinate([lon, lat]) ? [lon, lat] : undefined;
  });
  const [endCoord, setEndCoord] = useState<MapCoordinate | undefined>(() => {
    const lat = endLat ? Number(endLat) : undefined;
    const lon = endLon ? Number(endLon) : undefined;
    return lat != null && lon != null && isValidCoordinate([lon, lat]) ? [lon, lat] : undefined;
  });
  const [focusRequestId, setFocusRequestId] = useState(1);

  // Parse GPX track points if gpxUri is present
  useEffect(() => {
    if (!gpxUri) {
      setIsLoadingGpx(false);
      return;
    }

    let active = true;
    setIsLoadingGpx(true);

    void extractGpxGpsData(gpxUri)
      .then((gpxData) => {
        if (!active) return;
        if (gpxData && gpxData.coordinates.length > 0) {
          setRouteCoordinates(gpxData.coordinates);
          if (gpxData.firstPoint) {
            setStartCoord([gpxData.firstPoint.longitude, gpxData.firstPoint.latitude]);
          }
          if (gpxData.lastPoint) {
            setEndCoord([gpxData.lastPoint.longitude, gpxData.lastPoint.latitude]);
          }
        }
      })
      .catch((err) => {
        console.warn('[SurveyRouteMap] Failed to extract GPX track points:', err);
      })
      .finally(() => {
        if (active) {
          setIsLoadingGpx(false);
        }
      });

    return () => {
      active = false;
    };
  }, [gpxUri]);

  // Compute effective route coordinates (GPX points or straight line fallback)
  const effectiveRouteCoordinates = useMemo(() => {
    if (routeCoordinates.length > 0) {
      return routeCoordinates;
    }
    if (startCoord && endCoord) {
      return [startCoord, endCoord];
    }
    return [];
  }, [routeCoordinates, startCoord, endCoord]);

  // Compute total route distance
  const totalDistanceMeters = useMemo(() => {
    return calculateTotalDistanceMeters(effectiveRouteCoordinates);
  }, [effectiveRouteCoordinates]);

  const durationSec = duration ? Math.max(0, Number(duration)) : 0;

  // Reverse geocode start and end points for address labels
  const startGeocode = useReverseGeocode(
    startCoord ? { latitude: startCoord[1], longitude: startCoord[0] } : null,
  );
  const endGeocode = useReverseGeocode(
    endCoord ? { latitude: endCoord[1], longitude: endCoord[0] } : null,
  );

  const startAddress =
    startGeocode.data?.roadName ||
    startGeocode.data?.displayAddress ||
    (startCoord ? `${startCoord[1].toFixed(6)}, ${startCoord[0].toFixed(6)}` : '--');

  const endAddress =
    endGeocode.data?.roadName ||
    endGeocode.data?.displayAddress ||
    (endCoord ? `${endCoord[1].toFixed(6)}, ${endCoord[0].toFixed(6)}` : '--');

  const destinationParam = useMemo(() => {
    if (!endCoord) return undefined;
    return {
      coordinate: endCoord,
      id: 'survey-route-destination',
      title: 'Điểm kết thúc',
      subtitle: 'Lộ trình khảo sát',
      category: 'recent' as const,
    };
  }, [endCoord]);

  const hasRouteData = Boolean(startCoord || endCoord || effectiveRouteCoordinates.length > 0);

  return (
    <View style={styles.container}>
      {/* Full-Screen Map View */}
      {hasRouteData ? (
        <View style={StyleSheet.absoluteFill}>
          <NavigationMapView
            destination={destinationParam}
            focusRequestId={focusRequestId}
            isCustomStart
            isNavigatingFeature
            routeCoordinates={effectiveRouteCoordinates.length > 0 ? effectiveRouteCoordinates : undefined}
            routeStart={startCoord}
            showCurrentLocation={false}
          />
        </View>
      ) : (
        <View style={[styles.emptyContainer, { backgroundColor: theme.backgroundElement }]}>
          {isLoadingGpx ? (
            <ActivityIndicator color={theme.primary} size="large" />
          ) : (
            <>
              <MaterialCommunityIcons color={theme.textSecondary} name="map-marker-off" size={48} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>Không có dữ liệu lộ trình</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Không tìm thấy tọa độ điểm đầu/cuối hoặc tệp GPX hợp lệ cho khảo sát này.
              </Text>
            </>
          )}
        </View>
      )}

      {/* Floating Header */}
      <View
        pointerEvents="box-none"
        style={[styles.headerContainer, { paddingTop: Math.max(insets.top + Spacing.one, Spacing.three) }]}
      >
        <View style={[styles.headerCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Pressable
            accessibilityLabel="Quay lại chi tiết khảo sát"
            accessibilityRole="button"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <AntDesign color={theme.text} name="arrow-left" size={22} />
          </Pressable>

          <View style={styles.headerTitleContainer}>
            <Text numberOfLines={1} style={[styles.headerTitle, { color: theme.text }]}>
              {title || 'Lộ trình khảo sát'}
            </Text>
            <View style={styles.readOnlyBadge}>
              <MaterialCommunityIcons color="#059669" name="lock-outline" size={12} />
              <Text style={styles.readOnlyText}>Chỉ xem lộ trình • Không chỉnh sửa</Text>
            </View>
          </View>

          <Pressable
            accessibilityLabel="Căn chỉnh lại lộ trình"
            accessibilityRole="button"
            onPress={() => setFocusRequestId((prev) => prev + 1)}
            style={[styles.fitRouteButton, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
          >
            <MaterialCommunityIcons color={theme.primary} name="fit-to-screen-outline" size={20} />
          </Pressable>
        </View>
      </View>

      {/* Loading Banner when GPX is parsing */}
      {isLoadingGpx ? (
        <View style={[styles.loadingBanner, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <ActivityIndicator color={theme.primary} size="small" />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Đang tải lộ trình GPX...</Text>
        </View>
      ) : null}

      {/* Floating Bottom Route Card */}
      {hasRouteData ? (
        <View
          pointerEvents="box-none"
          style={[
            styles.bottomCardContainer,
            { paddingBottom: Math.max(insets.bottom + Spacing.two, Spacing.three) },
          ]}
        >
          <View
            style={[
              styles.routeCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            {/* Header / Badges */}
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderLeft}>
                <MaterialCommunityIcons color={theme.primary} name="map-marker-distance" size={20} />
                <Text style={[styles.cardTitle, { color: theme.text }]}>Chi tiết lộ trình ghi nhận</Text>
              </View>
              {effectiveRouteCoordinates.length > 0 ? (
                <View style={[styles.pointsBadge, { backgroundColor: theme.neutral }]}>
                  <Text style={[styles.pointsBadgeText, { color: theme.textSecondary }]}>
                    {effectiveRouteCoordinates.length} điểm GPS
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Start & End Points */}
            <View style={styles.routePointsContainer}>
              {/* Start Point (S) */}
              <View style={styles.pointRow}>
                <View style={styles.startBadge}>
                  <Text style={styles.badgeText}>S</Text>
                </View>
                <View style={styles.pointInfo}>
                  <Text style={[styles.pointLabel, { color: theme.textSecondary }]}>Điểm xuất phát (S)</Text>
                  <Text numberOfLines={1} style={[styles.pointAddress, { color: theme.text }]}>
                    {startAddress}
                  </Text>
                  {startCoord ? (
                    <Text style={[styles.pointCoords, { color: theme.placeholder }]}>
                      {startCoord[1].toFixed(6)}, {startCoord[0].toFixed(6)}
                    </Text>
                  ) : null}
                </View>
              </View>

              {/* Connector line */}
              <View style={styles.connectorContainer}>
                <View style={[styles.connectorLine, { backgroundColor: theme.border }]} />
              </View>

              {/* End Point (D) */}
              <View style={styles.pointRow}>
                <View style={styles.destBadge}>
                  <Text style={styles.badgeText}>D</Text>
                </View>
                <View style={styles.pointInfo}>
                  <Text style={[styles.pointLabel, { color: theme.textSecondary }]}>Điểm kết thúc (D)</Text>
                  <Text numberOfLines={1} style={[styles.pointAddress, { color: theme.text }]}>
                    {endAddress}
                  </Text>
                  {endCoord ? (
                    <Text style={[styles.pointCoords, { color: theme.placeholder }]}>
                      {endCoord[1].toFixed(6)}, {endCoord[0].toFixed(6)}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>

            {/* Route Stats Footer */}
            <View style={[styles.statsRow, { borderTopColor: theme.border }]}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons color={theme.textSecondary} name="map-marker-path" size={16} />
                <View>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Chiều dài</Text>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {formatDistance(totalDistanceMeters)}
                  </Text>
                </View>
              </View>

              {durationSec > 0 ? (
                <View style={styles.statItem}>
                  <MaterialCommunityIcons color={theme.textSecondary} name="clock-outline" size={16} />
                  <View>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Thời lượng</Text>
                    <Text style={[styles.statValue, { color: theme.text }]}>
                      {formatDuration(durationSec)}
                    </Text>
                  </View>
                </View>
              ) : null}

              <View style={styles.statItem}>
                <MaterialCommunityIcons color="#059669" name="shield-check-outline" size={16} />
                <View>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Trạng thái</Text>
                  <Text style={[styles.statValue, { color: '#059669' }]}>
                    Tệp GPX cố định
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  emptyTitle: {
    fontFamily: Fonts.title,
    fontSize: 18,
    fontWeight: '700',
    marginTop: Spacing.two,
  },
  emptySubtitle: {
    fontFamily: Fonts.body,
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 280,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.three,
    zIndex: 10,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    borderRadius: Rounded.lg,
    borderWidth: 1,
    gap: Spacing.two,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.title,
    fontSize: 15,
    fontWeight: '700',
  },
  readOnlyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  readOnlyText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  fitRouteButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBanner: {
    position: 'absolute',
    top: 86,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: Rounded.round,
    borderWidth: 1,
    zIndex: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  loadingText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '500',
  },
  bottomCardContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.three,
    zIndex: 10,
  },
  routeCard: {
    borderRadius: Rounded.xlg,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.one,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
  },
  cardTitle: {
    fontFamily: Fonts.title,
    fontSize: 14,
    fontWeight: '700',
  },
  pointsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Rounded.round,
  },
  pointsBadgeText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: '600',
  },
  routePointsContainer: {
    paddingVertical: 2,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  startBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1767D2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 2,
  },
  destBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#148594',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: '900',
  },
  pointInfo: {
    flex: 1,
  },
  pointLabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: '500',
  },
  pointAddress: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '600',
  },
  pointCoords: {
    fontFamily: Fonts.body,
    fontSize: 10,
    marginTop: 1,
  },
  connectorContainer: {
    paddingLeft: 11,
    height: 14,
    justifyContent: 'center',
  },
  connectorLine: {
    width: 2,
    height: 14,
    borderRadius: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: Spacing.one,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statLabel: {
    fontFamily: Fonts.body,
    fontSize: 10,
    fontWeight: '500',
  },
  statValue: {
    fontFamily: Fonts.title,
    fontSize: 12,
    fontWeight: '700',
  },
});
