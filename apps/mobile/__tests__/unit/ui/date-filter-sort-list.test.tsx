import React from 'react';
import { Text, View, FlatList } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { DateFilterSortList } from '@/components/date-filter-sort-list';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#FFFFFF',
    backgroundElement: '#F8FAFC',
    backgroundSelected: '#EFF6FF',
    text: '#0F172A',
    textSecondary: '#007B8B',
    placeholder: '#94A3B8',
    border: '#E2E8F0',
    primary: '#007B8B',
    onPrimary: '#FFFFFF',
    secondary: '#E8F4F6',
    danger: '#EF4444',
    grey: '#888888',
    surface: '#FFFFFF',
  }),
}));

jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { View, Button } = require('react-native');
  return {
    __esModule: true,
    default: ({ onChange, testID }: any) =>
      React.createElement(
        View,
        { testID: testID || 'mock-date-time-picker' },
        React.createElement(Button, {
          title: 'Simulate Set Date',
          testID: 'mock-simulate-date-picker-change',
          onPress: () =>
            onChange?.({ type: 'set' }, new Date(2026, 10, 5, 12, 0, 0)),
        })
      ),
  };
});

interface MockItem {
  id: string;
  title: string;
  date: Date;
}

const mockList: MockItem[] = [
  { id: '1', title: 'Survey A', date: new Date(2026, 10, 1) },
  { id: '2', title: 'Survey B', date: new Date(2026, 10, 5) },
  { id: '3', title: 'Survey C', date: new Date(2026, 10, 8) },
];

describe('DateFilterSortList UI Component Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children with items and default toolbar controls', async () => {
    const { getByText } = await render(
      <DateFilterSortList
        items={mockList}
        getDate={(item) => item.date}
      >
        {({ items }) => (
          <FlatList
            data={items}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => <Text testID={`item-${item.id}`}>{item.title}</Text>}
          />
        )}
      </DateFilterSortList>
    );

    expect(getByText('Lọc theo ngày')).toBeTruthy();
    expect(getByText('Survey A')).toBeTruthy();
    expect(getByText('Survey B')).toBeTruthy();
    expect(getByText('Survey C')).toBeTruthy();
    expect(getByText('3')).toBeTruthy();
  });

  it('toggles sort order between newest, oldest, and default when pressed', async () => {
    const onFilterChange = jest.fn();
    const { getByText, getByLabelText } = await render(
      <DateFilterSortList
        items={mockList}
        getDate={(item) => item.date}
        onFilterChange={onFilterChange}
      >
        {({ items }) => (
          <View>
            {items.map((i) => (
              <Text key={i.id}>{i.title}</Text>
            ))}
          </View>
        )}
      </DateFilterSortList>
    );

    expect(getByText('Mới nhất')).toBeTruthy();

    const sortButton = getByLabelText('Sắp xếp ngày: Mới nhất');
    fireEvent.press(sortButton);

    await waitFor(() => {
      expect(getByText('Cũ nhất')).toBeTruthy();
    });

    fireEvent.press(getByLabelText('Sắp xếp ngày: Cũ nhất'));

    await waitFor(() => {
      expect(getByText('Mặc định')).toBeTruthy();
    });
  });

  it('allows selecting preset chips with selected styling and accessibility state', async () => {
    const { getByText, getByLabelText } = await render(
      <DateFilterSortList
        items={mockList}
        getDate={(item) => item.date}
        showPresets
      >
        {({ items, activePreset }) => (
          <View>
            <Text testID="rendered-count">{`Count: ${items.length}`}</Text>
            <Text testID="active-preset">{`Preset: ${activePreset ?? 'none'}`}</Text>
          </View>
        )}
      </DateFilterSortList>
    );

    const sevenDaysChip = getByLabelText('Chọn bộ lọc 7 ngày');
    expect(sevenDaysChip.props.accessibilityState).toEqual(
      expect.objectContaining({ selected: false })
    );

    fireEvent.press(sevenDaysChip);

    await waitFor(() => {
      expect(sevenDaysChip.props.accessibilityState).toEqual(
        expect.objectContaining({ selected: true })
      );
      expect(getByText('Preset: last7days')).toBeTruthy();
      expect(getByText('Đặt lại')).toBeTruthy();
    });
  });

  it('opens date picker and triggers date selection', async () => {
    const { getByLabelText, getByTestId, queryByTestId } = await render(
      <DateFilterSortList
        items={mockList}
        getDate={(item) => item.date}
      >
        {({ items }) => (
          <View>
            <Text testID="count">{`Count: ${items.length}`}</Text>
          </View>
        )}
      </DateFilterSortList>
    );

    const startDateButton = getByLabelText('Chọn Từ ngày');
    fireEvent.press(startDateButton);

    await waitFor(() => {
      expect(getByTestId('mock-date-time-picker')).toBeTruthy();
    });

    fireEvent.press(getByTestId('mock-simulate-date-picker-change'));

    await waitFor(() => {
      expect(queryByTestId('mock-date-time-picker')).toBeNull();
    });
  });

  it('allows clearing an active date filter with the inline clear button', async () => {
    const { getByLabelText, queryByLabelText } = await render(
      <DateFilterSortList
        items={mockList}
        getDate={(item) => item.date}
        initialStartDate={new Date(2026, 10, 5)}
      >
        {({ items }) => (
          <View>
            <Text testID="item-count">{`Count: ${items.length}`}</Text>
          </View>
        )}
      </DateFilterSortList>
    );

    await waitFor(() => {
      expect(getByLabelText('Xóa ngày bắt đầu')).toBeTruthy();
    });

    fireEvent.press(getByLabelText('Xóa ngày bắt đầu'));

    await waitFor(() => {
      expect(queryByLabelText('Xóa ngày bắt đầu')).toBeNull();
    });
  });

  it('resets all filters when clicking the "Đặt lại" button', async () => {
    const { getByText, getByLabelText, queryByText } = await render(
      <DateFilterSortList
        items={mockList}
        getDate={(item) => item.date}
        initialStartDate={new Date(2026, 10, 5)}
      >
        {({ items }) => (
          <View>
            <Text testID="item-count">{`Count: ${items.length}`}</Text>
          </View>
        )}
      </DateFilterSortList>
    );

    await waitFor(() => {
      expect(getByText('Đặt lại')).toBeTruthy();
    });

    fireEvent.press(getByLabelText('Đặt lại bộ lọc ngày'));

    await waitFor(() => {
      expect(queryByText('Đặt lại')).toBeNull();
    });
  });

  it('hides controls when hideControls is true', async () => {
    const { queryByText, getByText } = await render(
      <DateFilterSortList
        items={mockList}
        getDate={(item) => item.date}
        hideControls
      >
        {({ items }) => (
          <View>
            <Text testID="only-child">{`Count: ${items.length}`}</Text>
          </View>
        )}
      </DateFilterSortList>
    );

    expect(queryByText('Lọc theo ngày')).toBeNull();
    await waitFor(() => {
      expect(getByText('Count: 3')).toBeTruthy();
    });
  });

  it('displays warning when date range is inverted (startDate > endDate)', async () => {
    const { getByText } = await render(
      <DateFilterSortList
        items={mockList}
        getDate={(item) => item.date}
        initialStartDate={new Date(2026, 10, 10)}
        initialEndDate={new Date(2026, 10, 2)}
      >
        {({ items }) => (
          <View>
            <Text>{`Items: ${items.length}`}</Text>
          </View>
        )}
      </DateFilterSortList>
    );

    await waitFor(() => {
      expect(getByText('Ngày bắt đầu không thể sau ngày kết thúc')).toBeTruthy();
    });
  });
});
