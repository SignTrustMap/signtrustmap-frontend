import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppButton } from '@/components/button';
import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useOfflineMaps } from '@/hooks/use-offline-maps';
import { formatBytes } from '@/services/offline-map-service';
import type { OfflineMapPack } from '@/types/navigationType';

export interface OfflineMapModalProps {
  visible: boolean;
  onClose: () => void;
  accessToken?: string;
}

export function OfflineMapModal({ visible, onClose, accessToken }: OfflineMapModalProps) {
  const theme = useTheme();
  const {
    availablePacks,
    installedPacks,
    activePackId,
    progressMap,
    isLoading,
    error,
    totalInstalledSizeFormatted,
    fetchPacks,
    startDownload,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    deletePack,
    toggleActivePack,
  } = useOfflineMaps(accessToken);

  const handleDeleteWithPrompt = (packId: string, packName: string) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Bạn có chắc muốn xóa bản đồ "${packName}" khỏi thiết bị?`);
      if (confirmed) {
        deletePack(packId);
      }
      return;
    }

    Alert.alert(
      'Xóa bản đồ ngoại tuyến',
      `Bạn có chắc chắn muốn xóa bản đồ "${packName}" khỏi bộ nhớ thiết bị?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => deletePack(packId),
        },
      ],
    );
  };

  const renderPackItem = (pack: OfflineMapPack) => {
    const installed = installedPacks[pack.id];
    const progress = progressMap[pack.id];
    const isDownloading = progress?.status === 'downloading';
    const isPaused = progress?.status === 'paused';
    const isActive = activePackId === pack.id;
    const isError = progress?.status === 'error';

    const percentage = progress?.percentage || 0;
    const downloadedBytes = progress?.downloadedBytes || 0;
    const totalBytes = progress?.totalBytes || pack.sizeBytes;

    return (
      <View
        key={pack.id}
        style={[
          styles.packCard,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: isActive ? theme.primary : theme.border,
            borderWidth: isActive ? 2 : 1,
          },
        ]}
      >
        <View style={styles.packHeaderRow}>
          <View style={styles.packIconContainer}>
            <MaterialCommunityIcons
              name={installed ? 'map-check' : 'map-clock-outline'}
              size={24}
              color={isActive ? theme.primary : theme.text}
            />
          </View>
          <View style={styles.packTitleColumn}>
            <Text style={[styles.packTitle, { color: theme.text }]} numberOfLines={1}>
              {pack.name}
            </Text>
            <Text style={[styles.packRegionText, { color: theme.placeholder }]}>
              {pack.region} ({pack.countryCode}) • Zoom: z{pack.minZoom} - z{pack.maxZoom}
            </Text>
          </View>

          {/* Status Badge */}
          {isActive ? (
            <View style={[styles.statusBadge, { backgroundColor: '#10B98120' }]}>
              <Text style={[styles.statusBadgeText, { color: '#059669' }]}>Đang kích hoạt</Text>
            </View>
          ) : installed ? (
            <View style={[styles.statusBadge, { backgroundColor: '#3B82F620' }]}>
              <Text style={[styles.statusBadgeText, { color: '#2563EB' }]}>Đã tải</Text>
            </View>
          ) : isDownloading ? (
            <View style={[styles.statusBadge, { backgroundColor: '#F59E0B20' }]}>
              <Text style={[styles.statusBadgeText, { color: '#D97706' }]}>Đang tải {percentage}%</Text>
            </View>
          ) : isPaused ? (
            <View style={[styles.statusBadge, { backgroundColor: '#6B728020' }]}>
              <Text style={[styles.statusBadgeText, { color: '#4B5563' }]}>Tạm dừng</Text>
            </View>
          ) : (
            <View style={[styles.statusBadge, { backgroundColor: theme.background }]}>
              <Text style={[styles.statusBadgeText, { color: theme.placeholder }]}>Chưa tải</Text>
            </View>
          )}
        </View>

        <Text style={[styles.packDescription, { color: theme.text }]} numberOfLines={2}>
          {pack.description}
        </Text>

        <View style={styles.packMetaRow}>
          <Text style={[styles.packSizeText, { color: theme.placeholder }]}>
            Dung lượng: {formatBytes(installed?.sizeBytes || pack.sizeBytes)}
          </Text>
          {installed ? (
            <Text style={[styles.packDateText, { color: theme.placeholder }]}>
              Cài đặt: {new Date(installed.installedAt).toLocaleDateString('vi-VN')}
            </Text>
          ) : null}
        </View>

        {/* Progress Bar when Downloading or Paused */}
        {isDownloading || isPaused ? (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBarBackground, { backgroundColor: theme.border }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: isPaused ? '#F59E0B' : theme.primary,
                    width: `${percentage}%`,
                  },
                ]}
              />
            </View>
            <View style={styles.progressLabelRow}>
              <Text style={[styles.progressBytesText, { color: theme.placeholder }]}>
                {formatBytes(downloadedBytes)} / {formatBytes(totalBytes)}
              </Text>
              <Text style={[styles.progressPercentText, { color: theme.text }]}>
                {percentage}%
              </Text>
            </View>
          </View>
        ) : null}

        {isError && progress?.errorMessage ? (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color={theme.danger} />
            <Text style={[styles.errorBannerText, { color: theme.danger }]} numberOfLines={2}>
              {progress.errorMessage}
            </Text>
          </View>
        ) : null}

        {/* Action Controls */}
        <View style={styles.actionsRow}>
          {installed ? (
            <>
              <AppButton
                accessibilityLabel={isActive ? 'Bỏ kích hoạt bản đồ' : 'Kích hoạt bản đồ ngoại tuyến'}
                variant={isActive ? 'outline' : 'solid'}
                onPress={() => toggleActivePack(pack.id)}
                style={styles.actionBtnPrimary}
              >
                <MaterialCommunityIcons
                  name={isActive ? 'check-circle' : 'power-standby'}
                  size={16}
                  color={isActive ? theme.primary : theme.onPrimary}
                />
                <Text
                  style={[
                    styles.actionBtnText,
                    { color: isActive ? theme.primary : theme.onPrimary },
                  ]}
                >
                  {isActive ? 'Đang sử dụng' : 'Kích hoạt'}
                </Text>
              </AppButton>

              <AppButton
                accessibilityLabel="Xóa bản đồ đã tải"
                variant="ghost"
                onPress={() => handleDeleteWithPrompt(pack.id, pack.name)}
                style={styles.actionBtnDanger}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={16} color={theme.danger} />
                <Text style={[styles.actionBtnText, { color: theme.danger }]}>Xóa</Text>
              </AppButton>
            </>
          ) : isDownloading ? (
            <>
              <AppButton
                accessibilityLabel="Tạm dừng tải"
                variant="outline"
                onPress={() => pauseDownload(pack.id)}
                style={styles.actionBtnHalf}
              >
                <MaterialCommunityIcons name="pause" size={16} color={theme.text} />
                <Text style={[styles.actionBtnText, { color: theme.text }]}>Tạm dừng</Text>
              </AppButton>

              <AppButton
                accessibilityLabel="Hủy tải xuống"
                variant="ghost"
                onPress={() => cancelDownload(pack.id)}
                style={styles.actionBtnHalf}
              >
                <MaterialCommunityIcons name="close" size={16} color={theme.danger} />
                <Text style={[styles.actionBtnText, { color: theme.danger }]}>Hủy</Text>
              </AppButton>
            </>
          ) : isPaused ? (
            <>
              <AppButton
                accessibilityLabel="Tiếp tục tải"
                variant="solid"
                onPress={() => resumeDownload(pack.id)}
                style={styles.actionBtnHalf}
              >
                <MaterialCommunityIcons name="play" size={16} color={theme.onPrimary} />
                <Text style={[styles.actionBtnText, { color: theme.onPrimary }]}>Tiếp tục</Text>
              </AppButton>

              <AppButton
                accessibilityLabel="Hủy tải xuống"
                variant="ghost"
                onPress={() => cancelDownload(pack.id)}
                style={styles.actionBtnHalf}
              >
                <MaterialCommunityIcons name="close" size={16} color={theme.danger} />
                <Text style={[styles.actionBtnText, { color: theme.danger }]}>Hủy</Text>
              </AppButton>
            </>
          ) : (
            <AppButton
              accessibilityLabel={`Tải xuống gói bản đồ ${pack.name}`}
              variant="solid"
              onPress={() => startDownload(pack)}
              style={styles.actionBtnFull}
            >
              <MaterialCommunityIcons name="download" size={18} color={theme.onPrimary} />
              <Text style={[styles.actionBtnText, { color: theme.onPrimary }]}>
                Tải xuống ({formatBytes(pack.sizeBytes)})
              </Text>
            </AppButton>
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: theme.background,
              borderColor: theme.border,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.headerTitleRow}>
                <MaterialCommunityIcons name="map-marker-down" size={22} color={theme.primary} />
                <Text style={[styles.headerTitle, { color: theme.text }]}>
                  Bản đồ ngoại tuyến (PMTiles)
                </Text>
              </View>
              <Text style={[styles.headerSubtitle, { color: theme.placeholder }]}>
                Đã tải: {totalInstalledSizeFormatted}
              </Text>
            </View>

            <Pressable
              accessibilityLabel="Đóng cửa sổ bản đồ ngoại tuyến"
              accessibilityRole="button"
              hitSlop={8}
              onPress={onClose}
              style={styles.closeBtn}
            >
              <MaterialCommunityIcons name="close" size={22} color={theme.text} />
            </Pressable>
          </View>

          {/* Info Banner */}
          <View style={[styles.infoBanner, { backgroundColor: theme.backgroundElement }]}>
            <MaterialCommunityIcons name="information-outline" size={18} color={theme.primary} />
            <Text style={[styles.infoBannerText, { color: theme.text }]}>
              Tải bản đồ vector PMTiles để dẫn đường và tra cứu vị trí biển báo ngay cả khi thiết bị không có sóng 4G/5G hoặc ngoại tuyến.
            </Text>
          </View>

          {/* Content Body */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {isLoading && availablePacks.length === 0 ? (
              <View style={styles.centerLoading}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.placeholder }]}>
                  Đang tải danh sách bản đồ...
                </Text>
              </View>
            ) : error && availablePacks.length === 0 ? (
              <View style={styles.centerError}>
                <MaterialCommunityIcons name="alert-circle-outline" size={40} color={theme.danger} />
                <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
                <AppButton
                  accessibilityLabel="Thử lại"
                  variant="outline"
                  onPress={fetchPacks}
                  style={styles.retryBtn}
                >
                  <Text style={[styles.actionBtnText, { color: theme.primary }]}>Thử lại</Text>
                </AppButton>
              </View>
            ) : availablePacks.length === 0 ? (
              <View style={styles.centerEmpty}>
                <MaterialCommunityIcons name="map-outline" size={40} color={theme.placeholder} />
                <Text style={[styles.emptyText, { color: theme.placeholder }]}>
                  Hiện chưa có gói bản đồ ngoại tuyến nào khả dụng.
                </Text>
              </View>
            ) : (
              availablePacks.map(renderPackItem)
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: Rounded.xl,
    borderTopRightRadius: Rounded.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '85%',
    minHeight: '45%',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.margin,
    paddingVertical: Spacing.unit * 3,
    borderBottomWidth: 1,
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
  },
  headerTitle: {
    fontFamily: Fonts.heading,
    fontSize: 17,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: Spacing.half,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.half,
    marginHorizontal: Spacing.margin,
    marginTop: Spacing.unit * 2,
    padding: Spacing.unit * 2,
    borderRadius: Rounded.md,
  },
  infoBannerText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 18,
  },
  scrollContent: {
    padding: Spacing.margin,
    gap: Spacing.unit * 3,
  },
  packCard: {
    borderRadius: Rounded.lg,
    padding: Spacing.unit * 3,
  },
  packHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.unit * 2,
    marginBottom: Spacing.half,
  },
  packIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packTitleColumn: {
    flex: 1,
  },
  packTitle: {
    fontFamily: Fonts.heading,
    fontSize: 15,
    fontWeight: '700',
  },
  packRegionText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Rounded.full,
  },
  statusBadgeText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: '600',
  },
  packDescription: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 18,
    marginVertical: Spacing.half,
  },
  packMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.half,
    marginBottom: Spacing.unit * 2,
  },
  packSizeText: {
    fontFamily: Fonts.body,
    fontSize: 12,
  },
  packDateText: {
    fontFamily: Fonts.body,
    fontSize: 11,
  },
  progressContainer: {
    marginVertical: Spacing.half,
  },
  progressBarBackground: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progressBytesText: {
    fontFamily: Fonts.body,
    fontSize: 11,
  },
  progressPercentText: {
    fontFamily: Fonts.heading,
    fontSize: 11,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
    marginVertical: Spacing.half,
  },
  errorBannerText: {
    fontFamily: Fonts.body,
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.unit * 2,
    marginTop: Spacing.half,
  },
  actionBtnFull: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.half,
    paddingVertical: Spacing.unit * 2,
  },
  actionBtnPrimary: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.half,
    paddingVertical: Spacing.unit * 2,
  },
  actionBtnDanger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.half,
    paddingVertical: Spacing.unit * 2,
  },
  actionBtnHalf: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.half,
    paddingVertical: Spacing.unit * 2,
  },
  actionBtnText: {
    fontFamily: Fonts.heading,
    fontSize: 13,
    fontWeight: '600',
  },
  centerLoading: {
    paddingVertical: Spacing.unit * 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.unit * 2,
  },
  loadingText: {
    fontFamily: Fonts.body,
    fontSize: 13,
  },
  centerError: {
    paddingVertical: Spacing.unit * 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.unit * 2,
  },
  errorText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: Spacing.unit,
  },
  centerEmpty: {
    paddingVertical: Spacing.unit * 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.unit * 2,
  },
  emptyText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    textAlign: 'center',
  },
});
