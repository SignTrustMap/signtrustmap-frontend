import React, { useState, useRef, useEffect, type ReactNode } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  useDateFilterSort,
  type DatePresetKey,
  type DateSortOrder,
  type UseDateFilterSortOptions,
} from '@/hooks/use-date-filter-sort';
import { formatDate } from '@/utils/format-date';

export interface DateFilterSortRenderProps<T> {
  /** Filtered and sorted subset of items */
  items: T[];
  /** Total count before date filtering */
  totalCount: number;
  /** Number of items matching current date filter */
  filteredCount: number;
  /** Whether any date filter or non-default sort is active */
  hasActiveFilters: boolean;
  /** True if startDate is after endDate */
  isRangeInvalid: boolean;

  /** Active start date */
  startDate: Date | null;
  /** Active end date */
  endDate: Date | null;
  /** Active sort order */
  sortOrder: DateSortOrder;
  /** Currently selected quick preset chip (e.g. 'last7days') */
  activePreset: DatePresetKey | null;

  /** State setters */
  setStartDate: (date: Date | string | number | null) => void;
  setEndDate: (date: Date | string | number | null) => void;
  setDateRange: (start: Date | string | number | null, end: Date | string | number | null) => void;
  setSortOrder: (order: DateSortOrder) => void;
  toggleSortOrder: () => void;
  applyPreset: (preset: DatePresetKey) => void;
  resetFilters: () => void;
}

export interface DateFilterSortListProps<T> extends UseDateFilterSortOptions<T> {
  /**
   * Render prop that receives the filtered & sorted items and filter metadata.
   * Renders any list (FlatList, SectionList, ScrollView, or custom cards).
   */
  children: (props: DateFilterSortRenderProps<T>) => ReactNode;

  /** Title displayed in the filter header (e.g. "Lọc theo ngày") */
  headerTitle?: string;
  /** Custom label for the start date input */
  startDateLabel?: string;
  /** Custom label for the end date input */
  endDateLabel?: string;
  /** Whether to show quick date presets (Today, 7 days, 30 days, This month) */
  showPresets?: boolean;
  /** Whether to show the sort toggle button */
  showSortToggle?: boolean;
  /** Whether to show the item count badge (e.g. "5/20") */
  showCountBadge?: boolean;
  /** Allows hiding the built-in control bar to provide a custom UI */
  hideControls?: boolean;

  /** Style overrides */
  containerStyle?: StyleProp<ViewStyle>;
  controlsCardStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;

  /** Optional callback fired when filter state changes */
  onFilterChange?: (state: {
    startDate: Date | null;
    endDate: Date | null;
    sortOrder: DateSortOrder;
    filteredCount: number;
    activePreset: DatePresetKey | null;
  }) => void;
}

type ActivePicker = 'start' | 'end' | null;

const PRESET_OPTIONS: Array<{ key: DatePresetKey; label: string }> = [
  { key: 'today', label: 'Hôm nay' },
  { key: 'last7days', label: '7 ngày' },
  { key: 'last30days', label: '30 ngày' },
  { key: 'thisMonth', label: 'Tháng này' },
];

export function DateFilterSortList<T>({
  items,
  getDate,
  initialStartDate = null,
  initialEndDate = null,
  initialSortOrder = 'desc',
  children,
  headerTitle = 'Lọc theo ngày',
  startDateLabel = 'Từ ngày',
  endDateLabel = 'Đến ngày',
  showPresets = true,
  showSortToggle = true,
  showCountBadge = true,
  hideControls = false,
  containerStyle,
  controlsCardStyle,
  titleStyle,
  onFilterChange,
}: DateFilterSortListProps<T>) {
  const theme = useTheme();

  const filterState = useDateFilterSort<T>({
    items,
    getDate,
    initialStartDate,
    initialEndDate,
    initialSortOrder,
  });

  const {
    filteredItems,
    totalCount,
    filteredCount,
    hasActiveFilters,
    isRangeInvalid,
    startDate,
    endDate,
    sortOrder,
    activePreset,
    setStartDate,
    setEndDate,
    toggleSortOrder,
    applyPreset,
    resetFilters,
  } = filterState;

  // Stable callback ref
  const onFilterChangeRef = useRef(onFilterChange);
  onFilterChangeRef.current = onFilterChange;

  useEffect(() => {
    onFilterChangeRef.current?.({
      startDate,
      endDate,
      sortOrder,
      filteredCount,
      activePreset,
    });
  }, [startDate, endDate, sortOrder, filteredCount, activePreset]);

  // Picker state
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);

  const openPicker = (type: 'start' | 'end') => {
    setActivePicker(type);
  };

  const closePicker = () => {
    setActivePicker(null);
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const current = activePicker;
    closePicker();
    if (event.type === 'set' && selectedDate) {
      if (current === 'start') {
        setStartDate(selectedDate);
      } else if (current === 'end') {
        setEndDate(selectedDate);
      }
    }
  };

  const getSortLabel = () => {
    switch (sortOrder) {
      case 'desc':
        return 'Mới nhất';
      case 'asc':
        return 'Cũ nhất';
      case 'none':
        return 'Mặc định';
    }
  };

  const getSortIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (sortOrder) {
      case 'desc':
        return 'arrow-down';
      case 'asc':
        return 'arrow-up';
      case 'none':
        return 'reorder-two-outline';
    }
  };

  const pickerValue =
    activePicker === 'start'
      ? startDate || new Date()
      : endDate || new Date();

  return (
    <View style={[styles.container, containerStyle]}>
      {/* ─── CONTROLS TOOLBAR CARD ─────────────────────────────────────────── */}
      {!hideControls && (
        <View
          style={[
            styles.controlsCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
            controlsCardStyle,
          ]}
        >
          {/* Top Header Row: Title + Count Badge + Reset */}
          <View style={styles.headerRow}>
            <View style={styles.titleWithCount}>
              <Ionicons name="calendar-outline" size={17} color={theme.primary} />
              <Text style={[styles.headerTitle, { color: theme.text }, titleStyle]}>
                {headerTitle}
              </Text>
              {showCountBadge && (
                <View style={[styles.countBadge, { backgroundColor: theme.secondary }]}>
                  <Text style={[styles.countBadgeText, { color: theme.primary }]}>
                    {hasActiveFilters ? `${filteredCount}/${totalCount}` : `${totalCount}`}
                  </Text>
                </View>
              )}
            </View>

            {hasActiveFilters && (
              <Pressable
                accessibilityLabel="Đặt lại bộ lọc ngày"
                accessibilityRole="button"
                onPress={resetFilters}
                style={({ pressed }) => [
                  styles.resetButton,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Ionicons name="refresh-outline" size={14} color={theme.primary} />
                <Text style={[styles.resetButtonText, { color: theme.primary }]}>Đặt lại</Text>
              </Pressable>
            )}
          </View>

          {/* Date Range Inputs Row */}
          <View style={styles.dateInputsRow}>
            {/* Start Date Button Container */}
            <View
              style={[
                styles.dateButtonContainer,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: startDate ? theme.primary : theme.border,
                },
              ]}
            >
              <Pressable
                accessibilityLabel={`Chọn ${startDateLabel}`}
                accessibilityRole="button"
                onPress={() => openPicker('start')}
                style={({ pressed }) => [
                  styles.dateButtonInner,
                  { opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Ionicons
                  name="calendar-clear-outline"
                  size={15}
                  color={startDate ? theme.primary : theme.placeholder}
                />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.dateButtonText,
                    {
                      color: startDate ? theme.text : theme.placeholder,
                      fontFamily: Fonts.body,
                    },
                  ]}
                >
                  {startDate ? formatDate(startDate) : startDateLabel}
                </Text>
              </Pressable>
              {startDate && (
                <Pressable
                  accessibilityLabel="Xóa ngày bắt đầu"
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => setStartDate(null)}
                  style={styles.clearIconWrapper}
                >
                  <Ionicons name="close-circle" size={15} color={theme.placeholder} />
                </Pressable>
              )}
            </View>

            <Ionicons name="arrow-forward" size={14} color={theme.placeholder} style={styles.arrowIcon} />

            {/* End Date Button Container */}
            <View
              style={[
                styles.dateButtonContainer,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: endDate ? theme.primary : theme.border,
                },
              ]}
            >
              <Pressable
                accessibilityLabel={`Chọn ${endDateLabel}`}
                accessibilityRole="button"
                onPress={() => openPicker('end')}
                style={({ pressed }) => [
                  styles.dateButtonInner,
                  { opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Ionicons
                  name="calendar-clear-outline"
                  size={15}
                  color={endDate ? theme.primary : theme.placeholder}
                />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.dateButtonText,
                    {
                      color: endDate ? theme.text : theme.placeholder,
                      fontFamily: Fonts.body,
                    },
                  ]}
                >
                  {endDate ? formatDate(endDate) : endDateLabel}
                </Text>
              </Pressable>
              {endDate && (
                <Pressable
                  accessibilityLabel="Xóa ngày kết thúc"
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => setEndDate(null)}
                  style={styles.clearIconWrapper}
                >
                  <Ionicons name="close-circle" size={15} color={theme.placeholder} />
                </Pressable>
              )}
            </View>
          </View>

          {/* Invalid Range Warning */}
          {isRangeInvalid && (
            <View style={styles.warningBox}>
              <Ionicons name="alert-circle-outline" size={14} color={theme.danger} />
              <Text style={[styles.warningText, { color: theme.danger }]}>
                Ngày bắt đầu không thể sau ngày kết thúc
              </Text>
            </View>
          )}

          {/* Bottom Row: Sort Toggle + Presets */}
          <View style={styles.controlsBottomRow}>
            {showSortToggle && (
              <Pressable
                accessibilityLabel={`Sắp xếp ngày: ${getSortLabel()}`}
                accessibilityRole="button"
                onPress={toggleSortOrder}
                style={({ pressed }) => [
                  styles.sortButton,
                  {
                    backgroundColor: sortOrder !== 'none' ? theme.secondary : theme.backgroundElement,
                    borderColor: sortOrder !== 'none' ? theme.primary : theme.border,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <Ionicons
                  name={getSortIcon()}
                  size={14}
                  color={sortOrder !== 'none' ? theme.primary : theme.text}
                />
                <Text
                  style={[
                    styles.sortButtonText,
                    {
                      color: sortOrder !== 'none' ? theme.primary : theme.text,
                      fontFamily: Fonts.body,
                    },
                  ]}
                >
                  {getSortLabel()}
                </Text>
              </Pressable>
            )}

            {/* Quick Presets with Active Selected Indicator */}
            {showPresets && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.presetsScrollContent}
              >
                {PRESET_OPTIONS.map((preset) => {
                  const isSelected = activePreset === preset.key;
                  return (
                    <Pressable
                      key={preset.key}
                      accessibilityLabel={`Chọn bộ lọc ${preset.label}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      onPress={() => applyPreset(preset.key)}
                      style={({ pressed }) => [
                        styles.presetChip,
                        {
                          backgroundColor: isSelected ? theme.primary : theme.backgroundElement,
                          borderColor: isSelected ? theme.primary : theme.border,
                          opacity: pressed ? 0.75 : 1,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.presetChipText,
                          {
                            color: isSelected ? theme.onPrimary : theme.textSecondary,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {preset.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      )}

      {/* ─── NATIVE DATE PICKER ───────────────────────────────────────────── */}
      {Boolean(activePicker) && (
        <DateTimePicker
          testID="mock-date-time-picker"
          value={pickerValue}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {/* ─── CHILD RENDER PROP (ANY LIST) ─────────────────────────────────── */}
      <View style={styles.childrenContainer}>
        {children({
          items: filteredItems,
          totalCount,
          filteredCount,
          hasActiveFilters,
          isRangeInvalid,
          startDate,
          endDate,
          sortOrder,
          activePreset,
          setStartDate,
          setEndDate,
          setDateRange: filterState.setDateRange,
          setSortOrder: filterState.setSortOrder,
          toggleSortOrder,
          applyPreset,
          resetFilters,
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  controlsCard: {
    borderWidth: 1,
    borderRadius: Rounded.lg,
    padding: Spacing.three,
    marginBottom: Spacing.two,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  titleWithCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Rounded.round,
    marginLeft: 4,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  resetButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dateInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  dateButtonContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Rounded.md,
    paddingHorizontal: Spacing.two,
    paddingVertical: 7,
  },
  dateButtonInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 12,
  },
  clearIconWrapper: {
    padding: 3,
    marginLeft: 4,
  },
  arrowIcon: {
    marginHorizontal: 2,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.two,
  },
  warningText: {
    fontSize: 11,
  },
  controlsBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Rounded.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 5,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  presetsScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  presetChip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: Rounded.round,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 11,
  },
  childrenContainer: {
    flex: 1,
  },
});
