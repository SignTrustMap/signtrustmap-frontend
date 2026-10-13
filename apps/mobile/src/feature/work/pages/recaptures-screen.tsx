import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Platform,
  Pressable,
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
  BLURRY: { label: 'Ảnh mờ / rung tay', color: '#DC2626', bg: 'rgba(220, 38, 38, 0.12)' },
  POOR_LIGHTING: { label: 'Thiếu sáng / ngược sáng', color: '#D97706', bg: 'rgba(217, 119, 6, 0.12)' },
  WRONG_ANGLE: { label: 'Góc chụp nghiêng / lệch', color: '#D97706', bg: 'rgba(217, 119, 6, 0.12)' },
  OCCLUDED: { label: 'Bị vật cản che khuất', color: '#9333EA', bg: 'rgba(147, 51, 234, 0.12)' },
  MISSING_CONTEXT: { label: 'Thiếu góc toàn cảnh', color: '#2563EB', bg: 'rgba(37, 99, 235, 0.12)' },
  OTHER: { label: 'Lý do khác', color: '#4B5563', bg: 'rgba(75, 85, 99, 0.12)' },
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

  // Poll / fetch GPS position on mount
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

  const handleStartRecapture = useCallback((item: SurveyorRecaptureItem) => {
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
  }, [router]);

  const renderItem = useCallback(
    ({ item }: { item: SurveyorRecaptureItem }) => {
      const meta =
        (REASON_LABELS as Record<string, { label: string; color: string; bg: string }>)[item.reason] ?? {
          label: item.reason || 'Lý do khác',
          color: '#D97706',
          bg: 'rgba(217, 119, 6, 0.12)',
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
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}
        >
          {/* Card Top: Image + Info */}
          <View style={styles.cardHeader}>
            <View style={styles.imageWrapper}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.signImage} resizeMode="cover" />
              ) : (
                <View style={[styles.placeholderImage, { backgroundColor: theme.border }]}>
                  <MaterialCommunityIcons name="image-off-outline" size={24} color={theme.grey} />
                </View>
              )}
            </View>

            <View style={styles.cardInfo}>
              <View style={styles.titleRow}>
                <Text numberOfLines={1} style={[styles.signTitle, { color: theme.text }]}>
                  {item.name_vi || item.name_en || item.sign_code || 'Biển báo mới đề xuất'}
                </Text>
                {item.sign_code && (
                  <View style={[styles.codeBadge, { backgroundColor: theme.border }]}>
                    <Text style={[styles.codeBadgeText, { color: theme.text }]}>{item.sign_code}</Text>
                  </View>
                )}
              </View>

              {/* Reason Badge */}
              <View style={[styles.reasonBadge, { backgroundColor: meta.bg }]}>
                <MaterialCommunityIcons name="alert-circle-outline" size={13} color={meta.color} />
                <Text style={[styles.reasonBadgeText, { color: meta.color }]}>{meta.label}</Text>
              </View>

              {/* Reviewer Note */}
              {item.note ? (
                <Text numberOfLines={2} style={[styles.reviewerNote, { color: theme.grey }]}>
                  {`💬 "${item.note}"`}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Location & Geofence Status */}
          <View style={[styles.locationRow, { borderTopColor: theme.border }]}>
            <View style={styles.locationLeft}>
              <MaterialCommunityIcons name="map-marker-outline" size={15} color={theme.grey} />
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
                      ? 'rgba(16, 185, 129, 0.12)'
                      : 'rgba(245, 158, 11, 0.12)',
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={isWithinGeofence ? 'check-circle-outline' : 'crosshairs-gps'}
                  size={13}
                  color={isWithinGeofence ? '#10B981' : '#D97706'}
                />
                <Text
                  style={[
                    styles.distanceText,
                    { color: isWithinGeofence ? '#10B981' : '#D97706' },
                  ]}
                >
                  {formatDistance(distanceMeters)} {isWithinGeofence ? '(Hợp lệ)' : '(Cần lại gần)'}
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.cardActions}>
            <Pressable
              onPress={() => handleOpenDirections(item.latitude, item.longitude)}
              style={({ pressed }) => [
                styles.directionsButton,
                { borderColor: theme.border },
                pressed && { opacity: 0.7 },
              ]}
            >
              <MaterialCommunityIcons name="navigation-variant-outline" size={16} color={theme.text} />
              <Text style={[styles.directionsButtonText, { color: theme.text }]}>Chỉ đường</Text>
            </Pressable>

            <AppButton
              onPress={() => handleStartRecapture(item)}
              style={styles.recaptureButton}
              variant="primary"
            >
              <MaterialCommunityIcons name="camera-retake-outline" size={16} color="#fff" />
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
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Pressable
            accessibilityLabel="Quay lại"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
          >
            <MaterialCommunityIcons name="chevron-left" size={28} color={theme.text} />
          </Pressable>

          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Yêu cầu chụp lại</Text>
            <Text style={[styles.headerSubtitle, { color: theme.grey }]}>
              {items.length} biển báo cần bổ sung ảnh thực địa
            </Text>
          </View>

          <Pressable
            onPress={() => refetch()}
            style={({ pressed }) => [styles.refreshButton, pressed && { opacity: 0.7 }]}
          >
            <MaterialCommunityIcons
              name="refresh"
              size={22}
              color={theme.text}
              style={isRefetching ? styles.spinning : undefined}
            />
          </Pressable>
        </View>

        {/* Info Banner */}
        <View style={[styles.banner, { backgroundColor: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.25)' }]}>
          <MaterialCommunityIcons name="information-outline" size={18} color="#D97706" style={styles.bannerIcon} />
          <Text style={[styles.bannerText, { color: theme.text }]}>
            Vui lòng di chuyển đến thực địa trong phạm vi <Text style={styles.boldText}>≤ 100m</Text> so với biển báo gốc để nộp ảnh hợp lệ.
          </Text>
        </View>

        {/* Content List */}
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#F59E0B" />
            <Text style={[styles.loadingText, { color: theme.grey }]}>Đang tải danh sách yêu cầu...</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.centerContainer}>
            <MaterialCommunityIcons name="check-decagram-outline" size={56} color="#10B981" />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Không có yêu cầu chụp lại nào</Text>
            <Text style={[styles.emptySubtitle, { color: theme.grey }]}>
              Tất cả các biển báo bạn khảo sát đã đạt yêu cầu hoặc chưa có yêu cầu bổ sung mới.
            </Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(it) => String(it.request_id)}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#F59E0B" />
            }
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.half,
    marginLeft: -Spacing.half,
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: Spacing.half,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Fonts.body,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: Fonts.body,
    marginTop: 1,
  },
  refreshButton: {
    padding: Spacing.half,
  },
  spinning: {
    transform: [{ rotate: '45deg' }],
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.half,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Rounded.md,
    borderWidth: 1,
  },
  bannerIcon: {
    marginRight: Spacing.sm,
  },
  bannerText: {
    flex: 1,
    fontSize: 12,
    fontFamily: Fonts.body,
    lineHeight: 16,
  },
  boldText: {
    fontFamily: Fonts.body,
    fontWeight: 'bold',
    color: '#D97706',
  },
  listContent: {
    padding: Spacing.md,
    gap: Spacing.md,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  card: {
    borderRadius: Rounded.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  imageWrapper: {
    width: 76,
    height: 76,
    borderRadius: Rounded.md,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.05)',
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
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.half,
  },
  signTitle: {
    fontSize: 15,
    fontFamily: Fonts.body,
    fontWeight: 'bold',
    flex: 1,
  },
  codeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Rounded.sm,
  },
  codeBadgeText: {
    fontSize: 11,
    fontFamily: Fonts.mono,
    fontWeight: '600',
  },
  reasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Rounded.sm,
    marginVertical: 4,
  },
  reasonBadgeText: {
    fontSize: 11,
    fontFamily: Fonts.body,
    fontWeight: '600',
  },
  reviewerNote: {
    fontSize: 12,
    fontFamily: Fonts.body,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: Spacing.half,
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
    paddingVertical: 2,
    borderRadius: Rounded.sm,
  },
  distanceText: {
    fontSize: 11,
    fontFamily: Fonts.mono,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 4,
  },
  directionsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Rounded.md,
    borderWidth: 1,
  },
  directionsButtonText: {
    fontSize: 13,
    fontFamily: Fonts.body,
    fontWeight: '600',
  },
  recaptureButton: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Rounded.md,
    backgroundColor: '#F59E0B',
  },
  recaptureButtonText: {
    fontSize: 13,
    fontFamily: Fonts.body,
    fontWeight: 'bold',
    color: '#fff',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: Fonts.body,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: Fonts.body,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: Fonts.body,
    textAlign: 'center',
    lineHeight: 18,
  },
});
export default RecapturesScreen;
