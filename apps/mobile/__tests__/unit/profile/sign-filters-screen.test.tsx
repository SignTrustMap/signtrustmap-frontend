import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { SignFiltersScreen } from '@/feature/profile/pages/sign-filters-screen';
import { fetchFreshGpsPosition } from '@/feature/navigation/utils/gps';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => {
  const R = require('react');
  return {
    useRouter: () => ({
      push: mockPush,
      back: mockBack,
    }),
    useFocusEffect: (cb: any) => {
      R.useEffect(() => {
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

const mockCreatePreset = jest.fn().mockResolvedValue(null);
const mockUpdatePreset = jest.fn().mockResolvedValue(null);
const mockDeletePreset = jest.fn().mockResolvedValue(undefined);
const mockRenamePreset = jest.fn().mockResolvedValue(undefined);
const mockSetActivePresetId = jest.fn().mockResolvedValue(undefined);
const mockRefetchPresets = jest.fn().mockResolvedValue(undefined);

const samplePresets = [
  {
    id: 'preset-1',
    name: 'Tuyến đường đi làm',
    categories: ['MANDATORY', 'WARNING'],
    onlyFixedSigns: true,
    createdAt: Date.now(),
    savedRoute: {
      id: 'sr-1',
      originName: 'Phường Tân Mỹ',
      originLatitude: 10.77,
      originLongitude: 106.7,
      destinationName: 'Hẻm 62C Bà Hom',
      destinationLatitude: 10.78,
      destinationLongitude: 106.71,
      vehicleMode: 'MOTORCYCLE',
    },
  },
  {
    id: 'preset-2',
    name: 'Tất cả biển báo khu vực',
    categories: ['MANDATORY', 'WARNING', 'PROHIBITORY'],
    onlyFixedSigns: true,
    createdAt: Date.now(),
  },
];

let mockSignFilterState = {
  activePresetId: 'preset-1' as string | null,
  presets: samplePresets,
  createPreset: mockCreatePreset,
  updatePreset: mockUpdatePreset,
  deletePreset: mockDeletePreset,
  renamePreset: mockRenamePreset,
  setActivePresetId: mockSetActivePresetId,
  refetchPresets: mockRefetchPresets,
};

jest.mock('@/context/sign-filter-provider', () => ({
  useSignFilter: () => mockSignFilterState,
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
          {
            id: 'place-1',
            title: 'Địa điểm Test',
            address: '123 Đường Test',
            latitude: 10.77,
            longitude: 106.7,
          },
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
    primary: '#007B8B',
    text: '#0F172A',
    textSecondary: '#007b8b',
    danger: '#EF4444',
    grey: '#94A3B8',
    placeholder: '#888888',
  }),
}));

describe('SignFiltersScreen Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSignFilterState = {
      activePresetId: 'preset-1',
      presets: [...samplePresets],
      createPreset: mockCreatePreset,
      updatePreset: mockUpdatePreset,
      deletePreset: mockDeletePreset,
      renamePreset: mockRenamePreset,
      setActivePresetId: mockSetActivePresetId,
      refetchPresets: mockRefetchPresets,
    };
  });

  it('renders header bar with back button, screen title, and add button', async () => {
    const { getByText, getByLabelText } = await render(<SignFiltersScreen />);

    expect(getByText('Bộ lọc biển báo')).toBeTruthy();
    expect(getByText('Lộ trình đã lưu & quy tắc lọc')).toBeTruthy();
    expect(getByLabelText('Quay lại')).toBeTruthy();
    expect(getByLabelText('Tạo lộ trình & bộ lọc mới')).toBeTruthy();

    fireEvent.press(getByLabelText('Quay lại'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('renders default item "Tất cả biển báo (Không lọc)" and selecting it sets activePresetId to null', async () => {
    const { getByLabelText } = await render(<SignFiltersScreen />);

    const defaultItem = getByLabelText('Tất cả biển báo (Không lọc), chưa chọn');
    expect(defaultItem).toBeTruthy();

    await act(async () => {
      fireEvent.press(defaultItem);
    });

    expect(mockSetActivePresetId).toHaveBeenCalledWith(null);
  });

  it('renders custom presets and shows active badge on currently selected preset', async () => {
    const { getByText, getByLabelText } = await render(<SignFiltersScreen />);

    expect(getByText('Phường Tân Mỹ ➔ Hẻm 62C Bà Hom')).toBeTruthy();
    expect(getByText('Tuyến đường đi làm')).toBeTruthy();
    expect(getByText('Tất cả biển báo khu vực')).toBeTruthy();

    expect(getByLabelText('Phường Tân Mỹ ➔ Hẻm 62C Bà Hom, đã chọn')).toBeTruthy();
  });

  it('selecting another preset calls setActivePresetId with that preset id', async () => {
    const { getByLabelText } = await render(<SignFiltersScreen />);

    const preset2Item = getByLabelText('Tất cả biển báo khu vực, chưa chọn');
    await act(async () => {
      fireEvent.press(preset2Item);
    });

    expect(mockSetActivePresetId).toHaveBeenCalledWith('preset-2');
  });

  it('tapping "Bản đồ" button sets active preset and navigates to map screen', async () => {
    const { getByLabelText } = await render(<SignFiltersScreen />);

    const mapBtn = getByLabelText('Xem trên bản đồ: Tuyến đường đi làm');
    fireEvent.press(mapBtn);

    expect(mockSetActivePresetId).toHaveBeenCalledWith('preset-1');
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(authenticated)/(tabs)/home',
      params: { savedRouteId: 'preset-1' },
    });
  });

  it('prompts confirmation and deletes preset', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
      const confirmButton = buttons?.find((b) => b.style === 'destructive');
      confirmButton?.onPress?.();
    });

    const { getByLabelText } = await render(<SignFiltersScreen />);

    const deleteBtn = getByLabelText('Xóa Tuyến đường đi làm');
    await act(async () => {
      fireEvent.press(deleteBtn);
    });

    expect(Alert.alert).toHaveBeenCalled();
    expect(mockDeletePreset).toHaveBeenCalledWith('preset-1');
  });

  it('opens rename modal and saves new name', async () => {
    const { getByLabelText, getByText } = await render(<SignFiltersScreen />);

    const renameBtn = getByLabelText('Đổi tên Tuyến đường đi làm');
    await act(async () => {
      fireEvent.press(renameBtn);
    });

    const input = getByLabelText('Nhập tên lộ trình mới');
    await act(async () => {
      fireEvent.changeText(input, 'Đi làm buổi sáng');
    });

    const saveBtn = getByText('Lưu');
    await act(async () => {
      fireEvent.press(saveBtn);
    });

    expect(mockRenamePreset).toHaveBeenCalledWith('preset-1', 'Đi làm buổi sáng');
  });

  it('opens create modal when "+ Thêm mới" is clicked', async () => {
    const { getByLabelText, getByText } = await render(<SignFiltersScreen />);

    const addBtn = getByLabelText('Tạo lộ trình & bộ lọc mới');
    await act(async () => {
      fireEvent.press(addBtn);
    });

    expect(getByText('Lộ trình & bộ lọc mới')).toBeTruthy();
    expect(getByLabelText('Nhập điểm bắt đầu')).toBeTruthy();
    expect(getByLabelText('Nhập điểm đến')).toBeTruthy();
    expect(getByLabelText('Lưu danh sách lọc')).toBeTruthy();
  });

  it('validates missing start and destination points in create editor', async () => {
    const { getByLabelText, getByText } = await render(<SignFiltersScreen />);

    await act(async () => {
      fireEvent.press(getByLabelText('Tạo lộ trình & bộ lọc mới'));
    });

    // Try saving without startPoint
    await act(async () => {
      fireEvent.press(getByLabelText('Lưu danh sách lọc'));
    });
    expect(getByText('Vui lòng chọn Điểm bắt đầu (nhập tìm kiếm hoặc chọn Vị trí hiện tại).')).toBeTruthy();

    // Fill start point via GPS
    await act(async () => {
      fireEvent.press(getByLabelText('Chọn vị trí hiện tại cho điểm bắt đầu'));
    });

    // Try saving without destPoint
    await act(async () => {
      fireEvent.press(getByLabelText('Lưu danh sách lọc'));
    });
    expect(getByText('Vui lòng chọn Điểm đến (nhập tìm kiếm hoặc chọn Vị trí hiện tại).')).toBeTruthy();
  });

  it('handles GPS errors when selecting current location for start and dest', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    // GPS returns null
    (fetchFreshGpsPosition as jest.Mock).mockResolvedValueOnce(null);

    const { getByLabelText } = await render(<SignFiltersScreen />);

    await act(async () => {
      fireEvent.press(getByLabelText('Tạo lộ trình & bộ lọc mới'));
    });

    await act(async () => {
      fireEvent.press(getByLabelText('Chọn vị trí hiện tại cho điểm bắt đầu'));
    });
    expect(alertSpy).toHaveBeenCalledWith('Không thể xác định vị trí', expect.any(String));

    // GPS throws error
    (fetchFreshGpsPosition as jest.Mock).mockRejectedValueOnce(new Error('GPS timeout'));
    await act(async () => {
      fireEvent.press(getByLabelText('Chọn vị trí hiện tại cho điểm đến'));
    });
    expect(alertSpy).toHaveBeenCalledWith('Lỗi GPS', expect.any(String));

    alertSpy.mockRestore();
  });

  it('allows selecting suggestions, vehicle modes, and creates preset', async () => {
    const { getByLabelText, getByText } = await render(<SignFiltersScreen />);

    await act(async () => {
      fireEvent.press(getByLabelText('Tạo lộ trình & bộ lọc mới'));
    });

    // Focus and type in start query to show suggestions
    const startInput = getByLabelText('Nhập điểm bắt đầu');
    await act(async () => {
      fireEvent(startInput, 'focus');
      fireEvent.changeText(startInput, 'Địa điểm');
    });

    // Select start suggestion
    const startSuggestions = getByText('Địa điểm Test');
    await act(async () => {
      fireEvent.press(startSuggestions);
    });

    // Focus and type in dest query to show suggestions
    const destInput = getByLabelText('Nhập điểm đến');
    await act(async () => {
      fireEvent(destInput, 'focus');
      fireEvent.changeText(destInput, 'Địa điểm');
    });

    // Select dest suggestion
    const destSuggestions = getByText('Địa điểm Test');
    await act(async () => {
      fireEvent.press(destSuggestions);
    });

    // Switch vehicle mode to Ô tô
    await act(async () => {
      fireEvent.press(getByText('Ô tô'));
    });

    // Custom preset name
    await act(async () => {
      fireEvent.changeText(getByLabelText('Tên lộ trình tùy chọn'), 'Lộ trình mới đi làm');
    });

    // Save
    await act(async () => {
      fireEvent.press(getByLabelText('Lưu danh sách lọc'));
    });

    expect(mockCreatePreset).toHaveBeenCalledWith(
      'Lộ trình mới đi làm',
      expect.any(Array),
      expect.objectContaining({
        originName: 'Địa điểm Test',
        destinationName: 'Địa điểm Test',
        vehicleMode: 'CAR',
      }),
    );
  });

  it('opens edit modal for existing preset, toggles categories, and saves updates', async () => {
    const { getByLabelText, getByText } = await render(<SignFiltersScreen />);

    const editBtn = getByLabelText('Chỉnh sửa bộ lọc cho Tuyến đường đi làm');
    await act(async () => {
      fireEvent.press(editBtn);
    });

    expect(getByText('Chỉnh sửa lộ trình & bộ lọc')).toBeTruthy();

    // Toggle a category
    const mandatoryCat = getByLabelText('Biển Biển hiệu lệnh, đã bao gồm');
    await act(async () => {
      fireEvent.press(mandatoryCat);
    });

    // Save changes
    await act(async () => {
      fireEvent.press(getByLabelText('Lưu danh sách lọc'));
    });

    expect(mockUpdatePreset).toHaveBeenCalledWith(
      'preset-1',
      expect.objectContaining({
        name: 'Tuyến đường đi làm',
        onlyFixedSigns: true,
      }),
    );
  });

  it('prevents deselecting the last remaining category in editor', async () => {
    const { getByLabelText, getByText } = await render(<SignFiltersScreen />);

    await act(async () => {
      fireEvent.press(getByLabelText('Chỉnh sửa bộ lọc cho Tuyến đường đi làm'));
    });

    // samplePresets[0] has 'MANDATORY' and 'WARNING'. Deselect MANDATORY
    await act(async () => {
      fireEvent.press(getByLabelText('Biển Biển hiệu lệnh, đã bao gồm'));
    });

    // Now only WARNING remains. Deselect WARNING
    await act(async () => {
      fireEvent.press(getByLabelText('Biển Biển cảnh báo, đã bao gồm'));
    });

    expect(getByText('Danh sách phải bao gồm ít nhất một danh mục biển báo.')).toBeTruthy();
  });

  it('shows error when renaming to an empty string', async () => {
    const { getByLabelText, getByText } = await render(<SignFiltersScreen />);

    await act(async () => {
      fireEvent.press(getByLabelText('Đổi tên Tuyến đường đi làm'));
    });

    const input = getByLabelText('Nhập tên lộ trình mới');
    await act(async () => {
      fireEvent.changeText(input, '   ');
    });

    await act(async () => {
      fireEvent.press(getByText('Lưu'));
    });

    expect(getByText('Tên danh sách không được để trống.')).toBeTruthy();
    expect(mockRenamePreset).not.toHaveBeenCalled();
  });

  it('filters presets based on search query and clears search', async () => {
    const { getByLabelText, getByText, queryByText } = await render(<SignFiltersScreen />);

    const searchInput = getByLabelText('Tìm kiếm lộ trình hoặc địa điểm');
    await act(async () => {
      fireEvent.changeText(searchInput, 'Bà Hom');
    });

    await waitFor(() => {
      expect(getByText('Phường Tân Mỹ ➔ Hẻm 62C Bà Hom')).toBeTruthy();
      expect(queryByText('Tất cả biển báo khu vực')).toBeNull();
    });

    // Clear search using clear button
    const clearBtn = getByLabelText('Xóa tìm kiếm');
    await act(async () => {
      fireEvent.press(clearBtn);
    });

    await waitFor(() => {
      expect(getByText('Tất cả biển báo khu vực')).toBeTruthy();
    });
  });

  it('shows empty state when no presets match search and allows creating new preset', async () => {
    const { getByLabelText, getByText } = await render(<SignFiltersScreen />);

    const searchInput = getByLabelText('Tìm kiếm lộ trình hoặc địa điểm');
    await act(async () => {
      fireEvent.changeText(searchInput, 'Từ khóa không tồn tại xyz');
    });

    await waitFor(() => {
      expect(getByText('Không tìm thấy lộ trình nào')).toBeTruthy();
    });

    const emptyAddBtn = getByLabelText('Tạo lộ trình & bộ lọc đầu tiên');
    await act(async () => {
      fireEvent.press(emptyAddBtn);
    });

    expect(getByText('Lộ trình & bộ lọc mới')).toBeTruthy();
  });
});
