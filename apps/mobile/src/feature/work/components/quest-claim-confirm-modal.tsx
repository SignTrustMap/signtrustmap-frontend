import { Image } from 'expo-image';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppButton } from '@/components/button';
import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getMapLibre } from '@/services/maplibre';
import { env } from '@/config/env';
import { resolveS3Url } from '@/api/reviews/review-workflow';
import type { BountyQuestItem } from '@/types/bountyBoardType';

export interface QuestClaimConfirmModalProps {
  visible: boolean;
  quest: BountyQuestItem | null;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
}

const openStreetMapStyle: any = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: [env.mapTileUrl],
      tileSize: 256,
      attribution: 'OpenStreetMap contributors',
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

export function QuestClaimConfirmModal({
  visible,
  quest,
  onConfirm,
  onClose,
  loading = false,
}: QuestClaimConfirmModalProps) {
  const theme = useTheme();

  if (!quest) return null;

  const mapLibre = getMapLibre();
  const hasCoords =
    quest.latitude != null &&
    quest.longitude != null &&
    Number.isFinite(quest.latitude) &&
    Number.isFinite(quest.longitude);

  const formattedDistance =
    quest.distanceMeters != null
      ? quest.distanceMeters >= 1000
        ? `${(quest.distanceMeters / 1000).toFixed(1)} km`
        : `${Math.round(quest.distanceMeters)} mét`
      : 'Gần bạn';

  const imageUrl = resolveS3Url(quest.signCropUrl || quest.bestFrameUrl);

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel="Đóng hộp thoại"
          onPress={loading ? undefined : onClose}
          style={styles.backdrop}
        />
        <View
          style={[
            styles.container,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <ScrollView
            bounces={false}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.text }]}>
                Xác nhận nhận nhiệm vụ
              </Text>
            </View>

            <View style={styles.content}>
              {/* Sign details summary */}
              <View
                style={[
                  styles.signSummary,
                  { backgroundColor: theme.backgroundElement },
                ]}
              >
                <View style={styles.signRow}>
                  {imageUrl ? (
                    <Image
                      contentFit="contain"
                      source={{ uri: imageUrl }}
                      style={styles.signThumb}
                    />
                  ) : null}
                  <View style={styles.signInfo}>
                    <Text numberOfLines={2} style={[styles.signName, { color: theme.text }]}>
                      {quest.signName || quest.signCode || 'Biển báo giao thông'}
                    </Text>
                    {quest.signCode && quest.signName ? (
                      <Text style={[styles.signCode, { color: theme.placeholder }]}>
                        Mã biển: {quest.signCode}
                      </Text>
                    ) : null}
                    <Text style={[styles.rewardInfo, { color: theme.primary }]}>
                      Thưởng khi xong: +{quest.totalRewardCredits} điểm
                    </Text>
                  </View>
                </View>
              </View>

              {/* Map Preview */}
              {hasCoords && mapLibre ? (
                <View style={[styles.mapWrapper, { borderColor: theme.border }]}>
                  <mapLibre.Map
                    key={`quest-preview-map-${quest.targetId}`}
                    attribution={false}
                    compass={false}
                    logo={false}
                    mapStyle={openStreetMapStyle}
                    style={styles.mapView}
                    touchPitch={false}
                    touchRotate={false}
                  >
                    <mapLibre.Camera
                      key={`quest-preview-camera-${quest.targetId}`}
                      center={[quest.longitude!, quest.latitude!]}
                      duration={0}
                      maxZoom={19}
                      minZoom={10}
                      zoom={15.5}
                    />
                    <mapLibre.Marker
                      anchor="center"
                      lngLat={[quest.longitude!, quest.latitude!]}
                    >
                      <View style={styles.markerContainer}>
                        <MaterialCommunityIcons color={theme.primary} name="map-marker" size={32} />
                      </View>
                    </mapLibre.Marker>
                  </mapLibre.Map>

                  <View
                    style={[
                      styles.distanceFloatingPill,
                      { backgroundColor: theme.surface, borderColor: theme.border },
                    ]}
                  >
                    <MaterialCommunityIcons color={theme.primary} name="map-marker-distance" size={14} />
                    <Text style={[styles.distancePillText, { color: theme.text }]}>
                      Cách vị trí hiện tại: {formattedDistance}
                    </Text>
                  </View>
                </View>
              ) : hasCoords ? (
                <View
                  style={[
                    styles.fallbackMapBox,
                    { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                  ]}
                >
                  <MaterialCommunityIcons color={theme.primary} name="map-marker-radius-outline" size={24} />
                  <Text style={[styles.fallbackMapText, { color: theme.text }]}>
                    {quest.displayAddress || 'Vị trí biển báo trên thực địa'}
                  </Text>
                  <Text style={[styles.fallbackMapDistance, { color: theme.placeholder }]}>
                    Cách vị trí hiện tại: {formattedDistance}
                  </Text>
                </View>
              ) : null}

              {/* Warning Notice */}
              <View style={styles.warningBox}>
                <MaterialCommunityIcons
                  color="#D97706"
                  name="alert-circle-outline"
                  size={20}
                />
                <Text style={styles.warningText}>
                  Bạn có 120 phút để đến nơi và xác thực biển báo này. Nếu không hoàn thành đúng hạn, bạn sẽ bị trừ 5 điểm uy tín và không nhận được điểm thưởng.
                </Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              <AppButton
                disabled={loading}
                label="Bỏ qua"
                onPress={onClose}
                style={styles.button}
                variant="surface"
              />
              <AppButton
                disabled={loading}
                label={loading ? 'Đang nhận...' : 'Đồng ý nhận'}
                onPress={onConfirm}
                style={styles.button}
                variant="primary"
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    borderRadius: Rounded.xlg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    alignItems: 'center',
    paddingBottom: Spacing.one,
  },
  title: {
    fontFamily: Fonts.sans,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  content: {
    gap: Spacing.two,
  },
  signSummary: {
    borderRadius: Rounded.md,
    padding: Spacing.two,
  },
  signRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  signThumb: {
    width: 48,
    height: 48,
    borderRadius: Rounded.sm,
  },
  signInfo: {
    flex: 1,
    gap: 2,
  },
  signName: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    fontWeight: '700',
  },
  signCode: {
    fontFamily: Fonts.sans,
    fontSize: 12,
  },
  rewardInfo: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: '700',
  },
  mapWrapper: {
    height: 140,
    borderRadius: Rounded.md,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  mapView: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  distanceFloatingPill: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Rounded.sm,
    borderWidth: 1,
    gap: 4,
  },
  distancePillText: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '600',
  },
  fallbackMapBox: {
    borderRadius: Rounded.md,
    borderWidth: 1,
    padding: Spacing.three,
    alignItems: 'center',
    gap: 4,
  },
  fallbackMapText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  fallbackMapDistance: {
    fontFamily: Fonts.sans,
    fontSize: 12,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderRadius: Rounded.md,
    padding: Spacing.three,
    gap: Spacing.one,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  warningText: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 19,
    color: '#92400E',
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  button: {
    flex: 1,
  },
});
