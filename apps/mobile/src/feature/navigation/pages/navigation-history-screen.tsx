import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatResolvedLocationTitle, resolveLocation } from '@/api/spatial/spatial';
import { AppButton } from '@/components/button';
import { Fonts, MaxContentWidth, Rounded, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session-provider';
import { useGetNavigationSessions } from '@/feature/navigation/hooks/use-navigation';
import { calculateDistanceMeters } from '@/feature/navigation/utils/geo';
import { useBackButton } from '@/hooks/use-back-button';
import { useTheme } from '@/hooks/use-theme';
import { useWorkRoute } from '@/hooks/use-work-route';
import type { NavigationSessionItem } from '@/types/navigationType';

const locationTitleCache = new Map<string, { title: string; subtitle?: string }>();

/**
 * Robustly extracts { latitude, longitude } from various backend formats:
 * - GeoJSON Point: { type: 'Point', coordinates: [longitude, latitude] }
 * - Array: [longitude, latitude]
 * - Object: { latitude, longitude } or { lat, lon }
 * - Flat fields: originLatitude, originLongitude
 */
export function extractCoordinate(
  point?: any,
  flatLat?: any,
  flatLon?: any,
): { latitude: number; longitude: number } | null {
  if (point) {
    // GeoJSON Point: { type: 'Point', coordinates: [lon, lat] }
    if (Array.isArray(point.coordinates) && point.coordinates.length >= 2) {
      const lon = Number(point.coordinates[0]);
      const lat = Number(point.coordinates[1]);
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        return { latitude: lat, longitude: lon };
      }
    }
    // Simple coordinate array: [lon, lat]
    if (Array.isArray(point) && point.length >= 2) {
      const lon = Number(point[0]);
      const lat = Number(point[1]);
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        return { latitude: lat, longitude: lon };
      }
    }
    // Object with lat/lon properties
    const lat = Number(point.latitude ?? point.lat);
    const lon = Number(point.longitude ?? point.lon ?? point.lng);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      return { latitude: lat, longitude: lon };
    }
  }

  const lat = Number(flatLat);
  const lon = Number(flatLon);
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    return { latitude: lat, longitude: lon };
  }

  return null;
}

function isGenericPlaceholder(name?: string | null): boolean {
  if (!name) return true;
  const trimmed = name.trim().toLowerCase();
  return (
    trimmed === 'điểm xuất phát' ||
    trimmed === 'điểm đến' ||
    trimmed === 'vị trí của bạn' ||
    trimmed === 'điểm di chuyển' ||
    trimmed === 'điểm đến đã lưu' ||
    trimmed === 'unknown' ||
    trimmed === 'vị trí không xác định'
  );
}

function useResolvedAddress(
  coord: { latitude: number; longitude: number } | null,
  initialName?: string | null,
  accessToken?: string,
  fallbackLabel = '',
): { title: string; subtitle?: string } {
  const coordKey = coord ? `${coord.latitude.toFixed(5)},${coord.longitude.toFixed(5)}` : null;

  const [address, setAddress] = useState<{ title: string; subtitle?: string }>(() => {
    if (initialName && !isGenericPlaceholder(initialName)) {
      return { title: initialName };
    }
    if (coordKey && locationTitleCache.has(coordKey)) {
      return locationTitleCache.get(coordKey)!;
    }
    return { title: '' };
  });

  useEffect(() => {
    if (initialName && !isGenericPlaceholder(initialName)) {
      setAddress({ title: initialName });
      return;
    }
    if (!coord || !coordKey) return;

    if (locationTitleCache.has(coordKey)) {
      setAddress(locationTitleCache.get(coordKey)!);
      return;
    }

    let isMounted = true;
    void (async () => {
      try {
        const result = await resolveLocation(coord.latitude, coord.longitude, accessToken);
        const resolvedTitle = formatResolvedLocationTitle(result);

        if (resolvedTitle && isMounted) {
          // Extract secondary address part if available
          let subtitle: string | undefined;
          if (result?.displayAddress) {
            const parts = result.displayAddress.split(',').map((p) => p.trim()).filter(Boolean);
            if (parts.length > 1) {
              subtitle = parts.slice(1).join(', ');
            }
          }

          const resolved = { title: resolvedTitle, subtitle };
          locationTitleCache.set(coordKey, resolved);
          setAddress(resolved);
        }
      } catch {
        // Fallback silently if offline or geocode fails
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [coord, coordKey, initialName, accessToken]);

  if (address.title) return address;
  if (initialName && !isGenericPlaceholder(initialName)) return { title: initialName };
  if (coord) return { title: `${coord.latitude.toFixed(4)}°, ${coord.longitude.toFixed(4)}` };
  return { title: fallbackLabel };
}

const vehicleTypeLabels: Record<string, { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }> = {
  CAR: { label: 'Ô tô', icon: 'car' },
  MOTORCYCLE: { label: 'Xe máy', icon: 'motorbike' },
  BIKE: { label: 'Xe máy', icon: 'motorbike' },
  CYCLING: { label: 'Xe đạp', icon: 'bicycle' },
  BICYCLE: { label: 'Xe đạp', icon: 'bicycle' },
  WALKING: { label: 'Đi bộ', icon: 'walk' },
  PEDESTRIAN: { label: 'Đi bộ', icon: 'walk' },
  TRUCK: { label: 'Xe tải', icon: 'truck' },
  BUS: { label: 'Xe buýt', icon: 'bus' },
};

function formatTimestamp(value?: string) {
  if (!value) return 'Không rõ thời gian';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Không rõ thời gian';
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDistance(meters?: number) {
  if (!meters || meters <= 0) return null;
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

function formatDuration(seconds?: number) {
  if (!seconds || seconds <= 0) return null;
  const mins = Math.round(seconds / 60);
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hours}h ${remMins}m`;
  }
  return `${mins} phút`;
}

interface NavigationSessionCardProps {
  item: NavigationSessionItem;
  accessToken?: string;
  onNavigate: (
    item: NavigationSessionItem,
    originTitle: string,
    destTitle: string,
    origCoord: { latitude: number; longitude: number } | null,
    destCoord: { latitude: number; longitude: number } | null,
  ) => void;
}

function NavigationSessionCard({ item, accessToken, onNavigate }: NavigationSessionCardProps) {
  const theme = useTheme();

  const origCoord = extractCoordinate(item.origin, item.originLatitude, item.originLongitude);
  const destCoord = extractCoordinate(item.destination, item.destinationLatitude, item.destinationLongitude);

  const originAddr = useResolvedAddress(origCoord, item.originName, accessToken, 'Vị trí của bạn');
  const destAddr = useResolvedAddress(destCoord, item.destinationName, accessToken, 'Điểm đến');

  // Default to Motorcycle in driver mode if vehicle mode is not specified by backend
  const vehicleMeta =
    vehicleTypeLabels[item.vehicleType?.toUpperCase() ?? ''] ||
    vehicleTypeLabels[item.vehicleMode?.toUpperCase() ?? ''] || {
      label: 'Xe máy',
      icon: 'motorbike',
    };

  // Compute distance from coordinates if backend doesn't provide distanceMeters
  const calculatedDistance =
    item.distanceMeters && item.distanceMeters > 0
      ? item.distanceMeters
      : origCoord && destCoord
        ? calculateDistanceMeters(
            [origCoord.longitude, origCoord.latitude],
            [destCoord.longitude, destCoord.latitude],
          )
        : undefined;

  const distanceStr = formatDistance(calculatedDistance);
  const durationStr = formatDuration(item.durationSeconds);

  return (
    <Pressable
      accessibilityLabel={`Lộ trình từ ${originAddr.title} đến ${destAddr.title}. Nhấn để mở lộ trình`}
      accessibilityRole="button"
      onPress={() => onNavigate(item, originAddr.title, destAddr.title, origCoord, destCoord)}
      style={({ pressed }) => [
        styles.tripCard,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
          opacity: pressed ? 0.88 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      {/* Card Header: Vehicle Mode & Distance */}
      <View style={styles.cardHeader}>
        <View style={[styles.vehiclePill, { backgroundColor: `${theme.primary}12` }]}>
          <MaterialCommunityIcons color={theme.primary} name={vehicleMeta.icon} size={16} />
          <Text style={[styles.vehicleText, { color: theme.primary }]}>{vehicleMeta.label}</Text>
        </View>

        <View style={styles.headerRight}>
          {distanceStr ? (
            <View style={[styles.distancePill, { backgroundColor: theme.background }]}>
              <MaterialCommunityIcons color={theme.primary} name="map-marker-distance" size={14} />
              <Text style={[styles.distancePillText, { color: theme.text }]}>{distanceStr}</Text>
            </View>
          ) : null}

          {item.creditsDeducted ? (
            <View style={[styles.creditsBadge, { backgroundColor: '#EF444412' }]}>
              <Text style={styles.creditsText}>-{item.creditsDeducted} credits</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Route Details with Visual Pin Indicators */}
      <View style={styles.routeContainer}>
        <View style={styles.routePinColumn}>
          <View style={[styles.startDot, { borderColor: theme.primary }]} />
          <View style={[styles.routeDottedLine, { borderColor: theme.border }]} />
          <View style={styles.endPin}>
            <MaterialCommunityIcons color="#EF4444" name="map-marker" size={17} />
          </View>
        </View>

        <View style={styles.routeTextColumn}>
          <View style={styles.locationBlock}>
            <Text style={[styles.locationLabel, { color: theme.grey }]}>Xuất phát</Text>
            <Text numberOfLines={1} style={[styles.locationName, { color: theme.text }]}>
              {originAddr.title}
            </Text>
            {originAddr.subtitle ? (
              <Text numberOfLines={1} style={[styles.locationSubText, { color: theme.grey }]}>
                {originAddr.subtitle}
              </Text>
            ) : null}
          </View>

          <View style={styles.locationBlock}>
            <Text style={[styles.locationLabel, { color: theme.grey }]}>Điểm đến</Text>
            <Text numberOfLines={1} style={[styles.locationName, { color: theme.text }]}>
              {destAddr.title}
            </Text>
            {destAddr.subtitle ? (
              <Text numberOfLines={1} style={[styles.locationSubText, { color: theme.grey }]}>
                {destAddr.subtitle}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      {/* Card Footer: Timestamp & Re-navigate CTA */}
      <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
        <View style={styles.timeMeta}>
          <MaterialCommunityIcons color={theme.grey} name="clock-outline" size={14} />
          <Text style={[styles.timeText, { color: theme.grey }]}>
            {formatTimestamp(item.createdAt || item.startedAt)}
          </Text>
          {durationStr ? (
            <Text style={[styles.metricText, { color: theme.textSecondary }]}>
              · {durationStr}
            </Text>
          ) : null}
        </View>

        <View style={[styles.reNavigateBtn, { backgroundColor: theme.backgroundSelected }]}>
          <MaterialCommunityIcons color={theme.primary} name="navigation-variant-outline" size={14} />
          <Text style={[styles.reNavigateText, { color: theme.primary }]}>Đi lại</Text>
        </View>
      </View>
    </Pressable>
  );
}

export function NavigationHistoryScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { session } = useSession();
  const driverWorkRoute = useWorkRoute('/work', { currentRole: 'driver' });

  useBackButton(driverWorkRoute);

  const [page, setPage] = useState(1);
  const listRef = useRef<FlatList<NavigationSessionItem>>(null);

  const { data, isLoading, isFetching, isRefetching, error, refetch } = useGetNavigationSessions({
    page,
    pageSize: 20,
  });

  const allItems = data?.items ?? [];
  const totalTrips = data?.total ?? allItems.length;
  const totalPages = data?.totalPages ?? 1;

  const handleReNavigate = (
    item: NavigationSessionItem,
    resolvedOriginTitle: string,
    resolvedDestTitle: string,
    origCoord: { latitude: number; longitude: number } | null,
    destCoord: { latitude: number; longitude: number } | null,
  ) => {
    if (!destCoord) {
      router.push('/(authenticated)/(tabs)/home');
      return;
    }

    const rawMode = (item.vehicleMode || item.vehicleType || 'MOTORCYCLE').toUpperCase();
    const vehicleMode =
      rawMode === 'CAR' || rawMode === 'DRIVING'
        ? 'DRIVING'
        : rawMode === 'CYCLING' || rawMode === 'BICYCLE'
          ? 'CYCLING'
          : rawMode === 'WALKING' || rawMode === 'PEDESTRIAN'
            ? 'WALKING'
            : 'BIKE';

    router.push({
      pathname: '/(authenticated)/(tabs)/home',
      params: {
        destinationLat: String(destCoord.latitude),
        destinationLng: String(destCoord.longitude),
        destinationTitle: resolvedDestTitle || item.destinationName || 'Điểm đến',
        ...(origCoord
          ? {
              startLat: String(origCoord.latitude),
              startLng: String(origCoord.longitude),
              startTitle: resolvedOriginTitle || item.originName || 'Vị trí của bạn',
            }
          : {}),
        vehicleMode,
      },
    });
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* Header Bar */}
        <View style={styles.header}>
          <AppButton
            accessibilityLabel="Quay lại danh mục công việc tài xế"
            onPress={() => router.replace(driverWorkRoute)}
            style={styles.iconButton}
            variant="ghost"
          >
            <MaterialCommunityIcons color={theme.text} name="arrow-left" size={24} />
          </AppButton>

          <View style={styles.headerTitleWrap}>
            <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>
              Lịch sử di chuyển
            </Text>
            <Text style={[styles.subtitle, { color: theme.grey }]}>
              {totalTrips} chuyến đi đã ghi nhận
            </Text>
          </View>

          <AppButton
            accessibilityLabel="Làm mới lịch sử di chuyển"
            disabled={isFetching}
            onPress={() => {
              void refetch();
            }}
            style={styles.iconButton}
            variant="ghost"
          >
            <MaterialCommunityIcons
              color={theme.primary}
              name={isFetching ? 'loading' : 'refresh'}
              size={22}
            />
          </AppButton>
        </View>

        {/* Main List */}
        <FlatList
          contentContainerStyle={styles.listContent}
          data={allItems}
          keyExtractor={(item, index) => item.id || String(index)}
          onRefresh={() => {
            void refetch();
          }}
          ref={listRef}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.primary} />
          }
          refreshing={isRefetching}
          renderItem={({ item }) => (
            <NavigationSessionCard
              accessToken={session?.accessToken}
              item={item}
              onNavigate={handleReNavigate}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              {isLoading ? (
                <ActivityIndicator
                  accessibilityLabel="Đang tải lịch sử di chuyển"
                  color={theme.primary}
                  size="large"
                />
              ) : error ? (
                <View style={styles.emptyCard}>
                  <MaterialCommunityIcons color="#EF4444" name="alert-circle-outline" size={42} />
                  <Text style={[styles.emptyTitle, { color: theme.text }]}>Không thể tải lịch sử</Text>
                  <Text style={[styles.emptySubtitle, { color: theme.grey }]}>
                    Có lỗi xảy ra khi lấy danh sách chuyến đi từ hệ thống.
                  </Text>
                  <AppButton label="Thử lại" onPress={() => refetch()} style={{ marginTop: Spacing.two }} />
                </View>
              ) : (
                <View style={styles.emptyCard}>
                  <View style={[styles.emptyIconCircle, { backgroundColor: `${theme.primary}15` }]}>
                    <MaterialCommunityIcons color={theme.primary} name="map-clock-outline" size={38} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: theme.text }]}>Chưa có chuyến đi nào</Text>
                  <Text style={[styles.emptySubtitle, { color: theme.grey }]}>
                    Khi bạn sử dụng tính năng điều hướng và chỉ dẫn giao thông, các chuyến đi sẽ được lưu lại tại đây.
                  </Text>
                  <AppButton
                    label="Bắt đầu điều hướng"
                    onPress={() => router.push('/(authenticated)/(tabs)/home')}
                    style={{ marginTop: Spacing.three }}
                    variant="primary"
                  />
                </View>
              )}
            </View>
          }
        />

        {/* Pagination if multiple pages */}
        {totalPages > 1 ? (
          <View style={[styles.pagination, { borderTopColor: theme.border, backgroundColor: theme.backgroundElement }]}>
            <AppButton
              disabled={page <= 1 || isFetching}
              label="Trước"
              onPress={() => {
                setPage((p) => Math.max(1, p - 1));
                listRef.current?.scrollToOffset({ offset: 0, animated: false });
              }}
              variant="surface"
            />
            <Text style={[styles.pageIndicator, { color: theme.text }]}>
              Trang {page} / {totalPages}
            </Text>
            <AppButton
              disabled={page >= totalPages || isFetching}
              label="Sau"
              onPress={() => {
                setPage((p) => Math.min(totalPages, p + 1));
                listRef.current?.scrollToOffset({ offset: 0, animated: false });
              }}
              variant="surface"
            />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  iconButton: {
    width: 44,
    height: 44,
    minHeight: 44,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: Rounded.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: Fonts.title,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '500',
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  tripCard: {
    borderRadius: Rounded.lg,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vehiclePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.one,
    paddingVertical: 3,
    borderRadius: Rounded.sm,
  },
  vehicleText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  distancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Rounded.round,
  },
  distancePillText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '700',
  },
  creditsBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: Rounded.round,
  },
  creditsText: {
    color: '#EF4444',
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: '700',
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    paddingVertical: 4,
  },
  routePinColumn: {
    alignItems: 'center',
    width: 20,
    paddingTop: 6,
  },
  startDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  routeDottedLine: {
    width: 1,
    height: 28,
    borderLeftWidth: 2,
    borderStyle: 'dashed',
    marginVertical: 2,
  },
  endPin: {
    marginTop: -2,
  },
  routeTextColumn: {
    flex: 1,
    gap: 8,
  },
  locationBlock: {
    gap: 1,
  },
  locationLabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: '500',
  },
  locationName: {
    fontFamily: Fonts.body,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  locationSubText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.one,
  },
  timeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    flexWrap: 'wrap',
  },
  timeText: {
    fontFamily: Fonts.body,
    fontSize: 12,
  },
  metricText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '600',
  },
  reNavigateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Rounded.round,
  },
  reNavigateText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    paddingVertical: Spacing.six,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    textAlign: 'center',
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  emptyTitle: {
    fontFamily: Fonts.title,
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 320,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderTopWidth: 1,
  },
  pageIndicator: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '600',
  },
});
