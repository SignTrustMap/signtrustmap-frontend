import { Image, Pressable, Text, View } from "react-native";
import AntDesign from "@expo/vector-icons/AntDesign";
import { Ionicons } from "@expo/vector-icons";
import { SymbolView } from "expo-symbols";
import { AppButton } from "@/components/button";
import { Badge } from "@/components/badge";
import { Rounded, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { MapCoordinate } from "@/types/navigationType";
import { styles } from "../styles/navigation-map-screen.styles";

const AppLogo = require("@/assets/images/app-logo.png") as number;

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
  onNotificationsPress: () => void;
  onLivestreamPress: () => void;
  onChangeStartPress: () => void;
  onChangeDestinationPress: () => void;
  onSwapRoutePress: () => void;
}

export function NavigationTopControls({
  selectedDestination,
  plannedRouteOrigin,
  routeStartTitle,
  walletBalance,
  unreadNotificationCount = 0,
  onSearchPress,
  onTopUpPress,
  onNotificationsPress,
  onLivestreamPress,
  onChangeStartPress,
  onChangeDestinationPress,
  onSwapRoutePress,
}: NavigationTopControlsProps) {
  const theme = useTheme();

  return (
    <View style={styles.topControls}>
      {selectedDestination && plannedRouteOrigin ? (
        <View
          style={[
            styles.selectedRouteRow,
            { backgroundColor: theme.backgroundElement },
          ]}
        >
          <View style={styles.selectedRouteFields}>
            <AppButton
              accessibilityLabel="Thay đổi điểm xuất phát"
              onPress={onChangeStartPress}
              style={styles.selectedRouteInput}
              variant="ghost"
            >
              <View
                style={[
                  styles.routeOriginCircle,
                  { borderColor: theme.textSecondary },
                ]}
              />
              <Text
                numberOfLines={1}
                style={[styles.selectedStartText, { color: theme.text }]}
              >
                {routeStartTitle}
              </Text>
            </AppButton>
            <View
              pointerEvents="none"
              style={[
                styles.routeFieldDivider,
                { backgroundColor: theme.border },
              ]}
            />
            <View pointerEvents="none" style={styles.selectedRouteConnector}>
              {[0, 1, 2].map((dot) => (
                <View
                  key={dot}
                  style={[
                    styles.selectedRouteDot,
                    { backgroundColor: theme.placeholder },
                  ]}
                />
              ))}
            </View>
            <AppButton
              accessibilityLabel="Thay đổi điểm đến"
              onPress={onChangeDestinationPress}
              style={[
                styles.selectedRouteInput,
                styles.destinationWithSwap,
              ]}
              variant="ghost"
            >
              <AntDesign name="environment" size={17} color={theme.danger} />
              <Text
                numberOfLines={1}
                style={[
                  styles.selectedDestinationText,
                  { color: theme.text },
                ]}
              >
                {selectedDestination.title}
              </Text>
            </AppButton>
          </View>
          <AppButton
            accessibilityLabel="Đổi chiều điểm đi và đến"
            onPress={onSwapRoutePress}
            style={styles.routeSwapButton}
            variant="ghost"
          >
            <AntDesign
              name="swap"
              size={20}
              color={theme.text}
              style={{ transform: [{ rotate: "90deg" }] }}
            />
          </AppButton>
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
              style={[
                styles.selectedDestinationText,
                { color: theme.text },
              ]}
            >
              {selectedDestination.title}
            </Text>
          </AppButton>
        </View>
      ) : (
        <>
          <View style={styles.searchBarHeaderRow}>
            <View
              style={[
                styles.searchBar,
                { backgroundColor: theme.backgroundElement },
              ]}
            >
              <AppButton
                accessibilityLabel="Tìm kiếm điểm đến"
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
                <Text
                  numberOfLines={1}
                  style={[styles.searchText, { color: theme.placeholder }]}
                >
                  Bắt đầu tìm kiếm...
                </Text>
              </AppButton>
              <AppButton
                accessibilityLabel={`Nạp điểm. Số điểm hiện tại: ${
                  walletBalance ?? 0
                }`}
                onPress={onTopUpPress}
                pressedOpacity={0.68}
                style={[
                  styles.creditContainer,
                  { backgroundColor: theme.backgroundSelected },
                ]}
                variant="ghost"
              >
                <Text style={[styles.creditText, { color: theme.text }]}>
                  {walletBalance ?? "—"}
                </Text>
                <View
                  style={[
                    styles.addCreditIcon,
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.addCreditGlyph,
                      { color: theme.onPrimary },
                    ]}
                  >
                    +
                  </Text>
                </View>
              </AppButton>
            </View>

            <Pressable
              accessibilityLabel={`Thông báo${
                unreadNotificationCount > 0
                  ? `, ${unreadNotificationCount} chưa đọc`
                  : ""
              }`}
              accessibilityRole="button"
              onPress={onNotificationsPress}
              style={({ pressed }) => [
                styles.notificationCircleButton,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Ionicons name="notifications" size={24} color="#000000" />
              <Badge
                count={unreadNotificationCount}
                maxCount={9}
                style={styles.notificationBadge}
              />
            </Pressable>
          </View>
          <AppButton
            accessibilityLabel="Phát trực tiếp"
            variant="ghost"
            onPress={onLivestreamPress}
            style={[
              {
                backgroundColor: theme.background,
                boxShadow: "0px 4px 12px 1px #ccc",
                marginLeft: "auto",
                alignItems: "center",
                justifyContent: "center",
                marginTop: Spacing.half,
              },
            ]}
          >
            <SymbolView
              name={{
                android: "live_tv",
                ios: "dot.radiowaves.left.and.right",
              }}
              size={24}
              tintColor="#ff0000"
            />
          </AppButton>
        </>
      )}
    </View>
  );
}
