import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, act } from '@testing-library/react-native';

import { ReturnedSubmissionItemScreen } from '@/feature/work/pages/returned-submission-item-screen';

const mockBack = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
  }),
  useLocalSearchParams: () => ({ id: 'mock-sub-123' }),
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: any) => React.createElement(View, props, children),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

describe('ReturnedSubmissionItemScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders header with submission ID and back button', async () => {
    const { getByText, getByLabelText } = await render(
      <ReturnedSubmissionItemScreen id="test-item-999" />
    );

    expect(getByText('Xác nhận vị trí biển báo')).toBeTruthy();
    expect(getByText('Hồ sơ: test-item-999')).toBeTruthy();

    const backBtn = getByLabelText('Quay lại danh sách');
    fireEvent.press(backBtn);
    expect(mockBack).toHaveBeenCalled();
  });

  it('renders zoom button and toggles fullscreen modal when clicked', async () => {
    const { getByTestId, queryByTestId } = await render(
      <ReturnedSubmissionItemScreen id="test-item-999" />
    );

    const zoomBtn = getByTestId('zoom-button');
    expect(zoomBtn).toBeTruthy();

    // Click zoom button to open full-screen modal
    await act(async () => {
      fireEvent.press(zoomBtn);
    });
    expect(getByTestId('close-zoom-btn')).toBeTruthy();

    // Click close button to dismiss modal
    await act(async () => {
      fireEvent.press(getByTestId('close-zoom-btn'));
    });
    expect(queryByTestId('close-zoom-btn')).toBeNull();
  });

  it('forms a bounding box on image click indicating traffic sign location', async () => {
    const { getByTestId, queryByText, getAllByText } = await render(
      <ReturnedSubmissionItemScreen id="test-item-999" />
    );

    expect(queryByText('Biển báo #1')).toBeNull();

    // Simulate clicking on the image touch area
    const touchArea = getByTestId('image-touch-area');
    await act(async () => {
      fireEvent.press(touchArea, {
        nativeEvent: { locationX: 120, locationY: 100 },
      });
    });

    // Bounding box should now be formed with "Biển báo #1"
    expect(getAllByText('Biển báo #1').length).toBeGreaterThan(0);
    expect(getByTestId('box-controls-card')).toBeTruthy();
  });

  it('supports adding up to 3 boxes using the Add Box button and resizing via expand/shrink buttons', async () => {
    const { getByTestId, getByText, getAllByText } = await render(
      <ReturnedSubmissionItemScreen id="test-item-999" />
    );

    const addBoxBtn = getByTestId('add-box-btn');

    // Add 1st box
    await act(async () => {
      fireEvent.press(addBoxBtn);
    });
    expect(getAllByText('Biển báo #1').length).toBeGreaterThan(0);

    // Test expanding size
    const expandBtn = getByTestId('expand-box-btn');
    await act(async () => {
      fireEvent.press(expandBtn);
    });
    expect(getByText('105 × 105 px')).toBeTruthy();

    // Test shrinking size
    const shrinkBtn = getByTestId('shrink-box-btn');
    await act(async () => {
      fireEvent.press(shrinkBtn);
    });
    expect(getByText('85 × 85 px')).toBeTruthy();

    // Add 2nd box
    await act(async () => {
      fireEvent.press(addBoxBtn);
    });
    expect(getAllByText('Biển báo #2').length).toBeGreaterThan(0);

    // Add 3rd box
    await act(async () => {
      fireEvent.press(addBoxBtn);
    });
    expect(getAllByText('Biển báo #3').length).toBeGreaterThan(0);
    expect(getByText('Đã đủ 3 box')).toBeTruthy();

    // Verify button is disabled when max 3 boxes is reached
    expect(addBoxBtn.props.accessibilityState.disabled).toBe(true);
  });

  it('removes bounding box when Undo button is pressed', async () => {
    const { getByTestId, queryByText, getAllByText } = await render(
      <ReturnedSubmissionItemScreen id="test-item-999" />
    );

    const addBoxBtn = getByTestId('add-box-btn');
    await act(async () => {
      fireEvent.press(addBoxBtn);
    });
    expect(getAllByText('Biển báo #1').length).toBeGreaterThan(0);

    // Press Undo button
    const undoBtn = getByTestId('undo-btn');
    await act(async () => {
      fireEvent.press(undoBtn);
    });

    // Bounding box should be removed
    expect(queryByText('Biển báo #1')).toBeNull();
  });

  it('plays "Bạn chắc chắn chứ?" alert when Confirm button is pressed', async () => {
    const { getByTestId } = await render(
      <ReturnedSubmissionItemScreen id="test-item-999" />
    );

    const addBoxBtn = getByTestId('add-box-btn');
    await act(async () => {
      fireEvent.press(addBoxBtn);
    });

    const confirmBtn = getByTestId('confirm-btn');
    await act(async () => {
      fireEvent.press(confirmBtn);
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Bạn chắc chắn chứ?',
      expect.stringContaining('Bạn đang xác nhận 1 vị trí khoanh vùng có biển báo giao thông hợp lệ.'),
      expect.any(Array)
    );
  });

  it('displays the required warning text below the confirmation button', async () => {
    const { getByText } = await render(
      <ReturnedSubmissionItemScreen id="test-item-999" />
    );

    expect(
      getByText(
        'Chỉ chọn nếu bạn chắc chắn rằng ảnh có biển báo hợp lệ, nếu không, hệ thống sẽ trừ điểm credits của bạn.'
      )
    ).toBeTruthy();
  });
});
