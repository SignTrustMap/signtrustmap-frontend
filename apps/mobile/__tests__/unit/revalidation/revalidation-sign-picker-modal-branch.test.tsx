import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return {
    Image: (props: any) => <View testID="sign-picker-image" {...props} />,
  };
});

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

let mockCatalogState: any = { data: undefined, isPending: false };
jest.mock('@/feature/review/hooks/use-review', () => ({
  useGetCatalog: () => mockCatalogState,
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    text: '#0F172A',
    textSecondary: '#475569',
    placeholder: '#94A3B8',
    background: '#F8FAFC',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#EFF6FF',
    neutral: '#F1F5F9',
    border: '#CBD5E1',
    primary: '#0671EB',
  }),
}));

import { RevalidationSignPickerModal } from '@/feature/revalidation/components/revalidation-sign-picker-modal';

describe('RevalidationSignPickerModal Branch Coverage', () => {
  const categories = [
    { id: 1, code: 'WARN', nameVi: 'Cảnh báo', nameEn: 'Warning' },
    { id: 2, code: 'PROHIB', nameVi: 'Cấm', nameEn: 'Prohibition' },
    { id: 3, code: 'GUIDE', nameEn: 'Information' },
    { id: 4, code: 'REGUL', nameVi: 'Hiệu lệnh', nameEn: 'Regulatory' },
    { id: 5, code: 'OTHER', nameVi: 'Khác', nameEn: 'Other' },
  ];

  const signs = [
    { id: 10, categoryId: 1, signCode: 'W.201', nameVi: 'Chỗ ngoặt nguy hiểm', category: categories[0], representativeImageKey: 'w201.svg' },
    { id: 11, categoryId: 2, signCode: 'P.102', nameVi: 'Cấm đi ngược chiều', category: categories[1], representativeImageKey: '' },
    { id: 12, categoryId: 3, signCode: 'I.401', nameEn: 'Direction Guide', category: categories[2], representativeImageKey: 'i401.svg' },
    { id: 13, categoryId: 4, signCode: 'R.301', nameVi: 'Hướng phải đi', category: categories[3] },
    { id: 14, categoryId: 5, signCode: 'S.505', nameVi: 'Biển phụ', category: categories[4] },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockCatalogState = { data: { categories, signs }, isPending: false };
  });

  it('renders loading state when catalog is empty and pending', async () => {
    mockCatalogState = { data: undefined, isPending: true };
    const screen = await render(
      <RevalidationSignPickerModal onClose={jest.fn()} visible={true} />,
    );
    expect(screen.getByText('Đang tải danh mục biển báo...')).toBeTruthy();
  });

  it('filters by category chips and search query (Vietnamese accent-insensitive), shows empty state, clears search, and selects a sign', async () => {
    const onSelectSign = jest.fn();
    const onClose = jest.fn();

    const screen = await render(
      <RevalidationSignPickerModal
        onClose={onClose}
        onSelectSign={onSelectSign}
        selectedSignId={10}
        visible={true}
      />,
    );

    expect(screen.getByText(/5\s*biển báo trong danh mục/)).toBeTruthy();

    // Filter by category chip 'Cấm'
    await fireEvent.press(screen.getByText('Cấm'));
    expect(screen.getByText(/1\s*biển báo trong danh mục/)).toBeTruthy();

    // Reset to Tất cả
    await fireEvent.press(screen.getByText('Tất cả'));
    expect(screen.getByText(/5\s*biển báo trong danh mục/)).toBeTruthy();

    // Search non-matching text -> empty state
    const input = screen.getByLabelText('Tìm kiếm biển báo');
    await fireEvent.changeText(input, 'khong ton tai xyz');
    expect(screen.getByText('Không tìm thấy biển báo')).toBeTruthy();

    // Search matching Vietnamese unaccented text -> selects sign & closes
    await fireEvent.changeText(input, 'ngoat nguy hiem');
    expect(screen.getByText(/1\s*biển báo trong danh mục/)).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Chọn biển báo W.201 - Chỗ ngoặt nguy hiểm'));
    expect(onSelectSign).toHaveBeenCalledWith(expect.objectContaining({ id: 10, signCode: 'W.201' }));
    expect(onClose).toHaveBeenCalled();
  });
});
