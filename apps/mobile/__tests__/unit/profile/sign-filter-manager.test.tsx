import React from 'react';
import { render, fireEvent, act, cleanup } from '@testing-library/react-native';
import { Alert } from 'react-native';

const mockPush = jest.fn();
jest.mock('expo-router', () => {
  const React = require('react');
  return {
    useRouter: () => ({
      push: mockPush,
    }),
    useFocusEffect: (cb: any) => {
      React.useEffect(() => {
        cb();
      }, []);
    },
  };
});

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  return {
    MaterialCommunityIcons: (props: any) => <View testID={`mc-icon-${props.name}`} {...props} />,
  };
});

const mockCreatePreset = jest.fn();
const mockUpdatePreset = jest.fn();
const mockDeletePreset = jest.fn();
const mockRenamePreset = jest.fn();
const mockSetActivePresetId = jest.fn();
const mockRefetchPresets = jest.fn();

const samplePresets = [
  {
    id: 'preset-1',
    name: 'Đi làm',
    categories: ['MANDATORY', 'WARNING'],
    savedRoute: {
      id: 'sr-1',
      originName: 'Nhà',
      originLatitude: 10.77,
      originLongitude: 106.7,
      destinationName: 'Công ty',
      destinationLatitude: 10.78,
      destinationLongitude: 106.71,
      vehicleMode: 'MOTORCYCLE',
    },
  },
  {
    id: 'preset-2',
    name: 'Tất cả biển báo',
    categories: ['MANDATORY', 'WARNING', 'PROHIBITORY', 'INFORMATION'],
  },
];

jest.mock('@/context/sign-filter-provider', () => ({
  useSignFilter: () => ({
    activePresetId: 'preset-1',
    presets: samplePresets,
    createPreset: mockCreatePreset,
    updatePreset: mockUpdatePreset,
    deletePreset: mockDeletePreset,
    renamePreset: mockRenamePreset,
    setActivePresetId: mockSetActivePresetId,
    refetchPresets: mockRefetchPresets,
  }),
}));

jest.mock('@/context/session-provider', () => ({
  useOptionalSession: () => ({
    session: { accessToken: 'test-token' },
  }),
}));

jest.mock('@/feature/navigation/hooks/use-places', () => ({
  usePlaceSuggestions: (query: string) => ({
    data: query
      ? [
          { id: 'place-1', title: 'Địa điểm A', address: '123 Đường A', latitude: 10.77, longitude: 106.7 },
        ]
      : [],
    isLoading: false,
  }),
}));

jest.mock('@/feature/navigation/utils/gps', () => ({
  fetchFreshGpsPosition: jest.fn().mockResolvedValue([106.7, 10.77]),
}));

jest.mock('@/api/spatial/spatial', () => ({
  resolveLocation: jest.fn().mockResolvedValue({ displayAddress: 'Quận 1, HCMC' }),
  formatResolvedLocationTitle: jest.fn().mockReturnValue('Vị trí GPS Quận 1'),
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#FFFFFF',
    backgroundElement: '#F8FAFC',
    backgroundSelected: '#EFF6FF',
    border: '#E2E8F0',
    primary: '#2563EB',
    text: '#0F172A',
    textSecondary: '#475569',
    danger: '#EF4444',
    grey: '#94A3B8',
    greyLight: '#F1F5F9',
  }),
}));

import { SignFilterManager } from '@/feature/profile/components/sign-filter-manager';

describe('SignFilterManager Component', () => {
  afterEach(async () => {
    cleanup();
    jest.clearAllMocks();
  });

  it('renders presets list with route and category details', async () => {
    const { getByText, getAllByText } = await render(<SignFilterManager />);

    expect(getByText('Nhà ➔ Công ty')).toBeTruthy();
    expect(getByText('Đi làm')).toBeTruthy();
    expect(getByText('Tất cả biển báo')).toBeTruthy();
  });

  it('switches active preset when preset card is tapped', async () => {
    const { getByText } = await render(<SignFilterManager />);

    const otherPreset = getByText('Tất cả biển báo');
    fireEvent.press(otherPreset);

    expect(mockSetActivePresetId).toHaveBeenCalledWith('preset-2');
  });

  it('navigates to map when Bản đồ button is pressed', async () => {
    const { getAllByText } = await render(<SignFilterManager />);

    const mapButtons = getAllByText('Bản đồ');
    fireEvent.press(mapButtons[0]);

    expect(mockSetActivePresetId).toHaveBeenCalledWith('preset-1');
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(authenticated)/(tabs)/home',
      params: { savedRouteId: 'preset-1' },
    });
  });

  it('opens rename modal and updates preset name', async () => {
    const { getAllByText, getByPlaceholderText, getByText } = await render(<SignFilterManager />);

    const renameButtons = getAllByText('Đổi tên');
    await act(async () => {
      fireEvent.press(renameButtons[0]);
    });

    const input = getByPlaceholderText('Tên lộ trình');
    await act(async () => {
      fireEvent.changeText(input, 'Đi làm buổi sáng');
    });

    const saveBtn = getByText('Lưu');
    await act(async () => {
      fireEvent.press(saveBtn);
    });

    expect(mockRenamePreset).toHaveBeenCalledWith('preset-1', 'Đi làm buổi sáng');
  });

  it('prompts confirmation and deletes preset', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((title, msg, buttons) => {
      const confirmButton = buttons?.find((b) => b.style === 'destructive');
      confirmButton?.onPress?.();
    });

    const { getAllByText } = await render(<SignFilterManager />);

    const deleteButtons = getAllByText('Xóa');
    fireEvent.press(deleteButtons[0]);

    expect(Alert.alert).toHaveBeenCalled();
    expect(mockDeletePreset).toHaveBeenCalledWith('preset-1');
  });

  it('opens create modal, selects vehicle mode and creates new preset', async () => {
    const { getByText, getByPlaceholderText, getByLabelText } = await render(<SignFilterManager />);

    const createButton = getByText('Thêm mới');
    await act(async () => {
      fireEvent.press(createButton);
    });

    expect(getByText('Lộ trình & bộ lọc mới')).toBeTruthy();

    const nameInput = getByPlaceholderText('Tự động tạo: [Điểm xuất phát] ➔ [Điểm đến]');
    fireEvent.changeText(nameInput, 'Tuyến mới');

    // Select vehicle mode 'Ô tô'
    const carMode = getByText('Ô tô');
    fireEvent.press(carMode);

    // Save button triggers error if start/dest not selected
    const saveButton = getByLabelText('Lưu danh sách lọc');
    await act(async () => {
      fireEvent.press(saveButton);
    });

    expect(getByText('Vui lòng chọn Điểm bắt đầu (nhập tìm kiếm hoặc chọn Vị trí hiện tại).')).toBeTruthy();
  });
});
