import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { AppToast } from '@/components/toast';
import { fetchFreshGpsLocation } from '@/feature/navigation/utils/gps';
import {
  useAbandonBountyQuest,
  useAvailableBountyQuests,
  useClaimBountyQuest,
  useMyBountyClaims,
} from '@/feature/work/hooks/use-bounty-board';
import { BountyQuestCard } from '@/feature/work/components/bounty-quest-card';
import { ActiveQuestItemCard } from '@/feature/work/components/active-quest-item-card';
import { QuestClaimConfirmModal } from '@/feature/work/components/quest-claim-confirm-modal';
import type { BountyQuestItem, QuestTargetType, ReviewerQuestClaim } from '@/types/bountyBoardType';

type TabKey = 'available' | 'my-claims';
type FilterKey = 'ALL' | 'CANDIDATE_VALIDATION' | 'REVALIDATION_TASK';

export function BountyBoardScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabKey>('available');
  const [targetTypeFilter, setTargetTypeFilter] = useState<FilterKey>('ALL');
  const [selectedQuestToClaim, setSelectedQuestToClaim] = useState<BountyQuestItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [coords, setCoords] = useState<{ latitude?: number; longitude?: number }>({});
  const [isLocating, setIsLocating] = useState(false);

  // Fetch fresh location
  const refreshLocation = useCallback(async () => {
    setIsLocating(true);
    try {
      const loc = await fetchFreshGpsLocation(3500);
      if (loc) {
        setCoords({ latitude: loc.latitude, longitude: loc.longitude });
      }
    } catch {
      // ignore
    } finally {
      setIsLocating(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      setIsLocating(true);
      try {
        const loc = await fetchFreshGpsLocation(3500);
        if (active && loc) {
          setCoords({ latitude: loc.latitude, longitude: loc.longitude });
        }
      } catch {
        // ignore
      } finally {
        if (active) {
          setIsLocating(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Available quests query
  const availableParams = useMemo(() => {
    return {
      latitude: coords.latitude,
      longitude: coords.longitude,
      radiusKm: 15,
      targetType: targetTypeFilter === 'ALL' ? undefined : (targetTypeFilter as QuestTargetType),
    };
  }, [coords.latitude, coords.longitude, targetTypeFilter]);

  const {
    data: availableQuests,
    isLoading: isLoadingAvailable,
    isRefetching: isRefetchingAvailable,
    refetch: refetchAvailable,
  } = useAvailableBountyQuests(availableParams);

  // My claims query
  const {
    data: myClaims,
    isLoading: isLoadingClaims,
    isRefetching: isRefetchingClaims,
    refetch: refetchClaims,
  } = useMyBountyClaims();

  const activeClaims = useMemo(() => {
    if (!myClaims) return [];
    return myClaims.filter((c) => c.status === 'CLAIMED');
  }, [myClaims]);

  // Mutations
  const claimMutation = useClaimBountyQuest();
  const abandonMutation = useAbandonBountyQuest();

  const handleConfirmClaim = async () => {
    if (!selectedQuestToClaim) return;
    try {
      await claimMutation.mutateAsync({
        targetType: selectedQuestToClaim.targetType,
        targetId: selectedQuestToClaim.targetId,
      });
      setSelectedQuestToClaim(null);
      setToastMessage('Đã nhận nhiệm vụ thành công');
      setActiveTab('my-claims');
    } catch (err: any) {
      setToastMessage(err?.message || 'Không thể nhận nhiệm vụ lúc này');
    }
  };

  const handleAbandonClaim = async (claim: ReviewerQuestClaim) => {
    try {
      await abandonMutation.mutateAsync({
        claimId: claim.id,
        reason: 'Người thẩm định hủy nhiệm vụ',
      });
      setToastMessage('Đã hủy nhiệm vụ');
    } catch (err: any) {
      setToastMessage(err?.message || 'Không thể hủy nhiệm vụ');
    }
  };

  const handleRefresh = () => {
    refreshLocation();
    if (activeTab === 'available') {
      refetchAvailable();
    } else {
      refetchClaims();
    }
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable
          accessibilityLabel="Quay lại"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons color={theme.text} name="arrow-left" size={24} />
        </Pressable>

        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Nhiệm vụ thẩm định
        </Text>

        <Pressable
          accessibilityLabel="Làm mới vị trí"
          disabled={isLocating}
          onPress={handleRefresh}
          style={styles.locationRefreshButton}
        >
          <MaterialCommunityIcons
            color={isLocating ? theme.placeholder : theme.primary}
            name="crosshairs-gps"
            size={22}
          />
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { borderBottomColor: theme.border }]}>
        <Pressable
          onPress={() => setActiveTab('available')}
          style={[
            styles.tabItem,
            activeTab === 'available' && [styles.activeTabItem, { borderBottomColor: theme.primary }],
          ]}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'available' ? theme.primary : theme.placeholder },
            ]}
          >
            Có thể nhận
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('my-claims')}
          style={[
            styles.tabItem,
            activeTab === 'my-claims' && [styles.activeTabItem, { borderBottomColor: theme.primary }],
          ]}
        >
          <View style={styles.tabBadgeRow}>
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'my-claims' ? theme.primary : theme.placeholder },
              ]}
            >
              Đang thực hiện
            </Text>
            {activeClaims.length > 0 && (
              <View style={[styles.badgeCount, { backgroundColor: theme.primary }]}>
                <Text style={styles.badgeCountText}>{activeClaims.length}</Text>
              </View>
            )}
          </View>
        </Pressable>
      </View>

      {/* Sub-filter chips for available tab */}
      {activeTab === 'available' && (
        <View style={styles.filterRow}>
          <Pressable
            onPress={() => setTargetTypeFilter('ALL')}
            style={[
              styles.chip,
              {
                backgroundColor:
                  targetTypeFilter === 'ALL' ? theme.primary : theme.backgroundElement,
                borderColor: targetTypeFilter === 'ALL' ? theme.primary : theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                { color: targetTypeFilter === 'ALL' ? '#FFFFFF' : theme.text },
              ]}
            >
              Tất cả
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setTargetTypeFilter('CANDIDATE_VALIDATION')}
            style={[
              styles.chip,
              {
                backgroundColor:
                  targetTypeFilter === 'CANDIDATE_VALIDATION'
                    ? theme.primary
                    : theme.backgroundElement,
                borderColor:
                  targetTypeFilter === 'CANDIDATE_VALIDATION' ? theme.primary : theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                { color: targetTypeFilter === 'CANDIDATE_VALIDATION' ? '#FFFFFF' : theme.text },
              ]}
            >
              Biển báo mới
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setTargetTypeFilter('REVALIDATION_TASK')}
            style={[
              styles.chip,
              {
                backgroundColor:
                  targetTypeFilter === 'REVALIDATION_TASK'
                    ? theme.primary
                    : theme.backgroundElement,
                borderColor:
                  targetTypeFilter === 'REVALIDATION_TASK' ? theme.primary : theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                { color: targetTypeFilter === 'REVALIDATION_TASK' ? '#FFFFFF' : theme.text },
              ]}
            >
              Biển cần kiểm tra lại
            </Text>
          </Pressable>
        </View>
      )}

      {/* Content list */}
      {activeTab === 'available' ? (
        isLoadingAvailable && !availableQuests ? (
          <View style={styles.centered}>
            <ActivityIndicator color={theme.primary} size="large" />
            <Text style={[styles.loadingText, { color: theme.placeholder }]}>
              Đang tìm nhiệm vụ gần bạn...
            </Text>
          </View>
        ) : (
          <FlatList
            contentContainerStyle={styles.listContent}
            data={availableQuests ?? []}
            keyExtractor={(item) => `${item.targetType}-${item.targetId}`}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  color={theme.placeholder}
                  name="map-marker-question-outline"
                  size={48}
                />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>
                  Không có nhiệm vụ nào gần đây
                </Text>
                <Text style={[styles.emptySubtitle, { color: theme.placeholder }]}>
                  Hiện chưa có biển báo nào cần xác thực trong phạm vi 15 km. Vui lòng kéo xuống để tìm lại.
                </Text>
              </View>
            }
            refreshControl={
              <RefreshControl
                colors={[theme.primary]}
                onRefresh={handleRefresh}
                refreshing={isRefetchingAvailable}
                tintColor={theme.primary}
              />
            }
            renderItem={({ item }) => (
              <BountyQuestCard
                isClaiming={claimMutation.isPending && selectedQuestToClaim?.targetId === item.targetId}
                onClaim={(q) => setSelectedQuestToClaim(q)}
                quest={item}
              />
            )}
            showsVerticalScrollIndicator={false}
          />
        )
      ) : isLoadingClaims && !myClaims ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.primary} size="large" />
          <Text style={[styles.loadingText, { color: theme.placeholder }]}>
            Đang tải nhiệm vụ của bạn...
          </Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={activeClaims}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                color={theme.placeholder}
                name="clipboard-text-outline"
                size={48}
              />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                Chưa có nhiệm vụ đang làm
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.placeholder }]}>
                Hãy chuyển sang thẻ Có thể nhận để chọn biển báo bạn muốn đến xác thực.
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              colors={[theme.primary]}
              onRefresh={handleRefresh}
              refreshing={isRefetchingClaims}
              tintColor={theme.primary}
            />
          }
          renderItem={({ item }) => (
            <ActiveQuestItemCard
              claim={item}
              isAbandoning={abandonMutation.isPending}
              onAbandon={handleAbandonClaim}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Confirmation Modal */}
      <QuestClaimConfirmModal
        loading={claimMutation.isPending}
        onClose={() => setSelectedQuestToClaim(null)}
        onConfirm={handleConfirmClaim}
        quest={selectedQuestToClaim}
        visible={Boolean(selectedQuestToClaim)}
      />

      {toastMessage && (
        <AppToast
          message={toastMessage}
          onDismiss={() => setToastMessage(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontFamily: Fonts.sans,
    fontSize: 17,
    fontWeight: '700',
  },
  locationRefreshButton: {
    padding: 6,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabItem: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    fontWeight: '700',
  },
  tabBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeCount: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Rounded.round,
  },
  badgeCountText: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.one,
  },
  chip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    borderRadius: Rounded.round,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    padding: Spacing.three,
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  loadingText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  emptyTitle: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
