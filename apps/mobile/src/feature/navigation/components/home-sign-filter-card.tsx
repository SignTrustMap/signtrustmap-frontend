import { Pressable, ScrollView, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AntDesign from "@expo/vector-icons/AntDesign";
import { AppButton } from "@/components/button";
import { useTheme } from "@/hooks/use-theme";
import { SIGN_CATEGORIES, type SignCategory } from "@/constants/sign-categories";
import type { SignFilterPreset } from "@/context/sign-filter-provider";
import { styles } from "../styles/navigation-map-screen.styles";

export interface HomeSignFilterCardProps {
  isOpen: boolean;
  onClose: () => void;
  filterViewMode: "lists" | "categories";
  onToggleFilterViewMode: () => void;
  activePresetId: string | null;
  onSelectPreset: (id: string | null) => void;
  presets: SignFilterPreset[];
  manualCategories: Set<SignCategory>;
  onToggleManualCategory: (cat: SignCategory) => void;
  onNavigateToProfileFilter: () => void;
}

export function HomeSignFilterCard({
  isOpen,
  onClose,
  filterViewMode,
  onToggleFilterViewMode,
  activePresetId,
  onSelectPreset,
  presets,
  manualCategories,
  onToggleManualCategory,
  onNavigateToProfileFilter,
}: HomeSignFilterCardProps) {
  const theme = useTheme();

  if (!isOpen) return null;

  return (
    <>
      <AppButton
        accessibilityLabel="Đóng menu lọc biển báo"
        onPress={onClose}
        style={styles.homeFilterBackdrop}
        variant="ghost"
      />

      <View
        style={[
          styles.homeFilterCard,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
          },
        ]}
      >
        <View
          style={[styles.homeFilterHeader, { borderBottomColor: theme.border }]}
        >
          <View style={styles.homeFilterTitleRow}>
            <Text style={[styles.homeFilterTitle, { color: theme.text }]}>
              {filterViewMode === "lists" ? "Bộ lọc biển báo" : "Danh mục biển báo"}
            </Text>
          </View>
          <AppButton
            accessibilityLabel={
              filterViewMode === "lists"
                ? "Chuyển sang lọc theo danh mục"
                : "Chuyển sang danh sách lọc"
            }
            onPress={onToggleFilterViewMode}
            style={styles.homeFilterToggleAllButton}
            variant="ghost"
          >
            <Text
              style={[
                styles.homeFilterToggleAllText,
                { color: theme.primary },
              ]}
            >
              {filterViewMode === "lists" ? "Danh mục" : "Danh sách"}
            </Text>
          </AppButton>
        </View>

        {filterViewMode === "lists" ? (
          <>
            <ScrollView
              style={styles.homeFilterPresetsScroll}
              showsVerticalScrollIndicator={false}
            >
              {/* Option 1: All Signs (No Filter) */}
              <Pressable
                accessibilityLabel={`Tất cả biển báo, không lọc, ${
                  activePresetId === null ? "đã chọn" : "chưa chọn"
                }`}
                accessibilityRole="radio"
                accessibilityState={{ checked: activePresetId === null }}
                onPress={() => onSelectPreset(null)}
                style={({ pressed }) => [
                  styles.homeFilterRow,
                  {
                    backgroundColor:
                      activePresetId === null
                        ? theme.backgroundSelected
                        : "transparent",
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.homeFilterIconBadge,
                    { backgroundColor: theme.backgroundSelected },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="filter-outline"
                    size={16}
                    color={theme.primary}
                  />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    numberOfLines={1}
                    style={[styles.homeFilterRowLabel, { color: theme.text }]}
                  >
                    Tất cả biển báo (Không lọc)
                  </Text>
                </View>
                <View
                  style={[
                    styles.homeFilterRadio,
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
                    <View style={styles.homeFilterRadioDot} />
                  ) : null}
                </View>
              </Pressable>

              {/* User-saved Presets */}
              {presets.map((preset) => {
                const isSelected = activePresetId === preset.id;
                return (
                  <Pressable
                    key={preset.id}
                    accessibilityLabel={`${preset.name}, ${
                      isSelected ? "đã chọn" : "chưa chọn"
                    }`}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isSelected }}
                    onPress={() => onSelectPreset(preset.id)}
                    style={({ pressed }) => [
                      styles.homeFilterRow,
                      {
                        backgroundColor: isSelected
                          ? theme.backgroundSelected
                          : "transparent",
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.homeFilterIconBadge,
                        { backgroundColor: theme.backgroundSelected },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="playlist-check"
                        size={16}
                        color={theme.primary}
                      />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.homeFilterRowLabel,
                          { color: theme.text },
                        ]}
                      >
                        {preset.savedRoute?.originName &&
                        preset.savedRoute?.destinationName
                          ? `${preset.savedRoute.originName} ➔ ${preset.savedRoute.destinationName}`
                          : preset.name}
                      </Text>
                      <Text
                        style={[
                          styles.homeFilterRowSublabel,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {preset.categories.length} danh mục
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.homeFilterRadio,
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
                        <View style={styles.homeFilterRadioDot} />
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}

              {presets.length === 0 ? (
                <View style={styles.homeFilterEmptyPrompt}>
                  <Text
                    style={[
                      styles.homeFilterEmptyText,
                      { color: theme.placeholder },
                    ]}
                  >
                    Chưa có danh sách bộ lọc tùy chỉnh nào.
                  </Text>
                  <AppButton
                    accessibilityLabel="Tạo danh sách lọc trong Cá nhân"
                    onPress={onNavigateToProfileFilter}
                    style={styles.homeFilterCreateBtn}
                    variant="surface"
                  >
                    <MaterialCommunityIcons
                      name="plus"
                      size={16}
                      color={theme.primary}
                    />
                    <Text
                      style={[
                        styles.homeFilterCreateBtnText,
                        { color: theme.primary },
                      ]}
                    >
                      Tạo danh sách trong Cá nhân
                    </Text>
                  </AppButton>
                </View>
              ) : null}
            </ScrollView>

            {/* Manage underline text under the list */}
            <Pressable
              accessibilityLabel="Quản lý danh sách lọc trong Cá nhân"
              accessibilityRole="link"
              onPress={onNavigateToProfileFilter}
              style={({ pressed }) => [
                styles.homeFilterManageRow,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Text
                style={[
                  styles.homeFilterManageText,
                  { color: theme.primary },
                ]}
              >
                Quản lý
              </Text>
            </Pressable>
          </>
        ) : (
          /* Categories view */
          <View style={styles.homeFilterCategoryList}>
            {SIGN_CATEGORIES.map((cat) => {
              const isSelected = manualCategories.has(cat.id);
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
                    styles.homeFilterRow,
                    {
                      backgroundColor: isSelected
                        ? theme.backgroundSelected
                        : "transparent",
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.homeFilterIconBadge,
                      { backgroundColor: cat.bgColor },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={cat.icon}
                      size={16}
                      color={cat.color}
                    />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.homeFilterRowLabel,
                        { color: theme.text },
                      ]}
                    >
                      {cat.label}
                    </Text>
                    <Text
                      style={[
                        styles.homeFilterRowSublabel,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {cat.sublabel}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.homeFilterCheckbox,
                      isSelected
                        ? { backgroundColor: cat.color, borderColor: cat.color }
                        : {
                            backgroundColor: "transparent",
                            borderColor: theme.border,
                          },
                    ]}
                  >
                    {isSelected ? (
                      <AntDesign name="check" size={11} color="#FFFFFF" />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </>
  );
}
