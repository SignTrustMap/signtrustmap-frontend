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
import { fetchFreshGpsPosition } from '@/feature/navigation/utils/gps';

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
    const carMode = getByText('Ô tô');
    const saveButton = getByLabelText('Lưu danh sách lọc');

    await act(async () => {
      fireEvent.changeText(nameInput, 'Tuyến mới');
      fireEvent.press(carMode);
      fireEvent.press(saveButton);
    });

    expect(getByText('Vui lòng chọn Điểm bắt đầu (nhập tìm kiếm hoặc chọn Vị trí hiện tại).')).toBeTruthy();
  });

  it('selects GPS current location for start and destination points and saves new preset', async () => {
    const { getByText, getByLabelText } = await render(<SignFilterManager />);

    const createButton = getByText('Thêm mới');
    await act(async () => {
      fireEvent.press(createButton);
    });

    // 1. Pick current location for Start
    const startGpsBtn = getByLabelText('Chọn vị trí hiện tại cho điểm bắt đầu');
    await act(async () => {
      fireEvent.press(startGpsBtn);
    });

    // 2. Pick current location for Destination
    const destGpsBtn = getByLabelText('Chọn vị trí hiện tại cho điểm đến');
    await act(async () => {
      fireEvent.press(destGpsBtn);
    });

    // 3. Save preset
    const saveButton = getByLabelText('Lưu danh sách lọc');
    await act(async () => {
      fireEvent.press(saveButton);
    });

    expect(mockCreatePreset).toHaveBeenCalledWith(
      expect.stringContaining('Vị trí GPS'),
      expect.any(Array),
      expect.objectContaining({
        originLatitude: 10.77,
        originLongitude: 106.7,
        destinationLatitude: 10.77,
        destinationLongitude: 106.7,
      })
    );
  });

  it('opens edit modal for existing preset, toggles categories, and updates preset', async () => {
    const { getAllByText, getByLabelText } = await render(<SignFilterManager />);

    const editButtons = getAllByText('Bộ lọc');
    await act(async () => {
      fireEvent.press(editButtons[0]);
    });

    // Save update
    const saveButton = getByLabelText('Lưu danh sách lọc');
    await act(async () => {
      fireEvent.press(saveButton);
    });

    expect(mockUpdatePreset).toHaveBeenCalledWith(
      'preset-1',
      expect.objectContaining({
        name: 'Đi làm',
      })
    );
  });

  it('shows error when renaming preset to empty string', async () => {
    const { getAllByText, getByPlaceholderText, getByText } = await render(<SignFilterManager />);

    const renameButtons = getAllByText('Đổi tên');
    await act(async () => {
      fireEvent.press(renameButtons[0]);
    });

    const input = getByPlaceholderText('Tên lộ trình');
    await act(async () => {
      fireEvent.changeText(input, '   ');
    });

    const saveBtn = getByText('Lưu');
    await act(async () => {
      fireEvent.press(saveBtn);
    });

    expect(getByText('Tên danh sách không được để trống.')).toBeTruthy();
    expect(mockRenamePreset).not.toHaveBeenCalled();
  });

  it('selects "Tất cả biển báo (Không lọc)" and resets active preset', async () => {
    const { getByText } = await render(<SignFilterManager />);

    const noFilter = getByText('Tất cả biển báo (Không lọc)');
    await act(async () => {
      fireEvent.press(noFilter);
    });

    expect(mockSetActivePresetId).toHaveBeenCalledWith(null);
  });

  it('handles GPS errors in editor for start and destination', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    // GPS returns null
    (fetchFreshGpsPosition as jest.Mock).mockResolvedValueOnce(null);

    const { getByText, getByLabelText } = await render(<SignFilterManager />);

    await act(async () => {
      fireEvent.press(getByText('Thêm mới'));
    });

    await act(async () => {
      fireEvent.press(getByLabelText('Chọn vị trí hiện tại cho điểm bắt đầu'));
    });
    expect(alertSpy).toHaveBeenCalledWith('Không thể xác định vị trí', expect.any(String));

    // GPS throws error
    (fetchFreshGpsPosition as jest.Mock).mockRejectedValueOnce(new Error('GPS error'));
    await act(async () => {
      fireEvent.press(getByLabelText('Chọn vị trí hiện tại cho điểm đến'));
    });
    expect(alertSpy).toHaveBeenCalledWith('Lỗi GPS', expect.any(String));

    alertSpy.mockRestore();
  });

  it('allows selecting suggestions, vehicle modes, and validates destination in editor', async () => {
    const { getByText, getByPlaceholderText, getByLabelText } = await render(<SignFilterManager />);

    await act(async () => {
      fireEvent.press(getByText('Thêm mới'));
    });

    // Start suggestion
    const startInput = getByPlaceholderText('Tìm kiếm điểm xuất phát...');
    await act(async () => {
      fireEvent(startInput, 'focus');
      fireEvent.changeText(startInput, 'Địa điểm');
    });

    const startSug = getByText('Địa điểm A');
    await act(async () => {
      fireEvent.press(startSug);
    });

    // Validate without destination
    await act(async () => {
      fireEvent.press(getByLabelText('Lưu danh sách lọc'));
    });
    expect(getByText('Vui lòng chọn Điểm đến (nhập tìm kiếm hoặc chọn Vị trí hiện tại).')).toBeTruthy();

    // Destination suggestion
    const destInput = getByPlaceholderText('Tìm kiếm điểm đến...');
    await act(async () => {
      fireEvent(destInput, 'focus');
      fireEvent.changeText(destInput, 'Địa điểm');
    });

    const destSug = getByText('Địa điểm A');
    await act(async () => {
      fireEvent.press(destSug);
    });

    // Switch vehicle modes
    await act(async () => {
      fireEvent.press(getByText('Xe đạp'));
    });
    await act(async () => {
      fireEvent.press(getByText('Đi bộ'));
    });
    await act(async () => {
      fireEvent.press(getByText('Xe máy'));
    });

    // Save
    await act(async () => {
      fireEvent.press(getByLabelText('Lưu danh sách lọc'));
    });

    expect(mockCreatePreset).toHaveBeenCalledWith(
      'Địa điểm A ➔ Địa điểm A',
      expect.any(Array),
      expect.objectContaining({
        vehicleMode: 'MOTORCYCLE',
      }),
    );
  });

  it('prevents deselecting the last category in editor', async () => {
    const { getAllByText, getByLabelText, getByText } = await render(<SignFilterManager />);

    const editButtons = getAllByText('Bộ lọc');
    await act(async () => {
      fireEvent.press(editButtons[0]);
    });

    // Deselect MANDATORY
    await act(async () => {
      fireEvent.press(getByLabelText('Biển Biển hiệu lệnh, đã bao gồm'));
    });

    // Deselect WARNING
    await act(async () => {
      fireEvent.press(getByLabelText('Biển Biển cảnh báo, đã bao gồm'));
    });

    expect(getByText('Danh sách phải bao gồm ít nhất một danh mục biển báo.')).toBeTruthy();
  });
});
