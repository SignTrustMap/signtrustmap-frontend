import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/button';
import { Fonts, MaxContentWidth, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { resolveS3Url } from '@/api/reviews/review-workflow';
import { useGetMyRecaptures } from '@/feature/review/hooks/use-recapture';
import { calculateDistanceMeters } from '@/feature/navigation/utils/geo';
import { fetchFreshGpsPosition } from '@/feature/navigation/utils/gps';
import type { RecaptureReason, SurveyorRecaptureItem } from '@/types/reviewsType';

const REASON_LABELS: Record<RecaptureReason, { label: string; color: string; bg: string }> = {
  BLURRY: { label: 'Ảnh mờ / rung tay', color: '#DC2626', bg: 'rgba(220, 38, 38, 0.1)' },
  POOR_LIGHTING: { label: 'Thiếu sáng / ngược sáng', color: '#D97706', bg: 'rgba(217, 119, 6, 0.1)' },
  WRONG_ANGLE: { label: 'Góc chụp nghiêng / lệch', color: '#D97706', bg: 'rgba(217, 119, 6, 0.1)' },
  OCCLUDED: { label: 'Bị vật cản che khuất', color: '#9333EA', bg: 'rgba(147, 51, 234, 0.1)' },
  MISSING_CONTEXT: { label: 'Thiếu góc toàn cảnh', color: '#2563EB', bg: 'rgba(37, 99, 235, 0.1)' },
  OTHER: { label: 'Lý do khác', color: '#4B5563', bg: 'rgba(75, 85, 99, 0.1)' },
};

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

export function RecapturesScreen() {
  const router = useRouter();
  const theme = useTheme();

  const { data, isLoading, refetch, isRefetching } = useGetMyRecaptures({ page: 1, pageSize: 50 });
  const items = data?.items ?? [];

  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null);

  // Cập nhật vị trí GPS định kỳ
  useEffect(() => {
    let isMounted = true;
    async function updateGps() {
      const pos = await fetchFreshGpsPosition(4000);
      if (isMounted && pos) {
        setCurrentPosition(pos);
      }
    }
    void updateGps();
    const interval = setInterval(updateGps, 8000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleOpenDirections = (lat: number, lon: number) => {
    const scheme = Platform.select({
      ios: `maps://0,0?q=${lat},${lon}`,
      android: `geo:0,0?q=${lat},${lon}`,
      default: `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`,
    });
    void Linking.openURL(scheme);
  };

  const handleStartRecapture = useCallback(
    (item: SurveyorRecaptureItem) => {
      router.push({
        pathname: '/work/recapture-camera',
        params: {
          candidateId: item.candidate_id,
          targetLat: String(item.latitude),
          targetLon: String(item.longitude),
          signTitle: item.name_vi || item.name_en || item.sign_code || 'Biển báo mới đề xuất',
          reason: item.reason,
          note: item.note || '',
          oldSignCropUrl: item.sign_crop_url || '',
        },
      });
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: SurveyorRecaptureItem }) => {
      const meta =
        (REASON_LABELS as Record<string, { label: string; color: string; bg: string }>)[item.reason] ?? {
          label: item.reason || 'Lý do khác',
          color: theme.primary,
          bg: theme.backgroundSelected,
        };
      const imageUrl = resolveS3Url(item.sign_crop_url || item.best_frame_url);

      const distanceMeters =
        currentPosition && item.latitude && item.longitude
          ? calculateDistanceMeters(currentPosition, [item.longitude, item.latitude])
          : null;

      const isWithinGeofence = distanceMeters != null && distanceMeters <= 100;

      return (
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
            },
          ]}
        >
          {/* Card Top: Image + Info */}
          <View style={styles.cardHeader}>
            <View style={[styles.imageWrapper, { backgroundColor: theme.neutral }]}>
              {imageUrl ? (
                <Image
                  contentFit="cover"
                  source={{ uri: imageUrl }}
                  style={styles.signImage}
                  transition={200}
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <MaterialCommunityIcons color={theme.placeholder} name="image-off-outline" size={26} />
                </View>
              )}
            </View>

            <View style={styles.cardInfo}>
              <View style={styles.titleRow}>
                <Text numberOfLines={1} style={[styles.signTitle, { color: theme.text }]}>
                  {item.name_vi || item.name_en || item.sign_code || 'Biển báo mới đề xuất'}
                </Text>
                {item.sign_code ? (
                  <View
                    style={[
                      styles.codeBadge,
                      {
                        backgroundColor: theme.backgroundSelected,
                        borderColor: `${theme.primary}40`,
                      },
                    ]}
                  >
                    <Text style={[styles.codeBadgeText, { color: theme.primary }]}>
                      {item.sign_code}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Reason Badge */}
              <View style={[styles.reasonBadge, { backgroundColor: meta.bg }]}>
                <MaterialCommunityIcons color={meta.color} name="alert-circle-outline" size={13} />
                <Text style={[styles.reasonBadgeText, { color: meta.color }]}>{meta.label}</Text>
              </View>

              {/* Reviewer Note */}
              {item.note ? (
                <Text numberOfLines={2} style={[styles.reviewerNote, { color: theme.textSecondary }]}>
                  {`💬 "${item.note}"`}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Location & Geofence Status */}
          <View style={[styles.locationRow, { borderTopColor: theme.border }]}>
            <View style={styles.locationLeft}>
              <MaterialCommunityIcons color={theme.placeholder} name="map-marker-outline" size={15} />
              <Text style={[styles.coordsText, { color: theme.grey }]}>
                {item.latitude.toFixed(5)}°, {item.longitude.toFixed(5)}°
              </Text>
            </View>

            {distanceMeters != null && (
              <View
                style={[
                  styles.distanceBadge,
                  {
                    backgroundColor: isWithinGeofence
                      ? 'rgba(22, 163, 74, 0.12)'
                      : theme.backgroundSelected,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  color={isWithinGeofence ? '#16A34A' : theme.primary}
                  name={isWithinGeofence ? 'check-circle' : 'navigation-variant'}
                  size={13}
                />
                <Text
                  style={[
                    styles.distanceText,
                    { color: isWithinGeofence ? '#16A34A' : theme.primary },
                  ]}
                >
                  {isWithinGeofence
                    ? `✓ Cách ${formatDistance(distanceMeters)} (Hợp lệ)`
                    : `Cách ${formatDistance(distanceMeters)} (Cần lại gần)`}
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons Row */}
          <View style={styles.cardActions}>
            <AppButton
              accessibilityLabel="Chỉ đường tới biển báo"
              onPress={() => handleOpenDirections(item.latitude, item.longitude)}
              style={styles.directionsButton}
              variant="surface"
            >
              <MaterialCommunityIcons color={theme.text} name="navigation-variant-outline" size={16} />
              <Text style={[styles.directionsButtonText, { color: theme.text }]}>Chỉ đường</Text>
            </AppButton>

            <AppButton
              accessibilityLabel="Bắt đầu chụp lại ảnh biển báo"
              onPress={() => handleStartRecapture(item)}
              style={styles.recaptureButton}
              variant="primary"
            >
              <MaterialCommunityIcons color="#FFFFFF" name="camera-retake-outline" size={16} />
              <Text style={styles.recaptureButtonText}>Chụp lại ngay</Text>
            </AppButton>
          </View>
        </View>
      );
    },
    [theme, currentPosition, handleStartRecapture],
  );

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Top Header */}
        <View
          style={[
            styles.topBar,
            {
              backgroundColor: theme.backgroundElement,
              borderBottomColor: theme.border,
            },
          ]}
        >
          <AppButton
            accessibilityLabel="Quay lại công việc"
            onPress={() => router.back()}
            pressedOpacity={0.6}
            style={styles.backButton}
            variant="ghost"
          >
            <MaterialCommunityIcons color={theme.text} name="arrow-left" size={24} />
          </AppButton>

          <View style={styles.topBarTitle}>
            <Text style={[styles.screenTitle, { color: theme.text }]}>Yêu cầu chụp lại</Text>
            <Text style={[styles.screenSubtitle, { color: theme.grey }]}>
              {items.length} biển báo cần bổ sung ảnh thực địa
            </Text>
          </View>

          <AppButton
            accessibilityLabel="Làm mới danh sách"
            disabled={isRefetching}
            onPress={() => void refetch()}
            pressedOpacity={0.6}
            style={styles.backButton}
            variant="ghost"
          >
            <MaterialCommunityIcons
              color={theme.primary}
              name="reload"
              size={22}
              style={isRefetching ? styles.spinning : undefined}
            />
          </AppButton>
        </View>

        {/* Helpful Guideline Banner */}
        <View
          style={[
            styles.banner,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
              borderLeftColor: theme.primary,
            },
          ]}
        >
          <MaterialCommunityIcons
            color={theme.primary}
            name="map-marker-radius-outline"
            size={20}
            style={styles.bannerIcon}
          />
          <Text style={[styles.bannerText, { color: theme.text }]}>
            Di chuyển đến vị trí biển báo (bán kính <Text style={styles.boldText}>≤ 100m</Text>) để chụp và nộp ảnh thay thế hợp lệ.
          </Text>
        </View>

        {/* Content List */}
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator color={theme.primary} size="large" />
            <Text style={[styles.loadingText, { color: theme.grey }]}>
              Đang tải danh sách yêu cầu...
            </Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.centerContainer}>
            <MaterialCommunityIcons color="#10B981" name="check-decagram-outline" size={56} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              Không có yêu cầu chụp lại nào
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.grey }]}>
              Tất cả các biển báo bạn khảo sát đã đạt yêu cầu hoặc chưa có yêu cầu bổ sung mới.
            </Text>
          </View>
        ) : (
          <FlatList
            contentContainerStyle={styles.listContent}
            data={items}
            keyExtractor={(it) => String(it.request_id)}
            refreshControl={
              <RefreshControl onRefresh={refetch} refreshing={isRefetching} tintColor={theme.primary} />
            }
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    gap: Spacing.two,
  },
  backButton: {
    width: 40,
    height: 40,
    minHeight: 40,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: Rounded.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    flex: 1,
    gap: 2,
  },
  screenTitle: {
    fontFamily: Fonts.title,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },
  screenSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  spinning: {
    transform: [{ rotate: '45deg' }],
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.four,
    marginTop: Spacing.three,
    marginBottom: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Rounded.md,
    borderWidth: 1,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  bannerIcon: {
    marginRight: Spacing.two,
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.body,
    lineHeight: 18,
  },
  boldText: {
    fontFamily: Fonts.body,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  card: {
    borderRadius: Rounded.lg,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  imageWrapper: {
    width: 76,
    height: 76,
    borderRadius: Rounded.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.one,
  },
  signTitle: {
    fontSize: 16,
    fontFamily: Fonts.body,
    fontWeight: '700',
    lineHeight: 22,
    flex: 1,
  },
  codeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Rounded.sm,
    borderWidth: 1,
  },
  codeBadgeText: {
    fontSize: 11,
    fontFamily: Fonts.mono,
    fontWeight: '700',
  },
  reasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Rounded.sm,
  },
  reasonBadgeText: {
    fontSize: 11,
    fontFamily: Fonts.body,
    fontWeight: '700',
  },
  reviewerNote: {
    fontSize: 12,
    fontFamily: Fonts.body,
    lineHeight: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: Spacing.two,
  },
  locationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coordsText: {
    fontSize: 11,
    fontFamily: Fonts.mono,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Rounded.sm,
  },
  distanceText: {
    fontSize: 11,
    fontFamily: Fonts.body,
    fontWeight: '700',
  },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: 2,
  },
  directionsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 42,
    paddingHorizontal: Spacing.two,
    borderRadius: Rounded.md,
  },
  directionsButtonText: {
    fontSize: 13,
    fontFamily: Fonts.body,
    fontWeight: '700',
  },
  recaptureButton: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 42,
    paddingHorizontal: Spacing.two,
    borderRadius: Rounded.md,
  },
  recaptureButtonText: {
    fontSize: 13,
    fontFamily: Fonts.body,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
    gap: Spacing.two,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: Fonts.body,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: Fonts.title,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: Spacing.two,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: Fonts.body,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
  },
});

export default RecapturesScreen;
