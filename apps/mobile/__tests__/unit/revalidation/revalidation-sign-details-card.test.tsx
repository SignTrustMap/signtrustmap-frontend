import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';
import { RevalidationSignDetailsCard } from '@/feature/revalidation/components/revalidation-sign-details-card';
import type { RouteSign } from '@/api/navigation/navigation';
import * as revalidationHooks from '@/feature/revalidation/hooks/use-revalidation';

// Mocks
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(true),
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

jest.mock('expo-image', () => ({
  Image: ({ testID, onError, ...props }: any) => {
    const React = require('react');
    return React.createElement('Image', { testID: testID || 'expo-image', onError, ...props });
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, left: 0, right: 0, bottom: 20 }),
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#FFFFFF',
    backgroundElement: '#FFFFFF',
    border: '#E2E8F0',
    text: '#1E293B',
    grey: '#64748B',
    placeholder: '#94A3B8',
  }),
}));

jest.mock('@/feature/revalidation/hooks/use-revalidation', () => ({
  useGetTaskEvidences: jest.fn(),
}));

jest.mock('@/components/image-inspection-modal', () => ({
  ImageInspectionModal: ({ visible, onClose, title }: any) => {
    const React = require('react');
    const { View, Text, TouchableOpacity } = require('react-native');
    if (!visible) return null;
    return React.createElement(
      View,
      { testID: 'image-inspection-modal' },
      React.createElement(Text, null, title),
      React.createElement(TouchableOpacity, { testID: 'close-inspect-modal', onPress: onClose }),
    );
  },
}));

const mockBaseSign: RouteSign = {
  id: 'sign-123',
  name: 'Biển báo giới hạn tốc độ 50',
  signCode: 'P.127',
  coordinate: [106.660172, 10.762622],
  roadName: 'Đường Nguyễn Huệ, Quận 1',
  displayAddress: '123 Đường Nguyễn Huệ, Bến Nghé, Quận 1',
  status: 'VERIFIED',
  freshnessScore: 92,
  imageUrl: 'https://example.com/standard-p127.png',
  actualCropUrl: 'https://example.com/actual-crop.jpg',
  lastVerifiedAt: '2026-05-10T10:00:00Z',
  taskId: 'task-abc-001',
};

describe('RevalidationSignDetailsCard Component', () => {
  const mockOnClose = jest.fn();
  const mockOnRevalidate = jest.fn();
  const mockOnCardHeightChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (revalidationHooks.useGetTaskEvidences as jest.Mock).mockReturnValue({
      data: [
        {
          id: 'ev-1',
          mediaUrl: 'https://example.com/evidence-1.jpg',
          capturedAt: '2026-05-15T08:30:00Z',
        },
      ],
      isLoading: false,
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('renders correctly in expanded view with high freshness sign', async () => {
    const { getByText, getByTestId } = await render(
      <RevalidationSignDetailsCard
        onCardHeightChange={mockOnCardHeightChange}
        onClose={mockOnClose}
        onRevalidate={mockOnRevalidate}
        sign={mockBaseSign}
      />,
    );

    // Title and address
    expect(getByText('Biển báo giới hạn tốc độ 50')).toBeTruthy();
    expect(getByText('123 Đường Nguyễn Huệ, Bến Nghé, Quận 1')).toBeTruthy();

    // Freshness & status
    expect(getByText('Hoạt động & Đã xác minh')).toBeTruthy();
    expect(getByText('92%')).toBeTruthy();
    expect(getByTestId('freshness-meter-fill')).toBeTruthy();

    // Sections
    expect(getByText('SO SÁNH BẰNG CHỨNG')).toBeTruthy();
    expect(getByText('BIỂN BÁO CHUẨN')).toBeTruthy();
    expect(getByText('ẢNH KHẢO SÁT GỬI LÊN')).toBeTruthy();
    expect(getByText('Kiểm tra thực địa')).toBeTruthy();
  });

  it('triggers onCardHeightChange when onLayout fires', async () => {
    const { getByTestId } = await render(
      <RevalidationSignDetailsCard
        onCardHeightChange={mockOnCardHeightChange}
        onClose={mockOnClose}
        sign={mockBaseSign}
      />,
    );

    const card = getByTestId('revalidation-sign-details-card');
    fireEvent(card, 'layout', {
      nativeEvent: { layout: { height: 420 } },
    });

    expect(mockOnCardHeightChange).toHaveBeenCalledWith(420);
  });

  it('renders retired status badge when sign status is RETIRED', async () => {
    const retiredSign: RouteSign = {
      ...mockBaseSign,
      status: 'RETIRED',
      freshnessScore: 10,
    };

    const { getByText } = await render(
      <RevalidationSignDetailsCard onClose={mockOnClose} sign={retiredSign} />,
    );

    expect(getByText('Đã thu hồi')).toBeTruthy();
  });

  it('renders moderate freshness badge when score is between 50 and 79', async () => {
    const moderateSign: RouteSign = {
      ...mockBaseSign,
      freshnessScore: 65,
      status: 'PENDING',
    };

    const { getByText } = await render(
      <RevalidationSignDetailsCard onClose={mockOnClose} sign={moderateSign} />,
    );

    expect(getByText('Cần chú ý')).toBeTruthy();
    expect(getByText('65%')).toBeTruthy();
  });

  it('renders needs revalidation badge when score is low (< 50)', async () => {
    const staleSign: RouteSign = {
      ...mockBaseSign,
      freshnessScore: 30,
      status: 'NEEDS_REVALIDATION',
    };

    const { getByText } = await render(
      <RevalidationSignDetailsCard onClose={mockOnClose} sign={staleSign} />,
    );

    expect(getByText('Cần tái thẩm định')).toBeTruthy();
    expect(getByText('30%')).toBeTruthy();
  });

  it('supports toggling expand and collapse via collapse button and collapsed card', async () => {
    const { getByLabelText, getByText, queryByText } = await render(
      <RevalidationSignDetailsCard onClose={mockOnClose} sign={mockBaseSign} />,
    );

    // Collapse it
    const collapseBtn = getByLabelText('Thu gọn chi tiết');
    await act(async () => {
      fireEvent.press(collapseBtn);
    });

    // Now in collapsed state
    expect(queryByText('SO SÁNH BẰNG CHỨNG')).toBeNull();
    expect(getByText('Kiểm tra')).toBeTruthy();

    // Expand it again
    const expandBtn = getByLabelText('Mở rộng chi tiết biển báo');
    await act(async () => {
      fireEvent.press(expandBtn);
    });

    // Back to expanded
    expect(getByText('SO SÁNH BẰNG CHỨNG')).toBeTruthy();
  });

  it('calls onClose when close button is pressed', async () => {
    const { getByLabelText } = await render(
      <RevalidationSignDetailsCard onClose={mockOnClose} sign={mockBaseSign} />,
    );

    const closeBtn = getByLabelText('Đóng chi tiết');
    fireEvent.press(closeBtn);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onRevalidate when "Kiểm tra thực địa" CTA is pressed', async () => {
    const { getByLabelText } = await render(
      <RevalidationSignDetailsCard
        onClose={mockOnClose}
        onRevalidate={mockOnRevalidate}
        sign={mockBaseSign}
      />,
    );

    const actionBtn = getByLabelText('Kiểm tra thực địa');
    fireEvent.press(actionBtn);

    expect(mockOnRevalidate).toHaveBeenCalledWith(mockBaseSign);
  });

  it('copies coordinates to clipboard on pressing coordinates button', async () => {
    const { getByLabelText, getByText } = await render(
      <RevalidationSignDetailsCard onClose={mockOnClose} sign={mockBaseSign} />,
    );

    const copyBtn = getByLabelText('Sao chép tọa độ vào bộ nhớ tạm');
    await act(async () => {
      fireEvent.press(copyBtn);
    });

    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('10.762622, 106.660172');
    expect(getByText('Đã sao chép vào bộ nhớ tạm!')).toBeTruthy();
  });

  it('copies task ID to clipboard on pressing task ID button', async () => {
    const { getByLabelText, getByText } = await render(
      <RevalidationSignDetailsCard
        onClose={mockOnClose}
        taskId="task-custom-999"
        sign={mockBaseSign}
      />,
    );

    const copyTaskBtn = getByLabelText('Sao chép mã nhiệm vụ vào bộ nhớ tạm');
    await act(async () => {
      fireEvent.press(copyTaskBtn);
    });

    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('task-custom-999');
    expect(getByText('Đã sao chép vào bộ nhớ tạm!')).toBeTruthy();
  });

  it('opens and closes image inspection modal for standard and submitted crops', async () => {
    const { getByLabelText, getByTestId, queryByTestId } = await render(
      <RevalidationSignDetailsCard onClose={mockOnClose} sign={mockBaseSign} />,
    );

    // Inspect official standard sign
    const inspectStdBtn = getByLabelText('Inspect official standard sign');
    await act(async () => {
      fireEvent.press(inspectStdBtn);
    });

    expect(getByTestId('image-inspection-modal')).toBeTruthy();

    // Close modal
    await act(async () => {
      fireEvent.press(getByTestId('close-inspect-modal'));
    });
    expect(queryByTestId('image-inspection-modal')).toBeNull();

    // Inspect submitted sign photo
    const inspectCropBtn = getByLabelText('Inspect submitted sign photo');
    await act(async () => {
      fireEvent.press(inspectCropBtn);
    });

    expect(getByTestId('image-inspection-modal')).toBeTruthy();
  });

  it('handles empty evidences and loading state correctly', async () => {
    // 1. Loading state
    (revalidationHooks.useGetTaskEvidences as jest.Mock).mockReturnValue({
      data: [],
      isLoading: true,
    });

    const { getByText, rerender } = await render(
      <RevalidationSignDetailsCard onClose={mockOnClose} sign={mockBaseSign} />,
    );

    expect(getByText('Đang kiểm tra đánh giá...')).toBeTruthy();
    expect(getByText('Đang tải đóng góp từ cộng đồng...')).toBeTruthy();

    // 2. Empty state (0 evidences)
    (revalidationHooks.useGetTaskEvidences as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });

    await rerender(<RevalidationSignDetailsCard onClose={mockOnClose} sign={mockBaseSign} />);

    expect(getByText('Chưa có lượt khảo sát nào')).toBeTruthy();
    expect(
      getByText('Hãy là khảo sát viên đầu tiên kiểm tra vị trí này để nhận thưởng'),
    ).toBeTruthy();
  });

  it('renders "Chưa có ảnh khảo sát" when submitted crop is missing or filtered out', async () => {
    const noCropSign: RouteSign = {
      ...mockBaseSign,
      actualCropUrl: undefined,
      frameUrl: undefined,
    };

    (revalidationHooks.useGetTaskEvidences as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });

    const { getByText } = await render(
      <RevalidationSignDetailsCard onClose={mockOnClose} sign={noCropSign} />,
    );

    expect(getByText('Chưa có ảnh khảo sát')).toBeTruthy();
  });

  it('handles image loading error by falling back to "Chưa có ảnh khảo sát"', async () => {
    const { getAllByTestId, getByText } = await render(
      <RevalidationSignDetailsCard onClose={mockOnClose} sign={mockBaseSign} />,
    );

    // Find the Image components and trigger onError on the crop image
    const images = getAllByTestId('expo-image');
    const cropImage = images.find((img) => img.props.source?.uri === mockBaseSign.actualCropUrl);
    expect(cropImage).toBeTruthy();

    await act(async () => {
      cropImage!.props.onError();
    });

    expect(getByText('Chưa có ảnh khảo sát')).toBeTruthy();
  });

  it('normalizes invalid media urls like "mock/xyz", "none", "undefined", "null"', async () => {
    const signWithMockMedia: any = {
      ...mockBaseSign,
      actualCropUrl: 'mock/path.jpg',
      imageUrl: undefined,
    };

    (revalidationHooks.useGetTaskEvidences as jest.Mock).mockReturnValue({
      data: [{ id: 'ev-1', mediaUrl: 'none' }],
      isLoading: false,
    });

    const { getByText } = await render(
      <RevalidationSignDetailsCard onClose={mockOnClose} sign={signWithMockMedia} />,
    );

    expect(getByText('Chưa có ảnh khảo sát')).toBeTruthy();
  });

  it('handles clipboard failure gracefully without throwing', async () => {
    const spyWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    (Clipboard.setStringAsync as jest.Mock).mockRejectedValueOnce(new Error('Clipboard error'));

    const { getByLabelText } = await render(
      <RevalidationSignDetailsCard onClose={mockOnClose} sign={mockBaseSign} />,
    );

    const copyBtn = getByLabelText('Sao chép tọa độ vào bộ nhớ tạm');
    await act(async () => {
      fireEvent.press(copyBtn);
    });

    expect(spyWarn).toHaveBeenCalledWith(
      expect.stringContaining('[RevalidationSignDetailsCard] Failed to copy coordinates:'),
      expect.any(Error),
    );

    spyWarn.mockRestore();
  });

  it('handles clipboard failure gracefully when copying task ID', async () => {
    const spyWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    (Clipboard.setStringAsync as jest.Mock).mockRejectedValueOnce(new Error('Task ID copy error'));

    const { getByLabelText } = await render(
      <RevalidationSignDetailsCard
        onClose={mockOnClose}
        taskId="task-fail-123"
        sign={mockBaseSign}
      />,
    );

    const copyTaskBtn = getByLabelText('Sao chép mã nhiệm vụ vào bộ nhớ tạm');
    await act(async () => {
      fireEvent.press(copyTaskBtn);
    });

    expect(spyWarn).toHaveBeenCalledWith(
      expect.stringContaining('[RevalidationSignDetailsCard] Failed to copy Task ID:'),
      expect.any(Error),
    );

    spyWarn.mockRestore();
  });

  it('handles signs with undefined coordinates gracefully', async () => {
    const signNoCoords: any = {
      ...mockBaseSign,
      coordinate: undefined,
    };

    const { getByLabelText, getByText } = await render(
      <RevalidationSignDetailsCard onClose={mockOnClose} sign={signNoCoords} />,
    );

    expect(getByText(/Sao chép Vĩ độ\/Kinh độ \(\?, \?\)/)).toBeTruthy();

    const copyBtn = getByLabelText('Sao chép tọa độ vào bộ nhớ tạm');
    await act(async () => {
      fireEvent.press(copyBtn);
    });

    expect(Clipboard.setStringAsync).not.toHaveBeenCalled();
  });

  it('resolves task ID from sign id starting with "reval-" when taskId is omitted', async () => {
    const revalSign: RouteSign = {
      ...mockBaseSign,
      id: 'reval-task-555',
      taskId: undefined,
    };

    await render(<RevalidationSignDetailsCard onClose={mockOnClose} sign={revalSign} />);

    expect(revalidationHooks.useGetTaskEvidences).toHaveBeenCalledWith('reval-task-555');
  });

  it('renders "Bằng chứng thực địa đang chờ đồng thuận" when evidence has no capturedAt date', async () => {
    (revalidationHooks.useGetTaskEvidences as jest.Mock).mockReturnValue({
      data: [{ id: 'ev-no-date', mediaUrl: 'https://example.com/img.jpg', capturedAt: null }],
      isLoading: false,
    });

    const { getByText } = await render(
      <RevalidationSignDetailsCard onClose={mockOnClose} sign={mockBaseSign} />,
    );

    expect(getByText('Bằng chứng thực địa đang chờ đồng thuận')).toBeTruthy();
  });

  it('renders sign without address or roadName with fallback location in collapsed state', async () => {
    const signNoAddr: any = {
      ...mockBaseSign,
      roadName: undefined,
      displayAddress: undefined,
      imageUrl: undefined,
    };

    const { getByText, getByLabelText } = await render(
      <RevalidationSignDetailsCard onClose={mockOnClose} sign={signNoAddr} />,
    );

    // Collapse it
    const collapseBtn = getByLabelText('Thu gọn chi tiết');
    await act(async () => {
      fireEvent.press(collapseBtn);
    });

    expect(getByText('Không có thông tin vị trí')).toBeTruthy();
  });

  it('falls back through alternate crop urls (signCropUrl, historicalCropUrl, frameUrl, bestFrameUrl)', async () => {
    const signWithFrame: any = {
      ...mockBaseSign,
      actualCropUrl: undefined,
      frameUrl: 'https://example.com/frame-url.jpg',
    };

    const { getByLabelText } = await render(
      <RevalidationSignDetailsCard onClose={mockOnClose} sign={signWithFrame} />,
    );

    expect(getByLabelText('Inspect submitted sign photo')).toBeTruthy();
  });
});
