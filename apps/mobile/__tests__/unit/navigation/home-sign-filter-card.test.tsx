import React from 'react';
import { render, fireEvent, cleanup, act } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  return {
    MaterialCommunityIcons: (props: any) => <View testID={`mc-icon-${props.name}`} />,
  };
});

jest.mock('@expo/vector-icons/AntDesign', () => {
  const { View } = require('react-native');
  return (props: any) => <View testID={`ant-icon-${props.name}`} />;
});

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#FFFFFF',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#F0FDFA',
    border: '#E2E8F0',
    text: '#0F172A',
    textSecondary: '#64748B',
    primary: '#0D9488',
    onPrimary: '#FFFFFF',
    placeholder: '#94A3B8',
    danger: '#EF4444',
  }),
}));

import { HomeSignFilterCard } from '@/feature/navigation/components/home-sign-filter-card';

describe('HomeSignFilterCard Component', () => {
  const mockOnClose = jest.fn();
  const mockToggleFilterViewMode = jest.fn();
  const mockOnSelectPreset = jest.fn();
  const mockOnToggleManualCategory = jest.fn();
  const mockOnNavigateToProfileFilter = jest.fn();

  const presets = [
    {
      id: 'p1',
      name: 'Tuyến hàng ngày',
      categories: ['MANDATORY', 'WARNING'],
      savedRoute: {
        originName: 'Nhà',
        destinationName: 'Công ty',
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders null when isOpen is false', async () => {
    const { toJSON } = await render(
      <HomeSignFilterCard
        isOpen={false}
        onClose={mockOnClose}
        filterViewMode="lists"
        onToggleFilterViewMode={mockToggleFilterViewMode}
        activePresetId={null}
        onSelectPreset={mockOnSelectPreset}
        presets={presets as any}
        manualCategories={new Set(['MANDATORY'])}
        onToggleManualCategory={mockOnToggleManualCategory}
        onNavigateToProfileFilter={mockOnNavigateToProfileFilter}
      />
    );
    expect(toJSON()).toBeNull();
  });

  it('renders presets list view and handles selection & toggle', async () => {
    const { getByText, getByLabelText } = await render(
      <HomeSignFilterCard
        isOpen={true}
        onClose={mockOnClose}
        filterViewMode="lists"
        onToggleFilterViewMode={mockToggleFilterViewMode}
        activePresetId={null}
        onSelectPreset={mockOnSelectPreset}
        presets={presets as any}
        manualCategories={new Set(['MANDATORY'])}
        onToggleManualCategory={mockOnToggleManualCategory}
        onNavigateToProfileFilter={mockOnNavigateToProfileFilter}
      />
    );

    expect(getByText('Bộ lọc biển báo')).toBeTruthy();
    expect(getByText('Tất cả biển báo (Không lọc)')).toBeTruthy();
    expect(getByText('Nhà ➔ Công ty')).toBeTruthy();
    expect(getByText('2 danh mục')).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByText('Nhà ➔ Công ty'));
    });
    expect(mockOnSelectPreset).toHaveBeenCalledWith('p1');

    await act(async () => {
      fireEvent.press(getByText('Tất cả biển báo (Không lọc)'));
    });
    expect(mockOnSelectPreset).toHaveBeenCalledWith(null);

    await act(async () => {
      fireEvent.press(getByLabelText('Chuyển sang lọc theo danh mục'));
    });
    expect(mockToggleFilterViewMode).toHaveBeenCalled();

    await act(async () => {
      fireEvent.press(getByText('Quản lý'));
    });
    expect(mockOnNavigateToProfileFilter).toHaveBeenCalled();

    await act(async () => {
      fireEvent.press(getByLabelText('Đóng menu lọc biển báo'));
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('renders empty preset state when presets array is empty', async () => {
    const { getByText } = await render(
      <HomeSignFilterCard
        isOpen={true}
        onClose={mockOnClose}
        filterViewMode="lists"
        onToggleFilterViewMode={mockToggleFilterViewMode}
        activePresetId={null}
        onSelectPreset={mockOnSelectPreset}
        presets={[]}
        manualCategories={new Set(['MANDATORY'])}
        onToggleManualCategory={mockOnToggleManualCategory}
        onNavigateToProfileFilter={mockOnNavigateToProfileFilter}
      />
    );

    expect(getByText('Chưa có danh sách bộ lọc tùy chỉnh nào.')).toBeTruthy();
    const createBtn = getByText('Tạo danh sách trong Cá nhân');
    await act(async () => {
      fireEvent.press(createBtn);
    });
    expect(mockOnNavigateToProfileFilter).toHaveBeenCalled();
  });

  it('renders category view and toggles categories', async () => {
    const { getByText, getByLabelText } = await render(
      <HomeSignFilterCard
        isOpen={true}
        onClose={mockOnClose}
        filterViewMode="categories"
        onToggleFilterViewMode={mockToggleFilterViewMode}
        activePresetId={null}
        onSelectPreset={mockOnSelectPreset}
        presets={presets as any}
        manualCategories={new Set(['MANDATORY'])}
        onToggleManualCategory={mockOnToggleManualCategory}
        onNavigateToProfileFilter={mockOnNavigateToProfileFilter}
      />
    );

    expect(getByText('Danh mục biển báo')).toBeTruthy();
    await act(async () => {
      fireEvent.press(getByText('Biển hiệu lệnh'));
    });
    expect(mockOnToggleManualCategory).toHaveBeenCalledWith('MANDATORY');

    await act(async () => {
      fireEvent.press(getByLabelText('Chuyển sang danh sách lọc'));
    });
    expect(mockToggleFilterViewMode).toHaveBeenCalled();
  });
});
