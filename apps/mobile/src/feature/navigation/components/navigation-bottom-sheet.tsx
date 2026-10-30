import {
  Animated,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AntDesign from "@expo/vector-icons/AntDesign";
import { AppButton } from "@/components/button";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { SIGN_CATEGORIES, type SignCategory, getSignCategory } from "@/constants/sign-categories";
import type { MapCoordinate, VehicleMode } from "@/types/navigationType";
import type { RouteSign } from "@/api/navigation/navigation";
import type { SignFilterPreset } from "@/context/sign-filter-provider";
import {
  formatRouteArrivalTime,
  formatRouteDistanceInKilometers,
  formatRouteDuration,
  formatRouteEstimatedTime,
  formatRouteNavDistance,
} from "../utils/navigation-formatters";
import { styles } from "../styles/navigation-map-screen.styles";

export interface NavigationBottomSheetProps {
  sheetHeightAnim: Animated.Value;
  sheetSnapIndex: 0 | 1 | 2;
  bottomInset: number;
  panHandlers: object;
  onCycleSnap: () => void;
  onSnapTo: (index: 0 | 1 | 2) => void;
  plannedRouteOrigin?: MapCoordinate;
  selectedDestination?: {
    id: string;
    coordinate: MapCoordinate;
    title: string;
    subtitle?: string;
  };
  isNavigating: boolean;
  vehicleMode: VehicleMode["id"];
  isMotorcycleMode: boolean;
  onSwitchVehicleMode: (mode: VehicleMode["id"]) => void;
  carDuration?: number;
  isCarRouteLoading?: boolean;
  motorcycleDuration?: number;
  isMotorcycleRouteLoading?: boolean;
  cyclingDuration?: number;
  isCyclingRouteLoading?: boolean;
  walkingDuration?: number;
  isWalkingRouteLoading?: boolean;
  routeDuration?: number;
  routeDistance?: number;
  activeDuration: number;
  remainingNavDuration?: number;
  remainingNavDistance?: number;
  navigationError?: string;
  expandableContentOpacity: Animated.AnimatedInterpolation<string | number>;
  filteredSignsCount: number;
  visibleSignsCount: number;
  routeMatchingPresets: SignFilterPreset[];
  filterViewMode: "lists" | "categories";
  onToggleFilterViewMode: () => void;
  manualCategories: Set<SignCategory>;
  onToggleManualCategory: (cat: SignCategory) => void;
  onSelectAllManualCategories: (selectAll: boolean) => void;
  activePresetId: string | null;
  onSelectPreset: (id: string | null) => void;
  visibleSigns: RouteSign[];
  isStartingNavigation: boolean;
  isRouteBookmarked: boolean;
  onBeginNavigation: () => void;
  onOpenBookmarkModal: () => void;
  onCloseRoute: () => void;
  onGo: () => void;
}

export function NavigationBottomSheet({
  sheetHeightAnim,
  sheetSnapIndex,
  bottomInset,
  panHandlers,
  onCycleSnap,
  onSnapTo,
  plannedRouteOrigin,
  selectedDestination,
  isNavigating,
  vehicleMode,
  isMotorcycleMode,
  onSwitchVehicleMode,
  carDuration,
  isCarRouteLoading,
  motorcycleDuration,
  isMotorcycleRouteLoading,
  cyclingDuration,
  isCyclingRouteLoading,
  walkingDuration,
  isWalkingRouteLoading,
  routeDuration,
  routeDistance,
  activeDuration,
  remainingNavDuration,
  remainingNavDistance,
  navigationError,
  expandableContentOpacity,
  filteredSignsCount,
  visibleSignsCount,
  routeMatchingPresets,
  filterViewMode,
  onToggleFilterViewMode,
  manualCategories,
  onToggleManualCategory,
  onSelectAllManualCategories,
  activePresetId,
  onSelectPreset,
  visibleSigns,
  isStartingNavigation,
  isRouteBookmarked,
  onBeginNavigation,
  onOpenBookmarkModal,
  onCloseRoute,
  onGo,
}: NavigationBottomSheetProps) {
  const theme = useTheme();

  if (!selectedDestination) return null;

  return (
    <Animated.View
      style={[
        styles.destinationSheet,
        styles.routeDestinationSheet,
        { height: sheetHeightAnim, paddingBottom: bottomInset },
        { backgroundColor: theme.backgroundElement },
      ]}
    >
      <View
        accessible
        accessibilityRole="button"
        accessibilityLabel={
          sheetSnapIndex === 0
            ? "Mở rộng xem lộ trình"
            : sheetSnapIndex === 1
              ? "Mở rộng danh sách bộ lọc biển báo"
              : "Thu gọn chi tiết lộ trình"
        }
        accessibilityHint="Kéo lên hoặc xuống để thay đổi chiều cao. Chạm để chuyển đổi."
        accessibilityState={{ expanded: sheetSnapIndex > 0 }}
        accessibilityActions={[{ name: "activate" }]}
        onAccessibilityAction={onCycleSnap}
        style={styles.destinationSheetHandleArea}
        {...panHandlers}
      >
        <View style={styles.destinationSheetHandle} />
      </View>

      {plannedRouteOrigin ? (
        <View style={styles.routeSheetContainer}>
          {/* Header row */}
          {isNavigating ? (
            <View style={styles.routeHeaderRowNavigating}>
              <Pressable
                accessibilityLabel="Thu nhỏ bảng điều hướng"
                accessibilityRole="button"
                onPress={() => onSnapTo(0)}
                style={({ pressed }) => [
                  styles.navActionButton,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.border,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <AntDesign name="close" size={20} color={theme.text} />
              </Pressable>

              <View style={styles.navTimeInfoContainer}>
                <View style={styles.navEstimatedTimeRow}>
                  <MaterialCommunityIcons
                    name={
                      vehicleMode === "CYCLING"
                        ? "bicycle"
                        : vehicleMode === "WALKING"
                          ? "walk"
                          : isMotorcycleMode
                            ? "motorbike"
                            : "car"
                    }
                    size={18}
                    color={theme.primary}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[styles.navEstimatedTimeText, { color: "#E65100" }]}
                  >
                    {formatRouteEstimatedTime(
                      remainingNavDuration ?? activeDuration,
                    )}
                  </Text>
                  <MaterialCommunityIcons
                    name="leaf"
                    size={19}
                    color="#16A34A"
                    style={styles.navLeafIcon}
                  />
                </View>

                <View style={styles.navSubInfoRow}>
                  <Text
                    style={[
                      styles.navSubInfoText,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {(remainingNavDistance ?? routeDistance) !== undefined
                      ? formatRouteNavDistance(
                          remainingNavDistance ?? routeDistance!,
                        )
                      : "-- km"}
                  </Text>
                  <Text
                    style={[styles.navSubInfoDot, { color: theme.textSecondary }]}
                  >
                    •
                  </Text>
                  <Text
                    style={[
                      styles.navSubInfoText,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {formatRouteArrivalTime(
                      remainingNavDuration ?? activeDuration,
                    )}
                  </Text>
                </View>
              </View>

              <Pressable
                accessibilityLabel="Tùy chọn lộ trình"
                accessibilityRole="button"
                onPress={onCycleSnap}
                style={({ pressed }) => [
                  styles.navActionButton,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.border,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="routes"
                  size={22}
                  color={theme.text}
                />
              </Pressable>
            </View>
          ) : (
            <View style={styles.routeHeaderRow}>
              <Pressable
                accessibilityHint="Chạm để chuyển đổi chế độ xem dưới"
                accessibilityLabel="Phương tiện, thời gian và khoảng cách"
                accessibilityRole="button"
                onPress={onCycleSnap}
                style={styles.routeHeaderInfo}
              >
                <Text
                  numberOfLines={1}
                  style={[styles.routeHeaderTitle, { color: theme.text }]}
                >
                  {vehicleMode === "CYCLING"
                    ? "Xe đạp"
                    : vehicleMode === "WALKING"
                      ? "Đi bộ"
                      : isMotorcycleMode
                        ? "Xe máy"
                        : "Ô tô"}
                </Text>
                {routeDuration !== undefined && routeDistance !== undefined ? (
                  <>
                    <View style={styles.headerTimeDistanceGroup}>
                      <Text style={[styles.headerDurationText]}>
                        {formatRouteDuration(activeDuration)}
                      </Text>
                    </View>
                    <View style={styles.headerTimeDistanceGroup}>
                      <Text
                        style={[
                          styles.headerDistanceText,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {`(${formatRouteDistanceInKilometers(routeDistance)})`}
                      </Text>
                    </View>
                  </>
                ) : null}
              </Pressable>
              <AppButton
                accessibilityLabel={
                  isRouteBookmarked
                    ? "Chỉnh sửa lộ trình đã lưu"
                    : "Lưu lộ trình yêu thích"
                }
                onPress={onOpenBookmarkModal}
                style={[
                  styles.sheetCloseButton,
                  {
                    backgroundColor: theme.backgroundSelected,
                    marginRight: Spacing.half,
                  },
                ]}
                variant="ghost"
              >
                <MaterialCommunityIcons
                  name={isRouteBookmarked ? "bookmark" : "bookmark-outline"}
                  size={20}
                  color={isRouteBookmarked ? theme.primary : theme.text}
                />
              </AppButton>
              <AppButton
                accessibilityLabel="Thu nhỏ xem trước lộ trình"
                onPress={() => onSnapTo(0)}
                style={[
                  styles.sheetCloseButton,
                  { backgroundColor: theme.backgroundSelected },
                ]}
                variant="ghost"
              >
                <AntDesign name="close" size={18} color={theme.text} />
              </AppButton>
            </View>
          )}

          {/* Vehicle picker */}
          {!isNavigating ? (
            <View
              style={[
                styles.vehicleTabsContainer,
                { borderBottomColor: theme.border },
              ]}
            >
              <ScrollView
                contentContainerStyle={styles.vehicleTabsScroll}
                horizontal
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                showsHorizontalScrollIndicator={false}
                style={styles.vehicleTabsScrollView}
              >
                {/* Car */}
                <AppButton
                  accessibilityLabel="Tuyến đường ô tô"
                  testID="vehicle-tab-car"
                  onPress={() => onSwitchVehicleMode("DRIVING")}
                  style={[
                    styles.vehicleTabButton,
                    vehicleMode === "DRIVING" && styles.vehicleTabButtonActive,
                  ]}
                  variant="ghost"
                >
                  <MaterialCommunityIcons
                    name="car"
                    size={22}
                    color={
                      vehicleMode === "DRIVING"
                        ? theme.primary
                        : theme.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.vehicleTabDurationText,
                      {
                        color:
                          vehicleMode === "DRIVING"
                            ? theme.primary
                            : theme.textSecondary,
                      },
                    ]}
                  >
                    {carDuration !== undefined
                      ? formatRouteDuration(carDuration)
                      : isCarRouteLoading
                        ? "..."
                        : "--"}
                  </Text>
                  {vehicleMode === "DRIVING" ? (
                    <View
                      style={[
                        styles.vehicleTabActiveLine,
                        { backgroundColor: theme.primary },
                      ]}
                    />
                  ) : null}
                </AppButton>

                {/* Motorcycle */}
                <AppButton
                  accessibilityLabel="Tuyến đường xe máy"
                  testID="vehicle-tab-bike"
                  onPress={() => onSwitchVehicleMode("MOTORCYCLE")}
                  style={[
                    styles.vehicleTabButton,
                    isMotorcycleMode && styles.vehicleTabButtonActive,
                  ]}
                  variant="ghost"
                >
                  <MaterialCommunityIcons
                    name="motorbike"
                    size={22}
                    color={
                      isMotorcycleMode
                        ? theme.primary
                        : theme.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.vehicleTabDurationText,
                      {
                        color: isMotorcycleMode
                          ? theme.primary
                          : theme.textSecondary,
                      },
                    ]}
                  >
                    {motorcycleDuration !== undefined
                      ? formatRouteDuration(motorcycleDuration)
                      : isMotorcycleRouteLoading
                        ? "..."
                        : "--"}
                  </Text>
                  {isMotorcycleMode ? (
                    <View
                      style={[
                        styles.vehicleTabActiveLine,
                        { backgroundColor: theme.primary },
                      ]}
                    />
                  ) : null}
                </AppButton>

                {/* Bicycle */}
                <AppButton
                  accessibilityLabel="Tuyến đường xe đạp"
                  testID="vehicle-tab-cycling"
                  onPress={() => onSwitchVehicleMode("CYCLING")}
                  style={[
                    styles.vehicleTabButton,
                    vehicleMode === "CYCLING" && styles.vehicleTabButtonActive,
                  ]}
                  variant="ghost"
                >
                  <MaterialCommunityIcons
                    name="bicycle"
                    size={22}
                    color={
                      vehicleMode === "CYCLING"
                        ? theme.primary
                        : theme.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.vehicleTabDurationText,
                      {
                        color:
                          vehicleMode === "CYCLING"
                            ? theme.primary
                            : theme.textSecondary,
                      },
                    ]}
                  >
                    {cyclingDuration !== undefined
                      ? formatRouteDuration(cyclingDuration)
                      : isCyclingRouteLoading
                        ? "..."
                        : "--"}
                  </Text>
                  {vehicleMode === "CYCLING" ? (
                    <View
                      style={[
                        styles.vehicleTabActiveLine,
                        { backgroundColor: theme.primary },
                      ]}
                    />
                  ) : null}
                </AppButton>

                {/* Walking */}
                <AppButton
                  accessibilityLabel="Tuyến đường đi bộ"
                  testID="vehicle-tab-walking"
                  onPress={() => onSwitchVehicleMode("WALKING")}
                  style={[
                    styles.vehicleTabButton,
                    vehicleMode === "WALKING" && styles.vehicleTabButtonActive,
                  ]}
                  variant="ghost"
                >
                  <MaterialCommunityIcons
                    name="walk"
                    size={22}
                    color={
                      vehicleMode === "WALKING"
                        ? theme.primary
                        : theme.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.vehicleTabDurationText,
                      {
                        color:
                          vehicleMode === "WALKING"
                            ? theme.primary
                            : theme.textSecondary,
                      },
                    ]}
                  >
                    {walkingDuration !== undefined
                      ? formatRouteDuration(walkingDuration)
                      : isWalkingRouteLoading
                        ? "..."
                        : "--"}
                  </Text>
                  {vehicleMode === "WALKING" ? (
                    <View
                      style={[
                        styles.vehicleTabActiveLine,
                        { backgroundColor: theme.primary },
                      ]}
                    />
                  ) : null}
                </AppButton>
              </ScrollView>
            </View>
          ) : null}

          {navigationError ? (
            <Text accessibilityRole="alert" style={styles.navigationError}>
              {navigationError}
            </Text>
          ) : null}

          {/* Lower expandable content */}
          <Animated.View
            pointerEvents={sheetSnapIndex === 0 ? "none" : "auto"}
            style={[
              styles.routeSheetExpandableContent,
              { opacity: expandableContentOpacity },
            ]}
          >
            <View style={styles.signFilterHeader}>
              <View style={styles.signFilterTitleGroup}>
                <View style={styles.signFilterTotalBadge}>
                  <Text
                    style={[
                      styles.signFilterTotalText,
                      { color: theme.text },
                    ]}
                  >
                    {filteredSignsCount === 0 && visibleSignsCount === 0
                      ? "Không có biển báo thỏa điều kiện"
                      : `${filteredSignsCount}/${visibleSignsCount} biển báo đang hiển thị`}
                  </Text>
                </View>
              </View>
              {!isNavigating && routeMatchingPresets.length > 0 ? (
                <AppButton
                  accessibilityLabel={
                    filterViewMode === "lists"
                      ? "Chuyển sang lọc theo danh mục"
                      : "Chuyển sang danh sách lọc"
                  }
                  onPress={onToggleFilterViewMode}
                  style={styles.toggleAllButton}
                  variant="ghost"
                >
                  <Text
                    style={[
                      styles.toggleAllText,
                      { color: theme.primary },
                    ]}
                  >
                    {filterViewMode === "lists" ? "Danh mục" : "Danh sách"}
                  </Text>
                </AppButton>
              ) : (
                <AppButton
                  accessibilityLabel={
                    manualCategories.size === SIGN_CATEGORIES.length
                      ? "Bỏ chọn tất cả danh mục"
                      : "Chọn tất cả danh mục"
                  }
                  onPress={() =>
                    onSelectAllManualCategories(
                      manualCategories.size !== SIGN_CATEGORIES.length,
                    )
                  }
                  style={styles.toggleAllButton}
                  variant="ghost"
                >
                  <Text
                    style={[
                      styles.toggleAllText,
                      { color: theme.primary },
                    ]}
                  >
                    {manualCategories.size === SIGN_CATEGORIES.length
                      ? "Bỏ chọn tất cả"
                      : "Chọn tất cả"}
                  </Text>
                </AppButton>
              )}
            </View>

            <ScrollView
              contentContainerStyle={styles.signFilterListContainer}
              nestedScrollEnabled
              showsVerticalScrollIndicator
              style={styles.signFilterScrollView}
            >
              {!isNavigating &&
              filterViewMode === "lists" &&
              routeMatchingPresets.length > 0 ? (
                <>
                  <Pressable
                    accessibilityLabel={`Tất cả biển báo, không lọc, ${
                      activePresetId === null ? "đã chọn" : "chưa chọn"
                    }`}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: activePresetId === null }}
                    onPress={() => onSelectPreset(null)}
                    style={({ pressed }) => [
                      styles.signFilterCard,
                      {
                        backgroundColor:
                          activePresetId === null
                            ? theme.backgroundSelected
                            : theme.backgroundElement,
                        borderColor:
                          activePresetId === null
                            ? theme.primary
                            : theme.border,
                        opacity: pressed ? 0.75 : 1,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.signCatIconBadge,
                        { backgroundColor: theme.backgroundSelected },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="filter-outline"
                        size={20}
                        color={theme.primary}
                      />
                    </View>
                    <View style={styles.signCatInfo}>
                      <View style={styles.signCatTitleRow}>
                        <Text
                          numberOfLines={1}
                          ellipsizeMode="tail"
                          style={[
                            styles.signCatLabel,
                            { color: theme.text },
                          ]}
                        >
                          Tất cả biển báo (Không lọc)
                        </Text>
                        <View
                          style={[
                            styles.signCountBadge,
                            { backgroundColor: theme.primary },
                          ]}
                        >
                          <Text
                            style={[
                              styles.signCountText,
                              { color: "#FFFFFF" },
                            ]}
                          >
                            {visibleSignsCount}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.signCatCheckbox,
                        activePresetId === null
                          ? {
                              backgroundColor: theme.primary,
                              borderColor: theme.primary,
                            }
                          : {
                              backgroundColor: "transparent",
                              borderColor: theme.border,
                            },
                      ]}
                    >
                      {activePresetId === null ? (
                        <AntDesign name="check" size={14} color="#FFFFFF" />
                      ) : null}
                    </View>
                  </Pressable>

                  {routeMatchingPresets.map((preset) => {
                    const isSelected = activePresetId === preset.id;
                    const matchingCount = visibleSigns.filter((s) =>
                      preset.categories.includes(getSignCategory(s)),
                    ).length;
                    return (
                      <Pressable
                        key={preset.id}
                        accessibilityLabel={`Danh sách ${preset.name}, ${
                          isSelected ? "đã chọn" : "chưa chọn"
                        }`}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: isSelected }}
                        onPress={() => onSelectPreset(preset.id)}
                        style={({ pressed }) => [
                          styles.signFilterCard,
                          {
                            backgroundColor: isSelected
                              ? theme.backgroundSelected
                              : theme.backgroundElement,
                            borderColor: isSelected
                              ? theme.primary
                              : theme.border,
                            opacity: pressed ? 0.75 : 1,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.signCatIconBadge,
                            { backgroundColor: theme.backgroundSelected },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name="playlist-check"
                            size={22}
                            color={theme.primary}
                          />
                        </View>
                        <View style={styles.signCatInfo}>
                          <View style={styles.signCatTitleRow}>
                            <Text
                              numberOfLines={1}
                              ellipsizeMode="tail"
                              style={[
                                styles.signCatLabel,
                                { color: theme.text },
                              ]}
                            >
                              {preset.savedRoute?.originName &&
                              preset.savedRoute?.destinationName
                                ? `${preset.savedRoute.originName} ➔ ${preset.savedRoute.destinationName}`
                                : preset.name}
                            </Text>
                            <View
                              style={[
                                styles.signCountBadge,
                                {
                                  backgroundColor: isSelected
                                    ? theme.primary
                                    : theme.border,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.signCountText,
                                  {
                                    color: isSelected
                                      ? "#FFFFFF"
                                      : theme.textSecondary,
                                  },
                                ]}
                              >
                                {matchingCount}
                              </Text>
                            </View>
                          </View>
                          <Text
                            numberOfLines={1}
                            style={[
                              styles.signCatSublabel,
                              { color: theme.textSecondary },
                            ]}
                          >
                            {preset.categories.length} danh mục
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.signCatCheckbox,
                            isSelected
                              ? {
                                  backgroundColor: theme.primary,
                                  borderColor: theme.primary,
                                }
                              : {
                                  backgroundColor: "transparent",
                                  borderColor: theme.border,
                                },
                          ]}
                        >
                          {isSelected ? (
                            <AntDesign name="check" size={14} color="#FFFFFF" />
                          ) : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </>
              ) : (
                /* Categories view */
                <>
                  {SIGN_CATEGORIES.map((cat) => {
                    const isSelected = manualCategories.has(cat.id);
                    const matchingCount = visibleSigns.filter(
                      (s) => getSignCategory(s) === cat.id,
                    ).length;
                    return (
                      <Pressable
                        key={cat.id}
                        accessibilityLabel={`Biển ${cat.label}, ${
                          isSelected ? "đã chọn" : "chưa chọn"
                        }`}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isSelected }}
                        onPress={() => onToggleManualCategory(cat.id)}
                        style={({ pressed }) => [
                          styles.signFilterCard,
                          {
                            backgroundColor: isSelected
                              ? theme.backgroundSelected
                              : theme.backgroundElement,
                            borderColor: isSelected ? cat.color : theme.border,
                            opacity: pressed ? 0.75 : 1,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.signCatIconBadge,
                            { backgroundColor: cat.bgColor },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={cat.icon}
                            size={22}
                            color={cat.color}
                          />
                        </View>
                        <View style={styles.signCatInfo}>
                          <View style={styles.signCatTitleRow}>
                            <Text
                              numberOfLines={1}
                              ellipsizeMode="tail"
                              style={[
                                styles.signCatLabel,
                                { color: theme.text },
                              ]}
                            >
                              {cat.label}
                            </Text>
                            <View
                              style={[
                                styles.signCountBadge,
                                {
                                  backgroundColor: isSelected
                                    ? cat.color
                                    : theme.border,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.signCountText,
                                  {
                                    color: isSelected
                                      ? "#FFFFFF"
                                      : theme.textSecondary,
                                  },
                                ]}
                              >
                                {matchingCount}
                              </Text>
                            </View>
                          </View>
                          <Text
                            numberOfLines={1}
                            style={[
                              styles.signCatSublabel,
                              { color: theme.textSecondary },
                            ]}
                          >
                            {cat.sublabel}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.signCatCheckbox,
                            isSelected
                              ? {
                                  backgroundColor: cat.color,
                                  borderColor: cat.color,
                                }
                              : {
                                  backgroundColor: "transparent",
                                  borderColor: theme.border,
                                },
                          ]}
                        >
                          {isSelected ? (
                            <AntDesign name="check" size={14} color="#FFFFFF" />
                          ) : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </>
              )}
            </ScrollView>
          </Animated.View>

          {/* Bottom Button Row */}
          {!isNavigating ? (
            <View
              style={[
                styles.sheetBottomButtonRow,
                { borderTopColor: theme.border },
              ]}
            >
              <AppButton
                accessibilityLabel={
                  isStartingNavigation
                    ? "Starting navigation"
                    : "Begin navigation"
                }
                testID="btn-start-navigation"
                disabled={isStartingNavigation}
                onPress={onBeginNavigation}
                style={styles.bottomGoButton}
              >
                <Text
                  style={[styles.goButtonLabel, { color: theme.onPrimary }]}
                >
                  {isStartingNavigation ? "Đang bắt đầu..." : "Bắt đầu"}
                </Text>
              </AppButton>

              <AppButton
                accessibilityLabel={
                  isRouteBookmarked
                    ? "Lộ trình đã lưu"
                    : "Lưu lộ trình yêu thích"
                }
                testID="btn-bookmark-route"
                onPress={onOpenBookmarkModal}
                style={[
                  styles.bottomBookmarkButton,
                  {
                    borderColor: theme.border,
                    backgroundColor: theme.backgroundElement,
                  },
                ]}
                variant="surface"
              >
                <MaterialCommunityIcons
                  name={isRouteBookmarked ? "bookmark" : "bookmark-outline"}
                  size={24}
                  color={isRouteBookmarked ? theme.primary : theme.text}
                />
              </AppButton>
            </View>
          ) : (
            <SafeAreaView
              edges={["bottom"]}
              style={[
                styles.sheetBottomButtonRow,
                { borderTopColor: theme.border },
              ]}
            >
              <AppButton
                accessibilityLabel="Dừng điều hướng"
                testID="btn-stop-navigation"
                onPress={onCloseRoute}
                style={[
                  styles.bottomGoButton,
                  { backgroundColor: theme.danger },
                ]}
              >
                <Text style={[styles.goButtonLabel, { color: "#FFFFFF" }]}>
                  Dừng
                </Text>
              </AppButton>
            </SafeAreaView>
          )}
        </View>
      ) : (
        /* Destination selected, no start selected yet */
        <>
          <View>
            <Text
              numberOfLines={1}
              style={[
                styles.destinationTitle,
                styles.selectedPlaceTitle,
                { color: theme.text },
              ]}
            >
              {selectedDestination.title}
            </Text>
            {selectedDestination.subtitle ? (
              <Text
                style={[
                  styles.selectedPlaceDescription,
                  { color: theme.textSecondary },
                ]}
              >
                {selectedDestination.subtitle}
              </Text>
            ) : null}
            {navigationError ? (
              <Text accessibilityRole="alert" style={styles.navigationError}>
                {navigationError}
              </Text>
            ) : null}
          </View>
          <View style={styles.destinationActions}>
            <AppButton
              accessibilityLabel="Start route"
              testID="btn-start-route-plan"
              disabled={isStartingNavigation}
              label={
                isStartingNavigation
                  ? "Đang bắt đầu..."
                  : "Bắt đầu lộ trình"
              }
              onPress={onGo}
              style={[styles.goButton, styles.destinationActionButton]}
            />
          </View>
        </>
      )}
    </Animated.View>
  );
}
