import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
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

import { AppButton } from '@/components/ui/button';
import { Fonts, MaxContentWidth, Rounded, Spacing } from '@/constants/theme';
import { useGetNavigationSessions } from '@/feature/navigation/hooks/use-navigation';
import { useBackButton } from '@/hooks/use-back-button';
import { useTheme } from '@/hooks/use-theme';
import { useWorkRoute } from '@/hooks/use-work-route';
import type { NavigationSessionItem } from '@/types/navigationType';

type FilterTab = 'all' | 'completed' | 'active';

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

function formatCoords(coords?: { latitude: number; longitude: number } | null, lat?: number, lon?: number) {
  const actualLat = coords?.latitude ?? lat;
  const actualLon = coords?.longitude ?? lon;
  if (actualLat == null || actualLon == null) return null;
  return `${actualLat.toFixed(4)}°, ${actualLon.toFixed(4)}°`;
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

export function NavigationHistoryScreen() {
  const router = useRouter();
  const theme = useTheme();
  const driverWorkRoute = useWorkRoute('/work', { currentRole: 'driver' });

  useBackButton(driverWorkRoute);

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [page, setPage] = useState(1);
  const listRef = useRef<FlatList<NavigationSessionItem>>(null);

  const { data, isLoading, isFetching, isRefetching, error, refetch } = useGetNavigationSessions({
    page,
    pageSize: 20,
  });

  const allItems = data?.items ?? [];

  const filteredItems = useMemo(() => {
    if (activeTab === 'completed') {
      return allItems.filter(
        (item) => item.status?.toUpperCase() === 'COMPLETED' || item.status?.toUpperCase() === 'ENDED',
      );
    }
    if (activeTab === 'active') {
      return allItems.filter((item) => item.status?.toUpperCase() === 'ACTIVE');
    }
    return allItems;
  }, [allItems, activeTab]);

  const totalTrips = data?.total ?? allItems.length;
  const completedCount = allItems.filter(
    (item) => item.status?.toUpperCase() === 'COMPLETED' || item.status?.toUpperCase() === 'ENDED',
  ).length;

  const totalPages = data?.totalPages ?? 1;

  const handleReNavigate = (session: NavigationSessionItem) => {
    const destLat = session.destination?.latitude ?? session.destinationLatitude;
    const destLon = session.destination?.longitude ?? session.destinationLongitude;
    if (destLat != null && destLon != null) {
      router.push({
        pathname: '/(authenticated)/(tabs)/home',
        params: {
          destLat: String(destLat),
          destLon: String(destLon),
          destName: session.destinationName ?? 'Điểm đến đã lưu',
        },
      });
    } else {
      router.push('/(authenticated)/(tabs)/home');
    }
  };

  const renderSessionItem = ({ item }: { item: NavigationSessionItem }) => {
    const isCompleted =
      item.status?.toUpperCase() === 'COMPLETED' || item.status?.toUpperCase() === 'ENDED';
    const isActive = item.status?.toUpperCase() === 'ACTIVE';

    const vehicleMeta =
      vehicleTypeLabels[item.vehicleType?.toUpperCase() ?? ''] ||
      vehicleTypeLabels[item.vehicleMode?.toUpperCase() ?? ''] || {
        label: 'Di chuyển',
        icon: 'navigation',
      };

    const originText =
      item.originName ||
      formatCoords(item.origin, item.originLatitude, item.originLongitude) ||
      'Điểm xuất phát';

    const destText =
      item.destinationName ||
      formatCoords(item.destination, item.destinationLatitude, item.destinationLongitude) ||
      'Điểm đến';

    const distanceStr = formatDistance(item.distanceMeters);
    const durationStr = formatDuration(item.durationSeconds);

    return (
      <View
        style={[
          styles.tripCard,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
          },
        ]}
      >
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.vehiclePill}>
            <MaterialCommunityIcons color={theme.primary} name={vehicleMeta.icon} size={16} />
            <Text style={[styles.vehicleText, { color: theme.primary }]}>{vehicleMeta.label}</Text>
          </View>

          <View style={styles.headerRight}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: isCompleted
                    ? 'rgba(16, 185, 129, 0.12)'
                    : isActive
                      ? 'rgba(6, 113, 235, 0.12)'
                      : 'rgba(148, 163, 184, 0.15)',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color: isCompleted ? '#10B981' : isActive ? theme.primary : theme.grey,
                  },
                ]}
              >
                {isCompleted ? 'Hoàn tất' : isActive ? 'Đang chạy' : item.status || 'Kết thúc'}
              </Text>
            </View>

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
            <View style={styles.startDot} />
            <View style={[styles.routeDottedLine, { borderColor: theme.border }]} />
            <View style={styles.endPin}>
              <MaterialCommunityIcons color="#EF4444" name="map-marker" size={16} />
            </View>
          </View>

          <View style={styles.routeTextColumn}>
            <View style={styles.locationBlock}>
              <Text style={[styles.locationLabel, { color: theme.grey }]}>Xuất phát</Text>
              <Text numberOfLines={1} style={[styles.locationName, { color: theme.text }]}>
                {originText}
              </Text>
            </View>

            <View style={styles.locationBlock}>
              <Text style={[styles.locationLabel, { color: theme.grey }]}>Điểm đến</Text>
              <Text numberOfLines={1} style={[styles.locationName, { color: theme.text }]}>
                {destText}
              </Text>
            </View>
          </View>
        </View>

        {/* Card Footer */}
        <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
          <View style={styles.timeMeta}>
            <MaterialCommunityIcons color={theme.grey} name="clock-outline" size={14} />
            <Text style={[styles.timeText, { color: theme.grey }]}>
              {formatTimestamp(item.createdAt || item.startedAt)}
            </Text>
            {distanceStr || durationStr ? (
              <Text style={[styles.metricText, { color: theme.textSecondary }]}>
                · {[distanceStr, durationStr].filter(Boolean).join(' · ')}
              </Text>
            ) : null}
          </View>

          <Pressable
            accessibilityLabel="Điều hướng lại lộ trình này"
            accessibilityRole="button"
            onPress={() => handleReNavigate(item)}
            style={({ pressed }) => [
              styles.reNavigateBtn,
              { backgroundColor: theme.backgroundSelected, opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <MaterialCommunityIcons color={theme.primary} name="navigation-variant-outline" size={14} />
            <Text style={[styles.reNavigateText, { color: theme.primary }]}>Đi lại</Text>
          </Pressable>
        </View>
      </View>
    );
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

        {/* Quick Stats Summary Banner */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <View style={[styles.statIconBox, { backgroundColor: '#0671eb15' }]}>
              <MaterialCommunityIcons color={theme.primary} name="map-marker-path" size={20} />
            </View>
            <Text style={[styles.statNumber, { color: theme.text }]}>{totalTrips}</Text>
            <Text style={[styles.statLabel, { color: theme.grey }]}>Tổng chuyến</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <View style={[styles.statIconBox, { backgroundColor: '#10B98115' }]}>
              <MaterialCommunityIcons color="#10B981" name="check-all" size={20} />
            </View>
            <Text style={[styles.statNumber, { color: '#10B981' }]}>{completedCount}</Text>
            <Text style={[styles.statLabel, { color: theme.grey }]}>Đã hoàn tất</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <View style={[styles.statIconBox, { backgroundColor: '#8B5CF615' }]}>
              <MaterialCommunityIcons color="#8B5CF6" name="compass-outline" size={20} />
            </View>
            <Text style={[styles.statNumber, { color: '#8B5CF6' }]}>5 tín chỉ</Text>
            <Text style={[styles.statLabel, { color: theme.grey }]}>Phí / phiên</Text>
          </View>
        </View>

        {/* Filter Bar */}
        <View
          accessibilityLabel="Bộ lọc chuyến đi"
          accessibilityRole="tablist"
          style={[styles.filterBar, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
        >
          {(['all', 'completed', 'active'] as FilterTab[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.filterTab,
                  isActive && [styles.filterTabActive, { backgroundColor: theme.primary }],
                ]}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    { color: isActive ? '#FFFFFF' : theme.textSecondary },
                  ]}
                >
                  {tab === 'all' ? 'Tất cả' : tab === 'completed' ? 'Hoàn tất' : 'Đang chạy'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Main List */}
        <FlatList
          contentContainerStyle={styles.listContent}
          data={filteredItems}
          keyExtractor={(item, index) => item.id || String(index)}
          onRefresh={() => {
            void refetch();
          }}
          ref={listRef}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.primary} />
          }
          refreshing={isRefetching}
          renderItem={renderSessionItem}
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
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.three,
  },
  statBox: {
    flex: 1,
    padding: Spacing.two,
    borderRadius: Rounded.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statNumber: {
    fontFamily: Fonts.body,
    fontSize: 15,
    fontWeight: '800',
  },
  statLabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: '500',
  },
  filterBar: {
    flexDirection: 'row',
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.three,
    padding: 4,
    borderRadius: Rounded.md,
    borderWidth: 1,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Rounded.sm,
  },
  filterTabActive: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterTabText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
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
    backgroundColor: '#0671eb12',
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Rounded.round,
  },
  statusText: {
    fontFamily: Fonts.body,
    fontSize: 11,
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
    paddingTop: 4,
  },
  startDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
  routeDottedLine: {
    width: 1,
    height: 32,
    borderLeftWidth: 2,
    borderStyle: 'dashed',
    marginVertical: 2,
  },
  endPin: {
    marginTop: -2,
  },
  routeTextColumn: {
    flex: 1,
    gap: 12,
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
    fontSize: 14,
    fontWeight: '700',
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
