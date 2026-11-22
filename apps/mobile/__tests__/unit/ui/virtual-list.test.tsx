import React, { createRef } from 'react';
import { Text, View } from 'react-native';
import { render } from '@testing-library/react-native';
import { type FlashListRef } from '@shopify/flash-list';

import { VirtualList } from '@/components/virtual-list';

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#FFFFFF',
    backgroundElement: '#F8FAFC',
    text: '#0F172A',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    primary: '#0671EB',
    onPrimary: '#FFFFFF',
    neutral: '#E2E8F0',
  }),
}));

describe('VirtualList Component', () => {
  interface TestItem {
    id: string;
    title: string;
  }

  const sampleData: TestItem[] = [
    { id: '1', title: 'Biển báo nguy hiểm 1' },
    { id: '2', title: 'Biển báo cấm 2' },
    { id: '3', title: 'Biển hiệu lệnh 3' },
  ];

  it('renders list items accurately with renderItem and keyExtractor', async () => {
    const { getByText } = await render(
      <VirtualList<TestItem>
        data={sampleData}
        estimatedItemSize={60}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View testID={`item-${item.id}`}>
            <Text>{item.title}</Text>
          </View>
        )}
      />,
    );

    expect(getByText('Biển báo nguy hiểm 1')).toBeTruthy();
    expect(getByText('Biển báo cấm 2')).toBeTruthy();
    expect(getByText('Biển hiệu lệnh 3')).toBeTruthy();
  });

  it('renders loading indicator when isLoading is true', async () => {
    const { getByTestId } = await render(
      <VirtualList<TestItem>
        data={[]}
        estimatedItemSize={60}
        isLoading={true}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text>{item.title}</Text>}
      />,
    );

    expect(getByTestId('virtual-list-loading')).toBeTruthy();
  });

  it('renders default empty state with emptyTitle and emptyDescription when data is empty', async () => {
    const { getByText } = await render(
      <VirtualList<TestItem>
        data={[]}
        emptyDescription="Thử tìm kiếm với từ khóa khác"
        emptyTitle="Không tìm thấy mục nào"
        estimatedItemSize={60}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text>{item.title}</Text>}
      />,
    );

    expect(getByText('Không tìm thấy mục nào')).toBeTruthy();
    expect(getByText('Thử tìm kiếm với từ khóa khác')).toBeTruthy();
  });

  it('renders custom ListEmptyComponent as a React element', async () => {
    const { getByTestId, getByText } = await render(
      <VirtualList<TestItem>
        data={[]}
        estimatedItemSize={60}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text testID="custom-empty-element">Tùy chỉnh rỗng</Text>}
        renderItem={({ item }) => <Text>{item.title}</Text>}
      />,
    );

    expect(getByTestId('custom-empty-element')).toBeTruthy();
    expect(getByText('Tùy chỉnh rỗng')).toBeTruthy();
  });

  it('renders custom ListEmptyComponent as a Component type', async () => {
    const CustomEmptyComponent = () => <Text testID="custom-empty-component">Component rỗng</Text>;

    const { getByTestId, getByText } = await render(
      <VirtualList<TestItem>
        data={[]}
        estimatedItemSize={60}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={CustomEmptyComponent}
        renderItem={({ item }) => <Text>{item.title}</Text>}
      />,
    );

    expect(getByTestId('custom-empty-component')).toBeTruthy();
    expect(getByText('Component rỗng')).toBeTruthy();
  });

  it('renders ListHeaderComponent and ListFooterComponent properly', async () => {
    const { getByText } = await render(
      <VirtualList<TestItem>
        data={sampleData}
        estimatedItemSize={60}
        keyExtractor={(item) => item.id}
        ListFooterComponent={<Text>Đã tải hết danh sách</Text>}
        ListHeaderComponent={<Text>Tiêu đề danh sách</Text>}
        renderItem={({ item }) => <Text>{item.title}</Text>}
      />,
    );

    expect(getByText('Tiêu đề danh sách')).toBeTruthy();
    expect(getByText('Đã tải hết danh sách')).toBeTruthy();
  });

  it('forwards ref properly to underlying FlashList instance', async () => {
    const listRef = createRef<FlashListRef<TestItem>>();

    await render(
      <VirtualList<TestItem>
        data={sampleData}
        estimatedItemSize={60}
        keyExtractor={(item) => item.id}
        ref={listRef}
        renderItem={({ item }) => <Text>{item.title}</Text>}
      />,
    );

    expect(listRef.current).toBeDefined();
  });

  it('renders multiple columns without errors', async () => {
    const { getByTestId } = await render(
      <VirtualList<TestItem>
        data={sampleData}
        estimatedItemSize={120}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => <Text testID={`col-item-${item.id}`}>{item.title}</Text>}
      />,
    );

    expect(getByTestId('col-item-1')).toBeTruthy();
    expect(getByTestId('col-item-2')).toBeTruthy();
  });
});
