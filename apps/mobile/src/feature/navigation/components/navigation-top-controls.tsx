import { useRef } from 'react';
import { Animated, Image, Pressable, Text, View } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppButton } from '@/components/button';
import { Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { MapCoordinate } from '@/types/navigationType';
import { styles } from '../styles/navigation-map-screen.styles';
import { router } from 'expo-router';
import { useGetUnreadNotificationCount } from '@/feature/notifications/hooks/use-notifications';
import { Badge } from '@/components/badge';

const AppLogo = require('@/assets/images/app-logo.png') as number;

export interface NavigationTopControlsProps {
  selectedDestination?: {
    id: string;
    coordinate: MapCoordinate;
    title: string;
    subtitle?: string;
  };
  plannedRouteOrigin?: MapCoordinate;
  routeStartTitle?: string;
  walletBalance?: number | string;
  unreadNotificationCount?: number;
  onSearchPress: () => void;
  onTopUpPress: () => void;
  onNotificationsPress?: () => void;
  onChangeStartPress?: () => void;
  onChangeDestinationPress: () => void;
  onSwapRoutePress?: () => void;
}

export function NavigationTopControls({
  selectedDestination,
  plannedRouteOrigin,
  routeStartTitle,
  walletBalance,
  onSearchPress,
  onTopUpPress,
  onChangeDestinationPress,
  onSwapRoutePress,
}: NavigationTopControlsProps) {
  const theme = useTheme();
  const swapRotation = useRef(new Animated.Value(0)).current;
  const isRotatedRef = useRef(false);

  const handleSwapPress = () => {
    isRotatedRef.current = !isRotatedRef.current;
    Animated.spring(swapRotation, {
      toValue: isRotatedRef.current ? 1 : 0,
      damping: 14,
      stiffness: 160,
      useNativeDriver: true,
    }).start();
    onSwapRoutePress?.();
  };

  const rotateInterpolation = swapRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const { data: unreadNotificationCount = 0 } = useGetUnreadNotificationCount();

  return (
    <View style={styles.topControls}>
      {selectedDestination && plannedRouteOrigin ? (
        <View style={[styles.selectedRouteRow, { backgroundColor: theme.backgroundElement }]}>
          <View style={styles.selectedRouteFields}>
            <View
              accessibilityLabel="Điểm xuất phát từ vị trí hiện tại"
              style={styles.selectedRouteInput}
            >
              <View style={styles.routeIconWrapper}>
                <View style={[styles.routeOriginCircle, { borderColor: theme.primary }]} />
              </View>
              <Text numberOfLines={1} style={[styles.selectedStartText, { color: theme.text }]}>
                {routeStartTitle || 'Vị trí của bạn'}
              </Text>
            </View>
            <View
              pointerEvents="none"
              style={[styles.routeFieldDivider, { backgroundColor: theme.border }]}
            />
            <View pointerEvents="none" style={styles.selectedRouteConnector}>
              {[0, 1, 2].map((dot) => (
                <View
                  key={dot}
                  style={[styles.selectedRouteDot, { backgroundColor: theme.placeholder }]}
                />
              ))}
            </View>
            <AppButton
              accessibilityLabel="Thay đổi điểm đến"
              onPress={onChangeDestinationPress}
              style={[styles.selectedRouteInput, { paddingRight: Spacing.two }]}
              variant="ghost"
            >
              <View style={styles.routeIconWrapper}>
                <AntDesign name="environment" size={18} color={theme.danger} />
              </View>
              <Text
                numberOfLines={1}
                style={[styles.selectedDestinationText, { color: theme.text }]}
              >
                {selectedDestination.title}
              </Text>
            </AppButton>
          </View>

          {onSwapRoutePress ? (
            <Pressable
              accessibilityLabel="Đổi chiều điểm đi và đến"
              accessibilityRole="button"
              testID="btn-swap-route"
              onPress={handleSwapPress}
              style={({ pressed }) => [
                styles.routeSwapButton,
                {
                  opacity: pressed ? 0.7 : 1,
                  backgroundColor: pressed ? theme.backgroundSelected : 'transparent',
                },
              ]}
            >
              <Animated.View style={{ transform: [{ rotate: rotateInterpolation }] }}>
                <Ionicons name="swap-vertical" size={22} color={theme.primary} />
              </Animated.View>
            </Pressable>
          ) : null}
        </View>
      ) : selectedDestination ? (
        <View
          style={[
            styles.selectedRouteRow,
            { borderRadius: Rounded.round },
            { backgroundColor: theme.backgroundElement },
          ]}
        >
          <AppButton
            accessibilityLabel="Thay đổi điểm đến"
            onPress={onChangeDestinationPress}
            style={[
              styles.selectedRouteInput,
              styles.selectedRouteFields,
              { borderRadius: Rounded.round },
            ]}
            variant="ghost"
          >
            <Text
              ellipsizeMode="tail"
              numberOfLines={1}
              style={[styles.selectedDestinationText, { color: theme.text }]}
            >
              {selectedDestination.title}
            </Text>
          </AppButton>
        </View>
      ) : (
        <>
          <View>
            <View style={{ display: 'flex', flex: 1, gap: Spacing.one }}>
              <View style={[styles.searchBar, { backgroundColor: theme.backgroundElement }]}>
                <AppButton
                  accessibilityLabel="Tìm kiếm điểm đến"
                  testID="btn-search-destination"
                  onPress={onSearchPress}
                  style={styles.searchButton}
                  variant="ghost"
                >
                  <Image
                    accessibilityLabel="Logo ứng dụng"
                    resizeMode="contain"
                    source={AppLogo}
                    style={styles.appLogo}
                  />
                  <Text numberOfLines={1} style={[styles.searchText, { color: theme.placeholder }]}>
                    Bắt đầu tìm kiếm...
                  </Text>
                </AppButton>
                <AppButton
                  accessibilityLabel={`Nạp điểm. Số điểm hiện tại: ${walletBalance ?? 0}`}
                  onPress={onTopUpPress}
                  pressedOpacity={0.68}
                  style={[styles.creditContainer, { backgroundColor: theme.backgroundSelected }]}
                  variant="ghost"
                >
                  <Text style={[styles.creditText, { color: theme.text }]}>
                    {walletBalance ?? '—'}
                  </Text>
                  <View style={[styles.addCreditIcon, { backgroundColor: theme.primary }]}>
                    <Text style={[styles.addCreditGlyph, { color: theme.onPrimary }]}>+</Text>
                  </View>
                </AppButton>
              </View>
              <AppButton
                accessibilityLabel={`Thông báo${unreadNotificationCount > 0 ? `, ${unreadNotificationCount} chưa đọc` : ''}`}
                onPress={() => router.push('/notifications')}
                style={[
                  styles.mapActionButton,
                  styles.locationActionButton,
                  styles.ttsActionButton,
                  { alignSelf: 'flex-end' },
                ]}
                variant="surface"
              >
                <Ionicons name="notifications" size={22} color="#000000" />
                <Badge
                  count={unreadNotificationCount}
                  maxCount={9}
                  style={styles.notificationBadge}
                />
              </AppButton>
            </View>
          </View>
        </>
      )}
    </View>
  );
}
