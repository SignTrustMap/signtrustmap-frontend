import { renderHook, act } from '@testing-library/react-native';
import {
  useDateFilterSort,
  parseDateSafe,
  toStartOfDay,
  toEndOfDay,
} from '@/hooks/use-date-filter-sort';

interface MockItem {
  id: string;
  name: string;
  createdAt: string | Date | null | undefined;
}

const mockItems: MockItem[] = [
  { id: '1', name: 'Task 1', createdAt: new Date(2026, 10, 1, 10, 0, 0) }, // 2026-11-01
  { id: '2', name: 'Task 2', createdAt: new Date(2026, 10, 5, 14, 30, 0) }, // 2026-11-05
  { id: '3', name: 'Task 3', createdAt: new Date(2026, 10, 8, 8, 15, 0) }, // 2026-11-08
  { id: '4', name: 'Task 4', createdAt: new Date(2026, 10, 9, 23, 45, 0) }, // 2026-11-09 23:45 (end of day)
  { id: '5', name: 'Task 5', createdAt: new Date(2026, 10, 15, 12, 0, 0) }, // 2026-11-15
  { id: '6', name: 'Task 6', createdAt: null },
  { id: '7', name: 'Task 7', createdAt: 'invalid-date' },
];

describe('useDateFilterSort Hook Unit Tests', () => {
  describe('Helper Functions', () => {
    it('parseDateSafe parses ISO strings, timestamps, and Date objects safely', () => {
      expect(parseDateSafe('2026-11-09T10:00:00Z')).toBeInstanceOf(Date);
      expect(parseDateSafe(1700000000000)).toBeInstanceOf(Date);
      const now = new Date();
      expect(parseDateSafe(now)).toBe(now);
      expect(parseDateSafe(null)).toBeNull();
      expect(parseDateSafe(undefined)).toBeNull();
      expect(parseDateSafe('')).toBeNull();
      expect(parseDateSafe('not-a-date')).toBeNull();
    });

    it('toStartOfDay and toEndOfDay set correct hours, minutes, and milliseconds', () => {
      const base = new Date(2026, 10, 9, 14, 25, 30, 123);
      const start = toStartOfDay(base);
      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
      expect(start.getSeconds()).toBe(0);
      expect(start.getMilliseconds()).toBe(0);

      const end = toEndOfDay(base);
      expect(end.getHours()).toBe(23);
      expect(end.getMinutes()).toBe(59);
      expect(end.getSeconds()).toBe(59);
      expect(end.getMilliseconds()).toBe(999);
    });
  });

  describe('Default Initialization & Sorting', () => {
    it('initializes with default desc sorting and no date range', async () => {
      const { result } = await renderHook(() =>
        useDateFilterSort<MockItem>({
          items: mockItems,
          getDate: (item) => item.createdAt,
        })
      );

      expect(result.current.totalCount).toBe(7);
      expect(result.current.filteredCount).toBe(7);
      expect(result.current.sortOrder).toBe('desc');
      expect(result.current.startDate).toBeNull();
      expect(result.current.endDate).toBeNull();
      expect(result.current.hasActiveFilters).toBe(false);

      // Verify desc order (newest first, invalid/null at end)
      const ids = result.current.filteredItems.map((i) => i.id);
      expect(ids.slice(0, 5)).toEqual(['5', '4', '3', '2', '1']);
      expect(ids.slice(5)).toEqual(expect.arrayContaining(['6', '7']));
    });

    it('supports asc sort order (oldest first)', async () => {
      const { result } = await renderHook(() =>
        useDateFilterSort<MockItem>({
          items: mockItems,
          getDate: (item) => item.createdAt,
          initialSortOrder: 'asc',
        })
      );

      expect(result.current.sortOrder).toBe('asc');
      const ids = result.current.filteredItems.map((i) => i.id);
      expect(ids.slice(0, 5)).toEqual(['1', '2', '3', '4', '5']);
      expect(ids.slice(5)).toEqual(expect.arrayContaining(['6', '7']));
    });

    it('supports "none" sort order which preserves original item order', async () => {
      const { result } = await renderHook(() =>
        useDateFilterSort<MockItem>({
          items: mockItems,
          getDate: (item) => item.createdAt,
          initialSortOrder: 'none',
        })
      );

      expect(result.current.sortOrder).toBe('none');
      const ids = result.current.filteredItems.map((i) => i.id);
      expect(ids).toEqual(['1', '2', '3', '4', '5', '6', '7']);
    });

    it('toggleSortOrder cycles correctly between desc -> asc -> none -> desc', async () => {
      const { result } = await renderHook(() =>
        useDateFilterSort<MockItem>({
          items: mockItems,
          getDate: (item) => item.createdAt,
          initialSortOrder: 'desc',
        })
      );

      expect(result.current.sortOrder).toBe('desc');

      await act(async () => {
        result.current.toggleSortOrder();
      });
      expect(result.current.sortOrder).toBe('asc');

      await act(async () => {
        result.current.toggleSortOrder();
      });
      expect(result.current.sortOrder).toBe('none');

      await act(async () => {
        result.current.toggleSortOrder();
      });
      expect(result.current.sortOrder).toBe('desc');
    });
  });

  describe('Date Range Filtering', () => {
    it('filters items within a specific start and end date range (inclusive of entire end day)', async () => {
      const { result } = await renderHook(() =>
        useDateFilterSort<MockItem>({
          items: mockItems,
          getDate: (item) => item.createdAt,
          initialStartDate: new Date(2026, 10, 5),
          initialEndDate: new Date(2026, 10, 9),
        })
      );

      // Task 2 (Nov 5), Task 3 (Nov 8), Task 4 (Nov 9 23:45) are within range.
      // Task 1 (Nov 1) and Task 5 (Nov 15) are outside.
      // Task 6 (null) and Task 7 ('invalid') are excluded.
      expect(result.current.filteredCount).toBe(3);
      const ids = result.current.filteredItems.map((i) => i.id);
      expect(ids).toEqual(['4', '3', '2']);
    });

    it('filters correctly when only startDate is specified', async () => {
      const { result } = await renderHook(() =>
        useDateFilterSort<MockItem>({
          items: mockItems,
          getDate: (item) => item.createdAt,
        })
      );

      await act(async () => {
        result.current.setStartDate(new Date(2026, 10, 8));
      });

      // Tasks on or after Nov 8: Task 3, 4, 5
      expect(result.current.filteredCount).toBe(3);
      const ids = result.current.filteredItems.map((i) => i.id);
      expect(ids).toEqual(['5', '4', '3']);
    });

    it('filters correctly when only endDate is specified', async () => {
      const { result } = await renderHook(() =>
        useDateFilterSort<MockItem>({
          items: mockItems,
          getDate: (item) => item.createdAt,
        })
      );

      await act(async () => {
        result.current.setEndDate(new Date(2026, 10, 5));
      });

      // Tasks on or before Nov 5: Task 1, 2
      expect(result.current.filteredCount).toBe(2);
      const ids = result.current.filteredItems.map((i) => i.id);
      expect(ids).toEqual(['2', '1']);
    });

    it('detects isRangeInvalid when startDate is after endDate', async () => {
      const { result } = await renderHook(() =>
        useDateFilterSort<MockItem>({
          items: mockItems,
          getDate: (item) => item.createdAt,
        })
      );

      await act(async () => {
        result.current.setDateRange(new Date(2026, 10, 10), new Date(2026, 10, 5));
      });

      expect(result.current.isRangeInvalid).toBe(true);
      expect(result.current.filteredCount).toBe(0);
    });

    it('resets filters back to initial state', async () => {
      const { result } = await renderHook(() =>
        useDateFilterSort<MockItem>({
          items: mockItems,
          getDate: (item) => item.createdAt,
          initialSortOrder: 'desc',
        })
      );

      await act(async () => {
        result.current.setStartDate(new Date(2026, 10, 5));
        result.current.setSortOrder('asc');
      });

      expect(result.current.hasActiveFilters).toBe(true);
      expect(result.current.sortOrder).toBe('asc');

      await act(async () => {
        result.current.resetFilters();
      });

      expect(result.current.startDate).toBeNull();
      expect(result.current.endDate).toBeNull();
      expect(result.current.sortOrder).toBe('desc');
      expect(result.current.hasActiveFilters).toBe(false);
      expect(result.current.filteredCount).toBe(7);
    });
  });

  describe('Presets', () => {
    it('applies quick presets (today, last7days, last30days, thisMonth, all)', async () => {
      const { result } = await renderHook(() =>
        useDateFilterSort<MockItem>({
          items: mockItems,
          getDate: (item) => item.createdAt,
        })
      );

      expect(result.current.activePreset).toBeNull();

      await act(async () => {
        result.current.applyPreset('today');
      });
      expect(result.current.activePreset).toBe('today');
      expect(result.current.startDate).not.toBeNull();
      expect(result.current.endDate).not.toBeNull();
      expect(result.current.startDate!.getHours()).toBe(0);
      expect(result.current.endDate!.getHours()).toBe(23);

      await act(async () => {
        result.current.applyPreset('last7days');
      });
      expect(result.current.activePreset).toBe('last7days');
      expect(result.current.startDate).not.toBeNull();
      expect(result.current.endDate).not.toBeNull();

      // Toggling off the active preset
      await act(async () => {
        result.current.applyPreset('last7days');
      });
      expect(result.current.activePreset).toBeNull();
      expect(result.current.startDate).toBeNull();
      expect(result.current.endDate).toBeNull();

      await act(async () => {
        result.current.applyPreset('thisMonth');
      });
      expect(result.current.activePreset).toBe('thisMonth');

      // Manual date change clears active preset
      await act(async () => {
        result.current.setStartDate(new Date(2026, 10, 1));
      });
      expect(result.current.activePreset).toBeNull();

      await act(async () => {
        result.current.applyPreset('all');
      });
      expect(result.current.activePreset).toBeNull();
      expect(result.current.startDate).toBeNull();
      expect(result.current.endDate).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty items array gracefully without error', async () => {
      const { result } = await renderHook(() =>
        useDateFilterSort<MockItem>({
          items: [],
          getDate: (item) => item.createdAt,
        })
      );

      expect(result.current.totalCount).toBe(0);
      expect(result.current.filteredCount).toBe(0);
      expect(result.current.filteredItems).toEqual([]);
    });
  });
});
