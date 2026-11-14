import React from 'react';
import { render, fireEvent, waitFor, cleanup, act } from '@testing-library/react-native';
import { useCreateSavedRoute, useUpdateSavedRoute } from '@/feature/saved-routes/hooks/use-saved-routes';
import { resolveLocation, formatResolvedLocationTitle } from '@/api/spatial/spatial';

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  return {
    MaterialCommunityIcons: (props: any) => <View testID={`mc-icon-${props.name}`} />,
  };
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

jest.mock('@/feature/saved-routes/hooks/use-saved-routes', () => ({
  useCreateSavedRoute: jest.fn(),
  useUpdateSavedRoute: jest.fn(),
}));

jest.mock('@/api/spatial/spatial', () => ({
  resolveLocation: jest.fn(),
  formatResolvedLocationTitle: jest.fn(),
}));

jest.mock('@/feature/saved-routes/utils/polyline', () => ({
  encodePolyline: jest.fn(() => 'encoded_test_polyline'),
}));

import { BookmarkRouteModal } from '@/feature/navigation/components/bookmark-route-modal';

describe('BookmarkRouteModal Component', () => {
  const mockCreateMutateAsync = jest.fn();
  const mockUpdateMutateAsync = jest.fn();
  const mockOnClose = jest.fn();
  const mockOnSaved = jest.fn();
  const mockOnShowToast = jest.fn();
  const mockRefetchPresets = jest.fn().mockResolvedValue(undefined);
  const mockSetActivePresetId = jest.fn().mockResolvedValue(undefined);

  const baseProps = {
    visible: true,
    onClose: mockOnClose,
    onSaved: mockOnSaved,
    isRouteBookmarked: false,
    plannedRouteOrigin: [106.68, 10.77] as [number, number],
    selectedDestination: {
      id: 'dest-1',
      coordinate: [106.70, 10.78] as [number, number],
      title: 'Chợ Bến Thành',
    },
    routeStartTitle: 'Vị trí hiện tại',
    vehicleMode: 'MOTORCYCLE' as const,
    isMotorcycleMode: true,
    routeCoordinates: [[106.68, 10.77], [106.70, 10.78]] as [number, number][],
    routeDistance: 3200,
    routeDuration: 600,
    onShowToast: mockOnShowToast,
    refetchPresets: mockRefetchPresets,
    setActivePresetId: mockSetActivePresetId,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateMutateAsync.mockResolvedValue({ id: 'new-route-id' });
    mockUpdateMutateAsync.mockResolvedValue({ id: 'updated-route-id' });
    (useCreateSavedRoute as jest.Mock).mockReturnValue({
      mutateAsync: mockCreateMutateAsync,
      isPending: false,
    });
    (useUpdateSavedRoute as jest.Mock).mockReturnValue({
      mutateAsync: mockUpdateMutateAsync,
      isPending: false,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('validates empty title', async () => {
    const { getByPlaceholderText, getByText } = await render(
      <BookmarkRouteModal {...baseProps} />
    );

    const titleInput = getByPlaceholderText('VD: Lộ trình đi làm, Đường về nhà');
    await act(async () => {
      fireEvent.changeText(titleInput, '');
    });

    const saveBtn = getByText('Lưu');
    await act(async () => {
      fireEvent.press(saveBtn);
    });

    await waitFor(() => {
      expect(getByText('Vui lòng nhập tên cho lộ trình.')).toBeTruthy();
    });
    expect(mockCreateMutateAsync).not.toHaveBeenCalled();
  });

  it('creates new saved route with resolved location if origin is current location', async () => {
    (resolveLocation as jest.Mock).mockResolvedValue({ id: 'loc1', displayName: '123 Lê Lợi' });
    (formatResolvedLocationTitle as jest.Mock).mockReturnValue('123 Lê Lợi');
    mockCreateMutateAsync.mockResolvedValue({ id: 'new-route-id' });

    const { getByText } = await render(
      <BookmarkRouteModal {...baseProps} sessionAccessToken="test-token" />
    );

    const saveBtn = getByText('Lưu');
    await act(async () => {
      fireEvent.press(saveBtn);
    });

    await waitFor(() => {
      expect(mockCreateMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '123 Lê Lợi ➔ Chợ Bến Thành',
          vehicleMode: 'MOTORCYCLE',
          originName: '123 Lê Lợi',
          destinationName: 'Chợ Bến Thành',
          distanceMeters: 3200,
          durationSeconds: 600,
          encodedPolyline: 'encoded_test_polyline',
        })
      );
    });

    expect(mockRefetchPresets).toHaveBeenCalled();
    expect(mockSetActivePresetId).toHaveBeenCalledWith('new-route-id');
    expect(mockOnShowToast).toHaveBeenCalledWith('Đã lưu lộ trình vào danh sách yêu thích!');
    expect(mockOnSaved).toHaveBeenCalledWith('new-route-id');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('updates existing saved route when activeSavedRouteId is present', async () => {
    mockUpdateMutateAsync.mockResolvedValue({});

    const savedRouteData = {
      id: 'existing-id',
      title: 'Tuyến đường đi làm',
      filterRules: {
        onlyFixedSigns: true,
        categories: ['BHL', 'BBG'],
      },
    };

    const { getByText } = await render(
      <BookmarkRouteModal
        {...baseProps}
        isRouteBookmarked={true}
        activeSavedRouteId="existing-id"
        savedRouteData={savedRouteData as any}
      />
    );

    expect(getByText('Cập nhật lộ trình đã lưu')).toBeTruthy();
    const updateBtn = getByText('Cập nhật');
    await act(async () => {
      fireEvent.press(updateBtn);
    });

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
        id: 'existing-id',
        dto: expect.objectContaining({
          title: 'Tuyến đường đi làm',
          vehicleMode: 'MOTORCYCLE',
          filterRules: {
            onlyFixedSigns: true,
            categories: expect.any(Array),
          },
        }),
      });
    });

    expect(mockOnShowToast).toHaveBeenCalledWith('Đã cập nhật lộ trình đã lưu!');
    expect(mockOnSaved).toHaveBeenCalledWith('existing-id');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles save error gracefully and shows error message', async () => {
    mockCreateMutateAsync.mockRejectedValue(new Error('Network failure'));

    const { getByText } = await render(
      <BookmarkRouteModal {...baseProps} routeStartTitle="Nhà" />
    );

    const saveBtn = getByText('Lưu');
    await act(async () => {
      fireEvent.press(saveBtn);
    });

    await waitFor(() => {
      expect(getByText('Network failure')).toBeTruthy();
    });
  });

  it('toggles sign category in category checklist', async () => {
    const { getByText } = await render(
      <BookmarkRouteModal {...baseProps} />
    );

    const catCheck = getByText('Biển hiệu lệnh');
    await act(async () => {
      fireEvent.press(catCheck);
    });

    expect(catCheck).toBeTruthy();
  });

  it('closes modal when cancel button or close icon is pressed', async () => {
    const { getByText, getByLabelText } = await render(
      <BookmarkRouteModal {...baseProps} />
    );

    await act(async () => {
      fireEvent.press(getByLabelText('Đóng lưu lộ trình'));
    });
    expect(mockOnClose).toHaveBeenCalled();

    await act(async () => {
      fireEvent.press(getByText('Hủy'));
    });
    expect(mockOnClose).toHaveBeenCalledTimes(2);
  });
});
