import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/button';
import { Fonts, Rounded, Spacing } from '@/constants/theme';
import {
  useGetNotifications,
  useGetUnreadNotificationCount,
  useMarkAllNotificationsAsRead,
} from '@/feature/notifications/hooks/use-notifications';
import { useTheme } from '@/hooks/use-theme';
import type { NotificationItem, NotificationType } from '@/types/notificationType';

function formatNotificationTime(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getNotificationVisuals(type: NotificationType) {
  switch (type) {
    case 'SIGN_MISSING_DISPATCH':
      return {
        icon: 'alert-decagram' as const,
        iconColor: '#D97706',
        bg: '#FEF3C7',
        tag: 'Khảo sát biển báo',
      };
    case 'REVALIDATION_RECAPTURE_REQUESTED':
      return {
        icon: 'camera-retake' as const,
        iconColor: '#2563EB',
        bg: '#DBEAFE',
        tag: 'Yêu cầu chụp lại',
      };
    case 'REVALIDATION_CLOSED':
      return {
        icon: 'check-circle' as const,
        iconColor: '#059669',
        bg: '#D1FAE5',
        tag: 'Hoàn thành',
      };
    case 'HAZARD_VERIFIED':
      return {
        icon: 'alert-octagon' as const,
        iconColor: '#DC2626',
        bg: '#FEE2E2',
        tag: 'Cảnh báo nguy hiểm',
      };
    case 'REWARD_CREDITED':
      return {
        icon: 'gift' as const,
        iconColor: '#7C3AED',
        bg: '#EDE9FE',
        tag: 'Thưởng Credits',
      };
    default:
      return {
        icon: 'bell' as const,
        iconColor: '#007B8B',
        bg: '#E0F2FE',
        tag: 'Thông báo',
      };
  }
}

export function NotificationsScreen() {
  const router = useRouter();
  const theme = useTheme();

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      router.back();
      return true;
    });
    return () => sub.remove();
  }, [router]);

  const {
    data: notificationData,
    isLoading,
    isRefetching,
    refetch,
  } = useGetNotifications();

  const { data: unreadCount = 0 } = useGetUnreadNotificationCount();
  const { mutate: markAllRead, isPending: isMarkingAll } = useMarkAllNotificationsAsRead();

  const notifications = useMemo(() => {
    return notificationData?.items ?? [];
  }, [notificationData]);

  const handleRefresh = async () => {
    await refetch();
  };

  const handleMarkAllRead = () => {
    if (unreadCount > 0) {
      markAllRead();
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const visual = getNotificationVisuals(item.type);
    const timeFormatted = formatNotificationTime(item.createdAt);

    return (
      <Pressable
        accessibilityLabel={`Thông báo: ${item.title}`}
        accessibilityRole="button"
        onPress={() => {
          // Placeholder as explicitly specified by requirements: do nothing when pressed
        }}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: item.isRead ? theme.border : `${theme.primary}40`,
          },
          !item.isRead && styles.cardUnread,
          pressed && { opacity: 0.82 },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: visual.bg }]}>
            <MaterialCommunityIcons
              name={visual.icon}
              size={22}
              color={visual.iconColor}
            />
          </View>

          <View style={styles.headerInfo}>
            <View style={styles.titleRow}>
              <Text
                numberOfLines={2}
                style={[
                  styles.titleText,
                  { color: theme.text },
                  !item.isRead && styles.titleUnread,
                ]}
              >
                {item.title}
              </Text>
              {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />}
            </View>

            <View style={styles.tagTimeRow}>
              <View style={[styles.tagBadge, { backgroundColor: `${visual.iconColor}15` }]}>
                <Text style={[styles.tagText, { color: visual.iconColor }]}>
                  {visual.tag}
                </Text>
              </View>
              <Text style={[styles.timeText, { color: theme.placeholder }]}>
                {timeFormatted}
              </Text>
            </View>
          </View>
        </View>

        {Boolean(item.message) && (
          <Text
            numberOfLines={4}
            style={[styles.messageText, { color: theme.textSecondary }]}
          >
            {item.message}
          </Text>
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <AppButton
          accessibilityLabel="Quay lại"
          onPress={() => router.back()}
          style={styles.backButton}
          variant="ghost"
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </AppButton>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Thông báo</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </View>

        {unreadCount > 0 ? (
          <Pressable
            disabled={isMarkingAll}
            onPress={handleMarkAllRead}
            style={({ pressed }) => [
              styles.markAllButton,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={[styles.markAllText, { color: theme.primary }]}>
              Đọc tất cả
            </Text>
          </Pressable>
        ) : (
          <View style={styles.headerRightSpacer} />
        )}
      </View>

      {/* Main Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={theme.primary} size="large" />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Đang tải thông báo...
          </Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconCircle, { backgroundColor: theme.backgroundElement }]}>
            <Ionicons name="notifications-off-outline" size={44} color={theme.placeholder} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            Chưa có thông báo nào
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            Khi có biển báo bị mất cần kiểm tra hoặc các thông báo mới từ hệ thống, bạn sẽ nhận được tại đây.
          </Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={notifications}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              colors={[theme.primary]}
              onRefresh={handleRefresh}
              refreshing={isRefetching}
              tintColor={theme.primary}
            />
          }
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 0,
    minWidth: 0,
    paddingHorizontal: 0,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Fonts.sans,
    fontWeight: '700',
  },
  headerBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  markAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  headerRightSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  loadingText: {
    fontSize: 14,
  },
  listContent: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    borderRadius: Rounded.xlg,
    padding: Spacing.three,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    gap: Spacing.one,
  },
  cardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#007B8B',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.one,
  },
  titleText: {
    flex: 1,
    fontSize: 15,
    fontFamily: Fonts.sans,
    fontWeight: '600',
    lineHeight: 20,
  },
  titleUnread: {
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  tagTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  tagBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Rounded.round,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 12,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
    paddingLeft: 42 + Spacing.two,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: Fonts.sans,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
