import { useCallback, useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AppButton } from "@/components/button";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { SIGN_CATEGORIES, type SignCategory } from "@/constants/sign-categories";
import { categoryToCode, codeToCategory, type SavedRoute } from "@/types/savedRouteType";
import type { MapCoordinate, VehicleMode } from "@/types/navigationType";
import {
  useCreateSavedRoute,
  useUpdateSavedRoute,
} from "@/feature/saved-routes/hooks/use-saved-routes";
import { encodePolyline } from "@/feature/saved-routes/utils/polyline";
import { formatRouteDistanceInKilometers } from "../utils/navigation-formatters";
import { resolveLocation, formatResolvedLocationTitle } from "@/api/spatial/spatial";
import { styles } from "../styles/navigation-map-screen.styles";

export interface BookmarkRouteModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved: (savedId: string) => void;
  isRouteBookmarked: boolean;
  plannedRouteOrigin?: MapCoordinate;
  selectedDestination?: {
    id: string;
    coordinate: MapCoordinate;
    title: string;
    subtitle?: string;
  };
  routeStartTitle?: string;
  vehicleMode: VehicleMode["id"];
  isMotorcycleMode: boolean;
  routeCoordinates?: MapCoordinate[];
  routeDistance?: number;
  routeDuration?: number;
  activeSavedRouteId?: string;
  savedRouteData?: SavedRoute | null;
  activeCategories?: Set<SignCategory> | null;
  sessionAccessToken?: string;
  onShowToast: (message: string) => void;
  refetchPresets: () => Promise<unknown>;
  setActivePresetId: (id: string | null) => Promise<unknown>;
}

export function BookmarkRouteModal({
  visible,
  onClose,
  onSaved,
  isRouteBookmarked,
  plannedRouteOrigin,
  selectedDestination,
  routeStartTitle,
  vehicleMode,
  isMotorcycleMode,
  routeCoordinates,
  routeDistance,
  routeDuration,
  activeSavedRouteId,
  savedRouteData,
  activeCategories,
  sessionAccessToken,
  onShowToast,
  refetchPresets,
  setActivePresetId,
}: BookmarkRouteModalProps) {
  const theme = useTheme();
  const createSavedRouteMutation = useCreateSavedRoute();
  const updateSavedRouteMutation = useUpdateSavedRoute();

  const [bookmarkTitleInput, setBookmarkTitleInput] = useState("");
  const [bookmarkCategories, setBookmarkCategories] = useState<Set<SignCategory>>(
    new Set(["MANDATORY", "WARNING", "PROHIBITORY"]),
  );
  const [bookmarkError, setBookmarkError] = useState("");
  const [isSavingBookmark, setIsSavingBookmark] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const currentName =
      savedRouteData?.title ||
      `${routeStartTitle || "Điểm xuất phát"} ➔ ${selectedDestination?.title || "Điểm đến"}`;
    setBookmarkTitleInput(currentName);

    if (
      savedRouteData?.filterRules?.categories &&
      savedRouteData.filterRules.categories.length > 0
    ) {
      setBookmarkCategories(
        new Set(savedRouteData.filterRules.categories.map(codeToCategory)),
      );
    } else if (activeCategories && activeCategories.size > 0) {
      setBookmarkCategories(new Set(activeCategories));
    } else {
      setBookmarkCategories(new Set(["MANDATORY", "WARNING", "PROHIBITORY"]));
    }
    setBookmarkError("");
  }, [
    visible,
    savedRouteData,
    routeStartTitle,
    selectedDestination?.title,
    activeCategories,
  ]);

  const handleSave = useCallback(async () => {
    const trimmed = bookmarkTitleInput.trim();
    if (!trimmed) {
      setBookmarkError("Vui lòng nhập tên cho lộ trình.");
      return;
    }
    if (bookmarkCategories.size === 0) {
      setBookmarkError("Chọn ít nhất một danh mục biển báo.");
      return;
    }

    setIsSavingBookmark(true);
    setBookmarkError("");

    try {
      const categoriesArray = Array.from(bookmarkCategories).map(categoryToCode);
      const polylineStr = routeCoordinates?.length
        ? encodePolyline(routeCoordinates)
        : undefined;
      const targetVehicleMode =
        vehicleMode === "CYCLING"
          ? "CYCLING"
          : vehicleMode === "WALKING"
            ? "WALKING"
            : isMotorcycleMode
              ? "MOTORCYCLE"
              : "CAR";

      let effectiveOrigin = routeStartTitle || "Điểm xuất phát";
      if (effectiveOrigin === "Vị trí hiện tại" && plannedRouteOrigin) {
        try {
          const resolved = await resolveLocation(
            plannedRouteOrigin[1],
            plannedRouteOrigin[0],
            sessionAccessToken,
          );
          const formatted = formatResolvedLocationTitle(resolved);
          if (formatted) {
            effectiveOrigin = formatted;
          }
        } catch {}
      }

      const finalTitle =
        trimmed.startsWith("Vị trí hiện tại ➔") && effectiveOrigin !== "Vị trí hiện tại"
          ? trimmed.replace("Vị trí hiện tại ➔", `${effectiveOrigin} ➔`)
          : trimmed;

      if (activeSavedRouteId && savedRouteData) {
        await updateSavedRouteMutation.mutateAsync({
          id: activeSavedRouteId,
          dto: {
            title: finalTitle,
            vehicleMode: targetVehicleMode,
            filterRules: {
              onlyFixedSigns: true,
              categories: categoriesArray,
            },
          },
        });
        await refetchPresets();
        onShowToast("Đã cập nhật lộ trình đã lưu!");
        onSaved(activeSavedRouteId);
      } else if (plannedRouteOrigin && selectedDestination) {
        const created = await createSavedRouteMutation.mutateAsync({
          title: finalTitle,
          vehicleMode: targetVehicleMode,
          originName: effectiveOrigin,
          originLatitude: plannedRouteOrigin[1],
          originLongitude: plannedRouteOrigin[0],
          destinationName: selectedDestination.title,
          destinationLatitude: selectedDestination.coordinate[1],
          destinationLongitude: selectedDestination.coordinate[0],
          encodedPolyline: polylineStr,
          distanceMeters: routeDistance != null ? Math.round(routeDistance) : undefined,
          durationSeconds: routeDuration != null ? Math.round(routeDuration) : undefined,
          filterRules: {
            onlyFixedSigns: true,
            categories: categoriesArray,
          },
        });
        await refetchPresets();
        await setActivePresetId(created.id);
        onShowToast("Đã lưu lộ trình vào danh sách yêu thích!");
        onSaved(created.id);
      }
      onClose();
    } catch (err: any) {
      setBookmarkError(err?.message || "Không thể lưu lộ trình. Vui lòng thử lại.");
    } finally {
      setIsSavingBookmark(false);
    }
  }, [
    bookmarkTitleInput,
    bookmarkCategories,
    routeCoordinates,
    vehicleMode,
    isMotorcycleMode,
    routeStartTitle,
    plannedRouteOrigin,
    sessionAccessToken,
    activeSavedRouteId,
    savedRouteData,
    selectedDestination,
    routeDistance,
    routeDuration,
    updateSavedRouteMutation,
    createSavedRouteMutation,
    refetchPresets,
    setActivePresetId,
    onShowToast,
    onSaved,
    onClose,
  ]);

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalDialog,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {isRouteBookmarked ? "Cập nhật lộ trình đã lưu" : "Lưu lộ trình yêu thích"}
            </Text>
            <Pressable
              accessibilityLabel="Đóng lưu lộ trình"
              onPress={onClose}
              style={styles.modalCloseBtn}
            >
              <MaterialCommunityIcons color={theme.placeholder} name="close" size={20} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>Tên lộ trình</Text>
            <TextInput
              accessibilityLabel="Tên lộ trình"
              autoFocus
              maxLength={60}
              onChangeText={(t) => {
                setBookmarkTitleInput(t);
                setBookmarkError("");
              }}
              placeholder="VD: Lộ trình đi làm, Đường về nhà"
              placeholderTextColor={theme.placeholder}
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.background,
                  borderColor:
                    bookmarkError && !bookmarkTitleInput.trim()
                      ? theme.danger
                      : theme.border,
                  color: theme.text,
                },
              ]}
              value={bookmarkTitleInput}
            />

            {/* Vehicle preference indicator */}
            <View
              style={[
                styles.bookmarkVehicleRow,
                { backgroundColor: theme.background, borderColor: theme.border },
              ]}
            >
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
                size={20}
                color={theme.primary}
              />
              <Text style={[styles.bookmarkVehicleText, { color: theme.text }]}>
                {`Phương tiện: ${
                  vehicleMode === "CYCLING"
                    ? "Xe đạp"
                    : vehicleMode === "WALKING"
                      ? "Đi bộ"
                      : isMotorcycleMode
                        ? "Xe máy"
                        : "Ô tô"
                }`}
              </Text>
              {routeDistance !== undefined ? (
                <Text style={[styles.bookmarkVehicleSub, { color: theme.textSecondary }]}>
                  {`• ${formatRouteDistanceInKilometers(routeDistance)}`}
                </Text>
              ) : null}
            </View>

            <Text
              style={[styles.inputLabel, { color: theme.text, marginTop: Spacing.two }]}
            >
              Quy tắc lọc danh mục biển báo
            </Text>
            <Text style={[styles.inputHint, { color: theme.placeholder }]}>
              Chỉ các biển báo thuộc danh mục được chọn mới hiển thị trên bản đồ lộ trình này.
            </Text>

            <View style={styles.categoryPickerList}>
              {SIGN_CATEGORIES.map((cat) => {
                const isChecked = bookmarkCategories.has(cat.id);
                return (
                  <Pressable
                    key={cat.id}
                    accessibilityLabel={`Biển ${cat.label}, ${isChecked ? "đã bao gồm" : "chưa bao gồm"}`}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isChecked }}
                    onPress={() => {
                      setBookmarkCategories((prev) => {
                        const next = new Set(prev);
                        if (next.has(cat.id)) {
                          if (next.size === 1) {
                            setBookmarkError("Chọn ít nhất một danh mục biển báo.");
                            return prev;
                          }
                          next.delete(cat.id);
                        } else {
                          next.add(cat.id);
                        }
                        setBookmarkError("");
                        return next;
                      });
                    }}
                    style={({ pressed }) => [
                      styles.catOptionRow,
                      {
                        backgroundColor: isChecked
                          ? theme.backgroundSelected
                          : theme.background,
                        borderColor: isChecked ? cat.color : theme.border,
                        opacity: pressed ? 0.75 : 1,
                      },
                    ]}
                  >
                    <View
                      style={[styles.catIconShell, { backgroundColor: cat.bgColor }]}
                    >
                      <MaterialCommunityIcons
                        color={cat.color}
                        name={cat.icon}
                        size={18}
                      />
                    </View>

                    <View style={styles.catOptionCopy}>
                      <Text style={[styles.catOptionTitle, { color: theme.text }]}>
                        {cat.label}
                      </Text>
                      <Text
                        style={[styles.catOptionSublabel, { color: theme.placeholder }]}
                      >
                        {cat.sublabel}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.catCheckbox,
                        {
                          backgroundColor: isChecked ? cat.color : "transparent",
                          borderColor: isChecked ? cat.color : theme.border,
                        },
                      ]}
                    >
                      {isChecked ? (
                        <MaterialCommunityIcons
                          color="#FFFFFF"
                          name="check"
                          size={13}
                        />
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {bookmarkError ? (
              <Text style={[styles.errorText, { color: theme.danger }]}>
                {bookmarkError}
              </Text>
            ) : null}
          </ScrollView>

          <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
            <AppButton
              accessibilityLabel="Hủy lưu lộ trình"
              onPress={onClose}
              style={styles.modalCancelBtn}
              variant="ghost"
            >
              <Text style={[styles.modalCancelText, { color: theme.placeholder }]}>
                Hủy
              </Text>
            </AppButton>
            <AppButton
              accessibilityLabel="Lưu lộ trình"
              disabled={isSavingBookmark}
              onPress={handleSave}
              style={styles.modalSaveBtn}
            >
              <Text style={[styles.modalSaveText, { color: theme.onPrimary }]}>
                {isSavingBookmark
                  ? "Đang lưu..."
                  : isRouteBookmarked
                    ? "Cập nhật"
                    : "Lưu"}
              </Text>
            </AppButton>
          </View>
        </View>
      </View>
    </Modal>
  );
}
