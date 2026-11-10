import { useMemo, useState, useCallback } from 'react';

export type DateSortOrder = 'desc' | 'asc' | 'none';

export type DatePresetKey = 'today' | 'last7days' | 'last30days' | 'thisMonth' | 'all';

export interface UseDateFilterSortOptions<T> {
  /** The source array of items to filter and sort */
  items: T[];
  /** Function to extract a date or timestamp from an item */
  getDate: (item: T) => Date | string | number | null | undefined;
  /** Optional initial start date */
  initialStartDate?: Date | string | number | null;
  /** Optional initial end date */
  initialEndDate?: Date | string | number | null;
  /** Optional initial sort order (default: 'desc') */
  initialSortOrder?: DateSortOrder;
}

export interface UseDateFilterSortResult<T> {
  /** Filtered and sorted subset of items */
  filteredItems: T[];
  /** Total count before date filtering */
  totalCount: number;
  /** Number of items matching current date filter */
  filteredCount: number;
  /** Whether any date filter or non-default sort is active */
  hasActiveFilters: boolean;
  /** True if startDate is after endDate */
  isRangeInvalid: boolean;

  /** Active start date (or null if none) */
  startDate: Date | null;
  /** Active end date (or null if none) */
  endDate: Date | null;
  /** Active sort order */
  sortOrder: DateSortOrder;
  /** Active preset key if set via preset */
  activePreset: DatePresetKey | null;

  /** Set start date filter */
  setStartDate: (date: Date | string | number | null) => void;
  /** Set end date filter */
  setEndDate: (date: Date | string | number | null) => void;
  /** Set custom date range directly */
  setDateRange: (start: Date | string | number | null, end: Date | string | number | null) => void;
  /** Set sort order */
  setSortOrder: (order: DateSortOrder) => void;
  /** Cycle through sort orders: desc -> asc -> none -> desc */
  toggleSortOrder: () => void;
  /** Apply preset date range (toggles off if already active) */
  applyPreset: (preset: DatePresetKey) => void;
  /** Reset filters to cleared dates and default sort */
  resetFilters: () => void;
}

/**
 * Safely parses any date representation to a JavaScript Date object.
 * Returns null if the value is missing or unparseable.
 */
export function parseDateSafe(value: Date | string | number | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Normalizes a date to 00:00:00.000 local time
 */
export function toStartOfDay(date: Date): Date {
  const result = new Date(date.getTime());
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Normalizes a date to 23:59:59.999 local time
 */
export function toEndOfDay(date: Date): Date {
  const result = new Date(date.getTime());
  result.setHours(23, 59, 59, 999);
  return result;
}

export function useDateFilterSort<T>({
  items,
  getDate,
  initialStartDate = null,
  initialEndDate = null,
  initialSortOrder = 'desc',
}: UseDateFilterSortOptions<T>): UseDateFilterSortResult<T> {
  const [startDate, setStartDateState] = useState<Date | null>(() => parseDateSafe(initialStartDate));
  const [endDate, setEndDateState] = useState<Date | null>(() => parseDateSafe(initialEndDate));
  const [sortOrder, setSortOrder] = useState<DateSortOrder>(initialSortOrder);
  const [activePreset, setActivePreset] = useState<DatePresetKey | null>(null);

  const setStartDate = useCallback((date: Date | string | number | null) => {
    setActivePreset(null);
    setStartDateState(parseDateSafe(date));
  }, []);

  const setEndDate = useCallback((date: Date | string | number | null) => {
    setActivePreset(null);
    setEndDateState(parseDateSafe(date));
  }, []);

  const setDateRange = useCallback(
    (start: Date | string | number | null, end: Date | string | number | null) => {
      setActivePreset(null);
      setStartDateState(parseDateSafe(start));
      setEndDateState(parseDateSafe(end));
    },
    []
  );

  const toggleSortOrder = useCallback(() => {
    setSortOrder((current) => {
      if (current === 'desc') return 'asc';
      if (current === 'asc') return 'none';
      return 'desc';
    });
  }, []);

  const resetFilters = useCallback(() => {
    setActivePreset(null);
    setStartDateState(null);
    setEndDateState(null);
    setSortOrder(initialSortOrder);
  }, [initialSortOrder]);

  const applyPreset = useCallback(
    (preset: DatePresetKey) => {
      if (activePreset === preset) {
        // Toggle off
        setActivePreset(null);
        setStartDateState(null);
        setEndDateState(null);
        return;
      }

      const now = new Date();
      switch (preset) {
        case 'today': {
          setActivePreset('today');
          const start = toStartOfDay(now);
          const end = toEndOfDay(now);
          setStartDateState(start);
          setEndDateState(end);
          break;
        }
        case 'last7days': {
          setActivePreset('last7days');
          const start = toStartOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));
          const end = toEndOfDay(now);
          setStartDateState(start);
          setEndDateState(end);
          break;
        }
        case 'last30days': {
          setActivePreset('last30days');
          const start = toStartOfDay(new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000));
          const end = toEndOfDay(now);
          setStartDateState(start);
          setEndDateState(end);
          break;
        }
        case 'thisMonth': {
          setActivePreset('thisMonth');
          const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
          const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          setStartDateState(start);
          setEndDateState(end);
          break;
        }
        case 'all': {
          setActivePreset(null);
          setStartDateState(null);
          setEndDateState(null);
          break;
        }
      }
    },
    [activePreset]
  );

  const isRangeInvalid = useMemo(() => {
    if (!startDate || !endDate) return false;
    return toStartOfDay(startDate).getTime() > toEndOfDay(endDate).getTime();
  }, [startDate, endDate]);

  const hasActiveFilters = useMemo(() => {
    const hasDateFilter = Boolean(startDate || endDate);
    const hasDifferentSort = sortOrder !== initialSortOrder;
    return hasDateFilter || hasDifferentSort;
  }, [startDate, endDate, sortOrder, initialSortOrder]);

  const filteredItems = useMemo(() => {
    if (!items || items.length === 0) return [];

    const startBoundary = startDate ? toStartOfDay(startDate).getTime() : null;
    const endBoundary = endDate ? toEndOfDay(endDate).getTime() : null;

    // 1. Filter items by date range
    const filtered = items.filter((item) => {
      const rawDate = getDate(item);
      const parsed = parseDateSafe(rawDate);

      // If no date filters are set, retain item
      if (startBoundary === null && endBoundary === null) {
        return true;
      }

      // If date filter is active but item has no valid date, exclude it
      if (!parsed) {
        return false;
      }

      const itemTime = parsed.getTime();

      if (startBoundary !== null && itemTime < startBoundary) {
        return false;
      }

      if (endBoundary !== null && itemTime > endBoundary) {
        return false;
      }

      return true;
    });

    // 2. Sort items if requested
    if (sortOrder === 'none') {
      return filtered;
    }

    return [...filtered].sort((a, b) => {
      const dateA = parseDateSafe(getDate(a));
      const dateB = parseDateSafe(getDate(b));

      const timeA = dateA ? dateA.getTime() : null;
      const timeB = dateB ? dateB.getTime() : null;

      // Items without dates are always placed at the end
      if (timeA === null && timeB === null) return 0;
      if (timeA === null) return 1;
      if (timeB === null) return -1;

      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
  }, [items, getDate, startDate, endDate, sortOrder]);

  return {
    filteredItems,
    totalCount: items ? items.length : 0,
    filteredCount: filteredItems.length,
    hasActiveFilters,
    isRangeInvalid,
    startDate,
    endDate,
    sortOrder,
    activePreset,
    setStartDate,
    setEndDate,
    setDateRange,
    setSortOrder,
    toggleSortOrder,
    applyPreset,
    resetFilters,
  };
}
